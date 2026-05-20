"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthApi, type User } from "@/features/auth/api/auth.api";

/* =========================
   TYPES
========================= */

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string) => Promise<{ success: boolean }>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/* =========================
   CONTEXT
========================= */

const AuthContext = createContext<AuthContextValue | null>(null);

/* =========================
   PROVIDER
========================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error }));

  /*
   * On mount, check auth status via /auth/me.
   * Cookies (httpOnly) are sent automatically with withCredentials.
   */
  const refreshUser = useCallback(async () => {
    try {
      const session = await AuthApi.getCurrentUser();

      setState({
        user: session.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /*
   * Request a magic link to be sent to the given email.
   */
  const login = useCallback(async (email: string) => {
    setError(null);

    try {
      const result = await AuthApi.login({ email });
      return result;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send login link";
      setError(message);
      throw err;
    }
  }, []);

  /*
   * Verify a magic link token and authenticate the user.
   * Backend sets httpOnly cookies on success.
   */
  const verifyMagicLink = useCallback(
    async (token: string) => {
      setError(null);
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await AuthApi.verifyMagicLink({ token });

        // Cookies are set by the backend — now fetch user
        const session = await AuthApi.getCurrentUser();

        setState({
          user: session.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        router.push("/dashboard");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Invalid or expired link";
        setError(message);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
        throw err;
      }
    },
    [router]
  );

  /*
   * Log out the current user.
   */
  const logout = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      router.push("/auth/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        verifyMagicLink,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
