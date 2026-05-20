import { get, post, del } from "@/lib/api-client";
import { AxiosResponse } from "axios";

/* =========================
   TYPES
========================= */

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Session {
  user: User;
}

export interface LoginPayload {
  email: string;
}

export interface VerifyMagicLinkPayload {
  token: string;
}

/* =========================
   AUTH API
========================= */

export const AuthApi = {
  /*
   * Send magic link email
   */
  login: async (
    data: LoginPayload
  ): Promise<{ success: boolean }> => {
    const response = await post<{ success: boolean }>(
      "/auth/request-magic-link",
      data
    );

    return response.data;
  },

  /*
   * Verify magic link token.
   * Backend sets httpOnly cookies on success.
   */
  verifyMagicLink: async (
    data: VerifyMagicLinkPayload
  ): Promise<{ success: boolean }> => {
    const response = await post<{ success: boolean }>(
      "/auth/verify",
      data
    );

    return response.data;
  },

  /*
   * Get authenticated user.
   * Cookies are sent automatically via withCredentials.
   */
  getCurrentUser: async (): Promise<Session> => {
    const response = await get<Session>("/auth/me");

    return response.data;
  },

  /*
   * Refresh session.
   * The refresh token cookie is sent automatically — no body needed.
   * Usually triggered by the axios response interceptor on 401.
   */
  refreshSession: async (): Promise<{ success: boolean }> => {
    const response = await post<{ success: boolean }>("/auth/refresh");

    return response.data;
  },

  /*
   * Logout current session.
   * The refresh token cookie is sent and cleared automatically.
   */
  logout: async (): Promise<{ success: boolean }> => {
    const response = await post<{ success: boolean }>("/auth/logout");

    return response.data;
  },

  /*
   * Get active sessions/devices
   */
  getSessions: async (): Promise<AxiosResponse> => {
    return get("/auth/sessions");
  },

  /*
   * Revoke a device session
   */
  revokeSession: async (
    sessionId: string
  ): Promise<{ success: boolean }> => {
    const response = await del<{ success: boolean }>(
      `/auth/sessions/${sessionId}`
    );

    return response.data;
  },
};