import axios, { type AxiosError, type AxiosInstance } from "axios";

// The single Axios instance every src/api/*.ts module uses. Components never
// call axios directly — see docs/04-engineering/CODING_STANDARDS.md#frontend-frontend.
//
// Access token lives only in memory (module-level variable), never
// localStorage — see docs/04-engineering/SECURITY.md#token-storage. The
// refresh token is an httpOnly cookie the browser attaches automatically
// (`withCredentials: true`) and this module never touches directly.

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// In local dev, Vite's dev-server proxy (vite.config.ts) forwards the
// relative "/api" path to the backend, so no env var is needed. The Docker
// Compose build serves a static production bundle with no such proxy, so it
// bakes in an absolute API origin via VITE_API_BASE_URL at build time — see
// docs/05-operations/DEPLOYMENT.md.
const apiOrigin = import.meta.env.VITE_API_BASE_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiOrigin ? `${apiOrigin}/api` : "/api",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<{ accessToken: string }>(
    `${apiOrigin ?? ""}/api/auth/refresh`,
    {},
    { withCredentials: true },
  );
  setAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const isAuthRoute = originalRequest?.url?.includes("/auth/");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthRoute) {
      originalRequest._retried = true;
      try {
        refreshPromise ??= refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
