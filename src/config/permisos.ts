import { useAuthStore, type AuthUser } from '../features/auth/authStore';
import { useContext } from 'react';
import { PermisosTrabajoContext } from '@/shared/context/PermisosTrabajoContext';

const slug = (import.meta.env.VITE_SISTEMA_SLUG || 'sistema-experto')
  .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sistema_experto';
export const PREFIJO_PERMISOS = `${slug}_`;

const grupos = {
  'Sistemas expertos': ['sistemas_ver', 'sistemas_crear', 'sistemas_editar', 'sistemas_eliminar'],
  'Base de conocimiento': ['base_conocimiento_ver', 'hechos_ver', 'hechos_crear', 'hechos_editar', 'hechos_eliminar', 'variables_ver', 'variables_crear', 'variables_editar', 'variables_eliminar', 'reglas_ver', 'reglas_crear', 'reglas_editar', 'reglas_eliminar'],
  'Editor visual': ['editor_ver', 'editor_nodos_crear', 'editor_nodos_editar', 'editor_nodos_eliminar', 'editor_conexiones_crear', 'editor_conexiones_editar', 'editor_conexiones_eliminar'],
  Inferencia: ['inferencia_ejecutar', 'simulacion_iniciar', 'simulacion_controlar', 'inferencia_historial_ver', 'inferencia_trazabilidad_ver', 'inferencia_explicacion_ver'],
  Validación: ['validacion_ejecutar', 'validacion_ver'],
  Actividades: ['cursos_ver', 'cursos_crear', 'actividades_ver', 'actividades_crear', 'actividades_editar', 'actividades_eliminar', 'asignaciones_ver', 'asignaciones_crear', 'entregas_ver_todas', 'actividades_resolver', 'entregas_enviar'],
  'Admin Central': ['central_acceder', 'central_usuarios_ver', 'central_usuarios_crear', 'central_usuarios_editar', 'central_usuarios_desactivar', 'central_roles_ver', 'central_roles_crear', 'central_roles_editar', 'central_roles_eliminar', 'central_permisos_ver', 'central_sesiones_ver', 'central_sesiones_revocar', 'central_bitacora_ver'],
} as const;

type Codigo = typeof grupos[keyof typeof grupos][number];
export const Permisos = Object.fromEntries(Object.values(grupos).flat().map(codigo => [codigo.toUpperCase(), `${PREFIJO_PERMISOS}${codigo}`])) as { readonly [K in Codigo as Uppercase<K>]: string };

export const CATALOGO_PERMISOS = Object.entries(grupos).flatMap(([modulo, codigos]) =>
  codigos.map(codigo => ({
    codigo: `${PREFIJO_PERMISOS}${codigo}`,
    nombre: codigo.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()),
    modulo,
    recurso: codigo.replace(/_(ver_todas|ver|crear|editar|eliminar|ejecutar|iniciar|controlar|resolver|enviar|acceder|desactivar|revocar)$/, ''),
  })),
);

/** All requested permissions must be present. Central administration is not a wildcard. */
export function userHasPermission(user: Pick<AuthUser, 'permisos'> | null | undefined, permisos: readonly string[]): boolean {
  return !!user && permisos.every(permiso => user.permisos.includes(permiso));
}

export function usePuede(...permisos: string[]): boolean {
  const contextual = useContext(PermisosTrabajoContext);
  const global = useAuthStore(state => userHasPermission(state.user, permisos));
  return contextual ? permisos.every((permiso) => contextual.has(permiso)) : global;
}
