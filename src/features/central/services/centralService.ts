import httpClient from '../../../services/httpClient';

export interface CentralRole { id: number; nombre: string; descripcion?: string; permisos: string[]; usuarios_count?: number }
export interface CentralUser { id: number; username: string; nombre: string; email: string; is_active: boolean; roles: CentralRole[] }
export interface CentralSession { id: number | string; usuario: string; ip: string; fecha_inicio: string; ultimo_acceso?: string; activa: boolean }
export interface CentralEvent { id: number; usuario: string; evento: string; ip: string; fecha: string; resultado: string }
export interface CentralPanel { usuarios_activos: number; roles: number; sesiones_activas: number; total_accesos: number; accesos_recientes: CentralEvent[] }
export type UserPayload = { nombre: string; username: string; email: string; roles: number[]; password?: string; is_active: boolean };
const list = <T>(data: T[] | { results: T[] }): T[] => Array.isArray(data) ? data : data.results;
export const centralService = {
  panel: async () => (await httpClient.get<CentralPanel>('/central/panel/')).data,
  usuarios: async () => list((await httpClient.get<CentralUser[] | { results: CentralUser[] }>('/central/usuarios/')).data),
  guardarUsuario: async (data: UserPayload, id?: number) => id === undefined ? httpClient.post('/central/usuarios/', data) : httpClient.patch(`/central/usuarios/${id}/`, data),
  estadoUsuario: (id: number, is_active: boolean) => httpClient.patch(`/central/usuarios/${id}/`, { is_active }),
  password: (id: number, password: string) => httpClient.post(`/central/usuarios/${id}/restablecer-password/`, { password }),
  roles: async () => list((await httpClient.get<CentralRole[] | { results: CentralRole[] }>('/central/roles/')).data),
  guardarRol: (data: Omit<CentralRole, 'id'>, id?: number) => id === undefined ? httpClient.post('/central/roles/', data) : httpClient.patch(`/central/roles/${id}/`, data),
  eliminarRol: (id: number) => httpClient.delete(`/central/roles/${id}/`),
  sesiones: async () => list((await httpClient.get<CentralSession[] | { results: CentralSession[] }>('/central/sesiones/')).data),
  revocarSesion: (id: number | string) => httpClient.post(`/central/sesiones/${id}/revocar/`),
  bitacora: async () => list((await httpClient.get<CentralEvent[] | { results: CentralEvent[] }>('/central/bitacora/')).data),
};
