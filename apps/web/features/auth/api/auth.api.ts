import { get, post, del } from "@/lib/api-client";
import { OnboardingStatus } from "@/lib/enums/onboarding";
import { AxiosResponse } from "axios";

/* =========================
   TYPES
========================= */

export interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
}

function unwrapEnvelope<T>(body: unknown): T {
  if (!body || typeof body !== "object") return body as T;
  const maybeEnvelope = body as Partial<ApiEnvelope<T>>;
  if ("data" in maybeEnvelope && maybeEnvelope.data !== undefined) {
    return maybeEnvelope.data as T;
  }
  return body as T;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  profile?: {
    onboardingStatus: OnboardingStatus;
  } | null;
  
}

export interface SessionData {
  user: User;
}

export type Session = SessionData;

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

    return unwrapEnvelope<{ success: boolean }>(response.data);
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

    return unwrapEnvelope<{ success: boolean }>(response.data);
  },

  /*
   * Get authenticated user.
   * Cookies are sent automatically via withCredentials.
   */
  getCurrentUser: async (): Promise<Session> => {
    const response = await get<ApiEnvelope<SessionData> | SessionData>("/auth/me");
    return unwrapEnvelope<SessionData>(response.data);
  },

  /*
   * Refresh session.
   * The refresh token cookie is sent automatically — no body needed.
   * Usually triggered by the axios response interceptor on 401.
   */
  refreshSession: async (): Promise<{ success: boolean }> => {
    const response = await post<{ success: boolean }>("/auth/refresh");

    return unwrapEnvelope<{ success: boolean }>(response.data);
  },

  /*
   * Logout current session.
   * The refresh token cookie is sent and cleared automatically.
   */
  logout: async (): Promise<{ success: boolean }> => {
    const response = await post<{ success: boolean }>("/auth/logout");

    return unwrapEnvelope<{ success: boolean }>(response.data);
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
