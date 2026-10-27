export type DificultadActividad = 'BASICA' | 'MEDIA' | 'AVANZADA';
export type EstadoActividad = 'BORRADOR' | 'PUBLICADA' | 'INACTIVA';
export type EstadoAsignacion = 'VIGENTE' | 'CERRADA';
export type EstadoEntrega = 'PENDIENTE' | 'BORRADOR' | 'ENVIADA';
export type TipoActividad = 'ANALISIS_BC' | 'CREACION_BC';
export interface PermisosActividad {
  ver_bc: boolean;
  editar_bc: boolean;
  editor_visual: boolean;
  inferencia_directa: boolean;
  simulacion: boolean;
  validacion: boolean;
  trazabilidad: boolean;
}
export const permisosPorTipo = (tipo: TipoActividad): PermisosActividad => ({
  ver_bc: true, editar_bc: tipo === 'CREACION_BC', editor_visual: tipo === 'CREACION_BC',
  inferencia_directa: tipo === 'ANALISIS_BC', simulacion: tipo === 'ANALISIS_BC',
  validacion: true, trazabilidad: tipo === 'ANALISIS_BC',
});

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  docente_id?: number;
  activo?: boolean;
  creado_en?: string;
  codigo_ingreso?: string;
  token_invitacion?: string;
  total_estudiantes?: number;
  total_actividades?: number;
  es_docente?: boolean;
  docente_nombre?: string;
  total_miembros?: number;
  matricula_activa?: boolean;
  token_ingreso?: string;
  enlace_invitacion?: string;
  asignaciones?: AsignacionActividad[];
}

export interface ActividadEducativa {
  id: string;
  docente_id?: number;
  docente_username?: string;
  sistema_experto_id: string | null;
  tipo?: TipoActividad;
  permisos?: PermisosActividad;
  sistema_experto_nombre?: string;
  titulo: string;
  instrucciones: string;
  dificultad: DificultadActividad;
  estado: EstadoActividad;
  activa: boolean;
  creada_en?: string;
  actualizada_en?: string;
}

export interface AsignacionActividad {
  id: string;
  actividad_id: string;
  actividad_titulo?: string;
  curso_id: string;
  curso_codigo?: string;
  curso_nombre?: string;
  fecha_asignacion?: string;
  fecha_limite?: string | null;
  estado: EstadoAsignacion;
}

export interface EntregaActividad {
  id: string;
  asignacion_id: string;
  estudiante_id?: number;
  estudiante_username?: string;
  estado: EstadoEntrega;
  solucion_texto?: string;
  hechos_ingresados?: Array<{ nombre: string; valor: unknown; fc?: number }>;
  ejecucion_inferencia_id?: string | null;
  ejecuciones_ids?: string[];
  fecha_envio?: string | null;
  creada_en?: string;
  actualizada_en?: string;
  numero_revision?: number;
  revisiones?: RevisionEntrega[];
  comentarios?: ComentarioEntrega[];
}

export interface ActividadEstudianteResumen {
  asignacion_id: string;
  actividad_id: string;
  actividad_titulo: string;
  curso_id: string;
  curso_codigo: string;
  curso_nombre: string;
  fecha_asignacion: string;
  fecha_limite?: string | null;
  estado_asignacion: string;
  tiene_entrega: boolean;
  estado_entrega: EstadoEntrega;
  entrega_id?: string | null;
}

export interface DatosActividad {
  curso_id?: string;
  sistema_experto_id?: string | null;
  titulo: string;
  instrucciones: string;
  dificultad: DificultadActividad;
  estado?: EstadoActividad;
  tipo: TipoActividad;
  permisos: PermisosActividad;
}
export interface MiembroCurso {
  estudiante_id: number;
  estudiante_username?: string;
  username?: string;
  nombre?: string;
  estudiante_nombre?: string;
  estudiante_email?: string;
  activo: boolean;
  fecha_inscripcion?: string;
}
export interface ComentarioEntrega {
  id: string;
  texto: string;
  autor_username?: string;
  autor_nombre?: string;
  creado_en?: string;
  revision_id?: string;
}
export interface RevisionEntrega {
  id: string;
  numero: number;
  solucion_texto?: string;
  bc_snapshot?: Record<string, unknown>;
  ejecuciones_snapshot?: unknown[];
  fecha_envio?: string;
  creada_en?: string;
  comentarios?: ComentarioEntrega[];
  snapshot?: Record<string, unknown>;
}
export interface ResumenEntregaDocente {
  estudiante_id: number;
  estudiante_username?: string;
  nombre?: string;
  estudiante_nombre?: string;
  estado: EstadoEntrega;
  entrega_id?: string | null;
  fecha_envio?: string | null;
  numero_revision?: number;
}
export interface DetalleEntregaDocente extends EntregaActividad {
  revisiones: RevisionEntrega[];
  comentarios?: ComentarioEntrega[];
}
export interface ContextoActividad {
  asignacion: AsignacionActividad;
  actividad: ActividadEducativa;
  curso: Curso;
  permisos: PermisosActividad;
  entrega: EntregaActividad | null;
  trabajo_sistema_id: string | null;
  puede_editar?: boolean;
  solo_lectura?: boolean;
  puede_trabajar?: boolean;
}
export type ContextoAsignacion = ContextoActividad;
