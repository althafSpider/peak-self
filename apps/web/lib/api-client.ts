import axios, {
  AxiosError,
  AxiosRequestConfig,
} from "axios";

interface RetryableRequest {
  url?: string;
  headers?: Record<string, string>;
  _retry?: boolean;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * Response interceptor: on 401, attempt to refresh the session.
 * Cookies (httpOnly) are sent automatically via withCredentials.
 * If refresh fails, the error propagates to the calling code
 * (auth context / ProtectedRoute) which handles redirection
 * via client-side navigation — no hard reloads.
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as unknown as RetryableRequest;

    const status = error.response?.status;

    const isRefreshRequest =
      originalRequest?.url?.includes("/auth/refresh");

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        // Refresh token cookie is sent automatically
        await api.post("/auth/refresh");

        // Retry original request with refreshed cookies
        return api(originalRequest);
      } catch {
        // Let the error propagate — application code handles
        // redirection via ProtectedRoute / auth context
        return Promise.reject(error);
      }
    }

    return Promise.reject(
      normalizeApiError(error)
    );
  }
);



function normalizeApiError(
  error: AxiosError
) {
  return {
    message:
      (error.response?.data as any)
        ?.message ||
      error.message ||
      "Something went wrong",

    status: error.response?.status,

    data: error.response?.data,
  };
}

export const get = <T>(
  url: string,
  config?: AxiosRequestConfig
) =>
  api.get<T>(url, config);

export const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) =>
  api.post<T>(url, data, config);

export const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) =>
  api.put<T>(url, data, config);

export const patch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) =>
  api.patch<T>(url, data, config);

export const del = <T>(
  url: string,
  config?: AxiosRequestConfig
) =>
  api.delete<T>(url, config);