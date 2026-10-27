import { create } from 'zustand';
import { authService } from './services/authService';
import { readTokens, saveTokens } from './sessionStorage';
import type { AuthTokens, AuthUser } from './types';
export type { AuthUser, AuthTokens } from './types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: 'cargando' | 'autenticado' | 'anonimo';
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
  restaurarSesion: () => Promise<void>;
  actualizarUsuario: () => Promise<void>;
  actualizarTokens: (tokens: AuthTokens) => void;
}

let restoration: Promise<void> | null = null;
let sessionVersion = 0;
export function getSessionVersion(): number { return sessionVersion; }

export const useAuthStore = create<AuthState>((set, get) => ({
  ...readTokens(),
  user: null,
  status: 'cargando',
  login(tokens, user) {
    sessionVersion++;
    saveTokens(tokens);
    set({ accessToken: tokens.access, refreshToken: tokens.refresh, user, status: 'autenticado' });
  },
  actualizarTokens(tokens) {
    saveTokens(tokens);
    set({ accessToken: tokens.access, refreshToken: tokens.refresh });
  },
  logout() {
    const tokens = { accessToken: get().accessToken, refreshToken: get().refreshToken };
    sessionVersion++;
    saveTokens(null);
    set({ accessToken: null, refreshToken: null, user: null, status: 'anonimo' });
    if (tokens.refreshToken) void authService.logout(tokens).catch(() => undefined);
  },
  async restaurarSesion() {
    if (restoration) return restoration;
    if (get().status === 'autenticado') return;
    const version = sessionVersion;
    if (!get().accessToken && !get().refreshToken) {
      set({ status: 'anonimo' });
      return;
    }
    set({ status: 'cargando' });
    restoration = (async () => {
      try {
        if (!get().accessToken) {
          const tokens = await authService.refreshToken(get().refreshToken);
          if (version !== sessionVersion) return;
          get().actualizarTokens({ access: tokens.access, refresh: tokens.refresh || get().refreshToken! });
        }
        const user = await authService.obtenerYo();
        if (version === sessionVersion) set({ user, status: 'autenticado' });
      } catch {
        if (version === sessionVersion) get().logout();
      } finally { restoration = null; }
    })();
    return restoration;
  },
  async actualizarUsuario() {
    const version = sessionVersion;
    const user = await authService.obtenerYo();
    if (version === sessionVersion && get().accessToken) set({ user, status: 'autenticado' });
  },
}));

export const authStore = useAuthStore;
