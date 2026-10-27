import axios from 'axios';
import httpClient from '../../../services/httpClient';
import { readTokens } from '../sessionStorage';
import type { AuthUser, LoginResponse, RegistroEstudianteData } from '../types';

// A separate client prevents authentication failures from recursively refreshing themselves.
const authClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1', timeout: 20000 });
authClient.interceptors.response.use(response => {
  if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
    response.data = response.data.data;
  }
  return response;
}, error => {
  const data = error.response?.data;
  const detail = data?.detail || data?.message || data?.error;
  const fields = data && typeof data === 'object'
    ? Object.entries(data).flatMap(([field, value]) => {
      if (typeof value === 'string') return [`${field}: ${value}`];
      if (Array.isArray(value)) return [`${field}: ${value.join(' ')}`];
      return [];
    }).join(' · ')
    : '';
  return Promise.reject(new Error(typeof detail === 'string' ? detail : fields || 'No se pudo completar la autenticación. Inténtalo nuevamente.'));
});

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    return (await authClient.post<LoginResponse>('/auth/login/', { username, password })).data;
  },
  async registroEstudiante(data: RegistroEstudianteData): Promise<Partial<LoginResponse> & { detail?: string; message?: string }> {
    return (await authClient.post('/auth/registro-estudiante/', data)).data;
  },
  async refreshToken(refresh = readTokens().refreshToken): Promise<{ access: string; refresh?: string }> {
    if (!refresh) throw new Error('No hay una sesión para renovar.');
    const result = (await authClient.post('/auth/token/refresh/', { refresh })).data;
    if (!result?.access || typeof result.access !== 'string') throw new Error('El servidor no devolvió un token válido.');
    return result;
  },
  async obtenerYo(): Promise<AuthUser> {
    return (await httpClient.get<AuthUser>('/auth/yo/')).data;
  },
  async logout(tokens = readTokens()): Promise<void> {
    await authClient.post('/auth/logout/', { refresh: tokens.refreshToken }, {
      headers: tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : undefined,
    });
  },
};

export default authService;
