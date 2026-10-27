import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { authStore, getSessionVersion } from '../features/auth/authStore';
import { authService } from '../features/auth/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

type RetriableRequest = InternalAxiosRequestConfig & { _authRetry?: boolean; _sessionVersion?: number };
let refreshing: { version: number; promise: Promise<string> } | null = null;

httpClient.interceptors.request.use(config => {
  const state = authStore.getState();
  const token = state.accessToken;
  (config as RetriableRequest)._sessionVersion = getSessionVersion();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && window.location.pathname !== '/central/login') {
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/central/login?next=${encodeURIComponent(next)}`);
  }
}

httpClient.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error: AxiosError<{ detail?: string; error?: string; message?: string }>) => {
    const request = error.config as RetriableRequest | undefined;
    if (error.response?.status === 401 && request) {
      if (request._sessionVersion !== getSessionVersion()) {
        return Promise.reject(new Error('La sesión ha cambiado. Vuelve a realizar la operación.'));
      }
      const currentAccess = authStore.getState().accessToken;
      if (!request._authRetry && currentAccess && request.headers.get('Authorization') !== `Bearer ${currentAccess}`) {
        request._authRetry = true;
        return httpClient.request(request);
      }
      if (!request._authRetry && authStore.getState().refreshToken) {
        request._authRetry = true;
        const originalRefresh = authStore.getState().refreshToken!;
        const version = getSessionVersion();
        try {
          if (!refreshing || refreshing.version !== version) {
            const promise = authService.refreshToken(originalRefresh).then(tokens => {
              // A completed refresh cannot resurrect a logged-out or replaced session.
              if (getSessionVersion() !== version) throw new Error('La sesión ha cambiado.');
              authStore.getState().actualizarTokens({ access: tokens.access, refresh: tokens.refresh || originalRefresh });
              return tokens.access;
            }).finally(() => { if (refreshing?.promise === promise) refreshing = null; });
            refreshing = { version, promise };
          }
          const access = await refreshing.promise;
          if (getSessionVersion() !== version) {
            return Promise.reject(new Error('La sesión ha cambiado. Vuelve a realizar la operación.'));
          }
          request.headers.set('Authorization', `Bearer ${access}`);
          return httpClient.request(request);
        } catch {
          if (getSessionVersion() !== version) {
            return Promise.reject(new Error('La sesión ha cambiado. Vuelve a realizar la operación.'));
          }
          authStore.getState().logout();
          redirectToLogin();
          return Promise.reject(new Error('La sesión ha expirado. Inicia sesión nuevamente.'));
        }
      }
      authStore.getState().logout();
      redirectToLogin();
    }
    const data = error.response?.data;
    const message = data?.detail || data?.error || data?.message || (error.request
      ? `No se pudo conectar con el servidor. Verifica que esté ejecutándose en ${API_BASE_URL}`
      : 'Ocurrió un error inesperado en la comunicación con el servidor.');
    return Promise.reject(new Error(message));
  },
);

export default httpClient;
