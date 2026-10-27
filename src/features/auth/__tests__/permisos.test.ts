import { describe, expect, it } from 'vitest';
import { CATALOGO_PERMISOS, Permisos, PREFIJO_PERMISOS, userHasPermission } from '../../../config/permisos';
import { destinoPostLogin } from '../utils/destinoPostLogin';
import type { AuthUser } from '../types';

const user: AuthUser = { id: 1, username: 'ana', nombre: 'Ana', email: 'ana@example.com', roles: ['estudiante'], es_admin_central: false, permisos: [] };

describe('catálogo y autorización', () => {
  it('declara 56 códigos únicos con el prefijo del sistema', () => {
    expect(CATALOGO_PERMISOS).toHaveLength(56);
    expect(new Set(CATALOGO_PERMISOS.map(p => p.codigo)).size).toBe(56);
    expect(CATALOGO_PERMISOS.every(p => p.codigo.startsWith(PREFIJO_PERMISOS))).toBe(true);
  });
  it('requiere cada permiso y no concede privilegios por rol o bandera administrativa', () => {
    const admin = { ...user, es_admin_central: true, permisos: [Permisos.SISTEMAS_VER] };
    expect(userHasPermission(admin, [Permisos.SISTEMAS_VER])).toBe(true);
    expect(userHasPermission(admin, [Permisos.SISTEMAS_VER, Permisos.SISTEMAS_EDITAR])).toBe(false);
    expect(userHasPermission(null, [])).toBe(false);
  });
});

describe('destino después de autenticarse', () => {
  it('prioriza el panel de administradores', () => {
    expect(destinoPostLogin({ ...user, es_admin_central: true }, '/sistemas')).toBe('/central');
  });
  it('selecciona la bandeja del estudiante y el espacio docente', () => {
    const estudiante = { ...user, permisos: [Permisos.ACTIVIDADES_RESOLVER] };
    expect(destinoPostLogin(estudiante)).toBe('/cursos');
    expect(destinoPostLogin({ ...estudiante, permisos: [...estudiante.permisos, Permisos.ACTIVIDADES_VER] })).toBe('/sistemas');
    expect(destinoPostLogin(estudiante, '/mis-actividades?curso=2')).toBe('/mis-actividades?curso=2');
  });
  it.each(['https://example.com', '//example.com', '/\\example.com', '/%2fexample.com', '/central', '/central/login', '/central%2fusuarios', '/a/../central/usuarios', '/central?foo=bar', '/%zz'])('rechaza destinos inseguros o del panel: %s', next => {
    expect(destinoPostLogin(user, next)).toBe('/sistemas');
  });
});
