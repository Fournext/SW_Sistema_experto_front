import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../services/httpClient';
import { authStore } from '../authStore';
import { authService } from '../services/authService';

const originalAdapter = httpClient.defaults.adapter;
afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
  authStore.setState({ accessToken: null, refreshToken: null, user: null, status: 'anonimo' });
  localStorage.clear();
});

function failure(config: InternalAxiosRequestConfig, status: number): never {
  throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    config, status, statusText: 'Unauthorized', headers: new AxiosHeaders(), data: { detail: 'Acceso denegado' },
  });
}

describe('transporte JWT', () => {
  it('no cierra ni reutiliza una sesión nueva cuando termina una renovación anterior', async () => {
    authStore.setState({ accessToken: 'old', refreshToken: 'refresh-old', status: 'autenticado' });
    let complete!: (tokens: { access: string }) => void;
    const refresh = vi.spyOn(authService, 'refreshToken').mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    httpClient.defaults.adapter = (async config => failure(config, 401)) as AxiosAdapter;
    const oldRequest = httpClient.get('/old-session/');
    const rejection = expect(oldRequest).rejects.toThrow('La sesión ha cambiado');
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    authStore.getState().login({ access: 'replacement', refresh: 'replacement-refresh' }, {
      id: 2, username: 'new', nombre: 'New', email: 'new@example.com', roles: [], permisos: [], es_admin_central: false,
    });
    complete({ access: 'obsolete' });
    await rejection;
    expect(authStore.getState().status).toBe('autenticado');
    expect(authStore.getState().accessToken).toBe('replacement');
    expect(authStore.getState().user?.id).toBe(2);
  });
  it('comparte la renovación entre solicitudes concurrentes, rota tokens y reintenta con Bearer', async () => {
    authStore.setState({ accessToken: 'old', refreshToken: 'refresh-old', status: 'autenticado' });
    const refresh = vi.spyOn(authService, 'refreshToken').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { access: 'new', refresh: 'refresh-new' };
    });
    let authorized = 0;
    httpClient.defaults.adapter = (async config => {
      if (config.headers.get('Authorization') !== 'Bearer new') return failure(config, 401);
      authorized++;
      return { config, status: 200, statusText: 'OK', headers: new AxiosHeaders(), data: { success: true, data: { ok: true } } };
    }) as AxiosAdapter;
    const responses = await Promise.all([httpClient.get('/one/'), httpClient.get('/two/')]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(authorized).toBe(2);
    expect(responses.map(r => r.data)).toEqual([{ ok: true }, { ok: true }]);
    expect(authStore.getState().refreshToken).toBe('refresh-new');
    expect(localStorage.getItem('accessToken')).toBe('new');
  });
  it('no renueva ni cierra una sesión ante permisos insuficientes (403)', async () => {
    authStore.setState({ accessToken: 'valid', refreshToken: 'refresh', status: 'autenticado' });
    const refresh = vi.spyOn(authService, 'refreshToken');
    httpClient.defaults.adapter = (async config => failure(config, 403)) as AxiosAdapter;
    await expect(httpClient.get('/restricted/')).rejects.toThrow('Acceso denegado');
    expect(refresh).not.toHaveBeenCalled();
    expect(authStore.getState().status).toBe('autenticado');
  });
});
