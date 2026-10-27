import type { AuthTokens } from './types';

export function readTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    return { accessToken: localStorage.getItem('accessToken'), refreshToken: localStorage.getItem('refreshToken') };
  } catch { return { accessToken: null, refreshToken: null }; }
}

export function saveTokens(tokens: AuthTokens | null): void {
  try {
    if (tokens) {
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  } catch { /* An in-memory session remains usable when browser storage is disabled. */ }
}
