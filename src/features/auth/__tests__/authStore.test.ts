import { afterEach, describe, expect, it, vi } from 'vitest';
import { authStore } from '../authStore';
import { authService } from '../services/authService';
import type { AuthUser } from '../types';

const user: AuthUser = { id: 1, username: 'ana', nombre: 'Ana', email: 'ana@example.com', roles: [], es_admin_central: false, permisos: [] };

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  authStore.setState({ accessToken: null, refreshToken: null, user: null, status: 'anonimo' });
});

describe('sesión JWT', () => {
  it('persiste solamente tokens y elimina inmediatamente la sesión al salir', () => {
    vi.spyOn(authService, 'logout').mockResolvedValue();
    authStore.getState().login({ access: 'access', refresh: 'refresh' }, user);
    expect(localStorage.getItem('accessToken')).toBe('access');
    expect(authStore.getState().status).toBe('autenticado');
    authStore.getState().logout();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(authStore.getState().user).toBeNull();
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
  it('comparte restauraciones concurrentes y consulta el usuario actual al servidor', async () => {
    const yo = vi.spyOn(authService, 'obtenerYo').mockResolvedValue(user);
    authStore.setState({ accessToken: 'access', refreshToken: 'refresh', status: 'cargando' });
    await Promise.all([authStore.getState().restaurarSesion(), authStore.getState().restaurarSesion()]);
    expect(yo).toHaveBeenCalledTimes(1);
    expect(authStore.getState().user).toEqual(user);
    expect(authStore.getState().status).toBe('autenticado');
  });
  it('no restablece una sesión cerrada durante la consulta del usuario', async () => {
    vi.spyOn(authService, 'logout').mockResolvedValue();
    let complete!: (value: AuthUser) => void;
    vi.spyOn(authService, 'obtenerYo').mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    authStore.setState({ accessToken: 'access', refreshToken: 'refresh', status: 'cargando' });
    const restoration = authStore.getState().restaurarSesion();
    authStore.getState().logout();
    complete(user);
    await restoration;
    expect(authStore.getState().status).toBe('anonimo');
    expect(authStore.getState().user).toBeNull();
  });
});
