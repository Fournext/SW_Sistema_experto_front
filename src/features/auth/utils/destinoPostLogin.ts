import { Permisos, userHasPermission } from '../../../config/permisos';
import type { AuthUser } from '../types';

export function destinoPostLogin(user: AuthUser, next?: string | null): string {
  if (user.es_admin_central) return '/central';
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') && !Array.from(next).some(character => character.charCodeAt(0) <= 32)) {
    // Decode before checking: encoded slashes must not bypass the central boundary.
    try {
      const decoded = decodeURIComponent(next);
      const pathname = new URL(decoded, 'https://local.invalid').pathname;
      if (!decoded.startsWith('//') && !decoded.includes('\\') && !/^\/central(?:\/|$)/i.test(pathname) && pathname !== '/registro-estudiante') return next;
    } catch { /* Ignore malformed redirect destinations. */ }
  }
  return userHasPermission(user, [Permisos.ACTIVIDADES_RESOLVER]) && !userHasPermission(user, [Permisos.ACTIVIDADES_VER])
    ? '/cursos' : '/sistemas';
}
