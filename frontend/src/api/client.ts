import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from './tokens';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
  headers: { 'Content-Type': 'application/json' },
});

type RetryableRequest = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean };
let refreshRequest: Promise<string> | null = null;
let onAuthenticationFailure: (() => void) | null = null;

export function registerAuthenticationFailureHandler(handler: () => void): () => void {
  onAuthenticationFailure = handler;
  return () => {
    if (onAuthenticationFailure === handler) onAuthenticationFailure = null;
  };
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('Aucun jeton de rafraîchissement disponible.');

  const response = await api.post<{ access: string }>('/api/auth/refresh/', { refresh });
  setAccessToken(response.data.access);
  return response.data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthenticationRequest = request?.url?.includes('/api/auth/login/') || request?.url?.includes('/api/auth/refresh/');

    if (error.response?.status !== 401 || !request || request._retriedAfterRefresh || isAuthenticationRequest) {
      return Promise.reject(error);
    }

    request._retriedAfterRefresh = true;
    try {
      refreshRequest ??= refreshAccessToken().finally(() => {
        refreshRequest = null;
      });
      const accessToken = await refreshRequest;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api(request);
    } catch (refreshError) {
      clearTokens();
      onAuthenticationFailure?.();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
