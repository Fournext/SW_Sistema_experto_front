import httpClient from '@/services/httpClient';
import type {
  ActividadEducativa,
  ActividadEstudianteResumen,
  AsignacionActividad,
  Curso,
  EntregaActividad,
  DatosActividad, MiembroCurso, ContextoActividad, ResumenEntregaDocente, DetalleEntregaDocente, ComentarioEntrega,
} from '../types/types';

const unwrapData = <T>(res: unknown): T => {
  if (!res) return res as T;
  const obj = res as Record<string, unknown>;
  if (obj && typeof obj === 'object' && 'data' in obj) {
    return obj.data as T;
  }
  return res as T;
};

const unwrapList = <T>(res: unknown): T[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (typeof res === 'object') {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
};

export const actividadesService = {
  // --- Cursos ---
  async listarCursos(): Promise<Curso[]> {
    const response = await httpClient.get<unknown>('/cursos/');
    return unwrapList<Curso>(response.data);
  },

  async crearCurso(datos: { codigo: string; nombre: string; descripcion?: string }): Promise<Curso> {
    const response = await httpClient.post<unknown>('/cursos/', datos);
    return unwrapData<Curso>(response.data);
  },
  async obtenerCurso(id: string): Promise<Curso> {
    return unwrapData<Curso>((await httpClient.get(`/cursos/${id}/`)).data);
  },
  async actualizarCurso(id: string, datos: Partial<Pick<Curso, 'nombre' | 'codigo' | 'descripcion' | 'activo'>>): Promise<Curso> {
    return unwrapData<Curso>((await httpClient.patch(`/cursos/${id}/`, datos)).data);
  },
  async unirseCurso(datos: { codigo?: string; token?: string }): Promise<Curso> {
    return unwrapData<Curso>((await httpClient.post('/cursos/unirse/', datos)).data);
  },
  async regenerarInvitacion(id: string): Promise<Curso> {
    return unwrapData<Curso>((await httpClient.post(`/cursos/${id}/invitacion/regenerar/`, {})).data);
  },
  async listarMiembros(id: string): Promise<MiembroCurso[]> {
    return unwrapList<MiembroCurso>((await httpClient.get(`/cursos/${id}/miembros/`)).data);
  },
  async actualizarMiembro(id: string, estudianteId: number, activo: boolean): Promise<MiembroCurso> {
    return unwrapData<MiembroCurso>((await httpClient.patch(`/cursos/${id}/miembros/${estudianteId}/`, { activo })).data);
  },

  // --- Actividades Docente ---
  async listarActividades(estado?: string): Promise<ActividadEducativa[]> {
    const response = await httpClient.get<unknown>('/actividades/', {
      params: estado ? { estado } : undefined,
    });
    return unwrapList<ActividadEducativa>(response.data);
  },

  async obtenerActividad(id: string): Promise<ActividadEducativa> {
    const response = await httpClient.get<unknown>(`/actividades/${id}/`);
    return unwrapData<ActividadEducativa>(response.data);
  },

  async crearActividad(datos: DatosActividad): Promise<ActividadEducativa> {
    const response = await httpClient.post<unknown>('/actividades/', datos);
    return unwrapData<ActividadEducativa>(response.data);
  },

  async actualizarActividad(
    id: string,
    datos: Partial<DatosActividad>
  ): Promise<ActividadEducativa> {
    const response = await httpClient.put<unknown>(`/actividades/${id}/`, datos);
    return unwrapData<ActividadEducativa>(response.data);
  },

  async desactivarActividad(id: string): Promise<void> {
    await httpClient.delete(`/actividades/${id}/`);
  },

  // --- Asignaciones ---
  async listarAsignaciones(params?: {
    curso_id?: string;
    actividad_id?: string;
  }): Promise<AsignacionActividad[]> {
    const response = await httpClient.get<unknown>('/asignaciones/', { params });
    return unwrapList<AsignacionActividad>(response.data);
  },

  async asignarActividad(datos: {
    actividad_id: string;
    curso_id: string;
    fecha_limite?: string | null;
  }): Promise<AsignacionActividad> {
    const response = await httpClient.post<unknown>('/asignaciones/', datos);
    return unwrapData<AsignacionActividad>(response.data);
  },

  // --- Estudiante y Resolución ---
  async listarActividadesEstudiante(): Promise<ActividadEstudianteResumen[]> {
    const response = await httpClient.get<unknown>('/estudiante/actividades/');
    return unwrapList<ActividadEstudianteResumen>(response.data);
  },

  async obtenerEntrega(asignacionId: string): Promise<EntregaActividad | null> {
    const response = await httpClient.get<unknown>(`/asignaciones/${asignacionId}/entrega/`);
    return unwrapData<EntregaActividad | null>(response.data);
  },

  async guardarBorrador(
    asignacionId: string,
    datos: {
      solucion_texto?: string;
      hechos_ingresados?: Array<{ nombre: string; valor: unknown }>;
      ejecucion_inferencia_id?: string | null;
      ejecuciones_ids?: string[];
    }
  ): Promise<EntregaActividad> {
    const response = await httpClient.post<unknown>(
      `/asignaciones/${asignacionId}/entrega/`,
      datos
    );
    return unwrapData<EntregaActividad>(response.data);
  },

  async enviarEntrega(
    asignacionId: string,
    datos: {
      solucion_texto?: string;
      hechos_ingresados?: Array<{ nombre: string; valor: unknown }>;
      ejecucion_inferencia_id?: string | null;
      ejecuciones_ids?: string[];
    }
  ): Promise<EntregaActividad> {
    const response = await httpClient.post<unknown>(
      `/asignaciones/${asignacionId}/enviar/`,
      datos
    );
    return unwrapData<EntregaActividad>(response.data);
  },
  async obtenerContexto(asignacionId: string): Promise<ContextoActividad> {
    const raw = unwrapData<ContextoActividad & Partial<AsignacionActividad>>((await httpClient.get(`/asignaciones/${asignacionId}/`)).data);
    return { ...raw, asignacion: raw.asignacion ?? {
      id: raw.id ?? asignacionId, actividad_id: raw.actividad.id, curso_id: raw.curso.id,
      estado: raw.estado ?? 'VIGENTE', fecha_limite: raw.fecha_limite,
    } };
  },
  async listarEntregas(asignacionId: string): Promise<ResumenEntregaDocente[]> {
    return unwrapList<ResumenEntregaDocente>((await httpClient.get(`/asignaciones/${asignacionId}/entregas/`)).data);
  },
  async detalleEntrega(id: string): Promise<DetalleEntregaDocente> {
    return unwrapData<DetalleEntregaDocente>((await httpClient.get(`/entregas/${id}/`)).data);
  },
  async comentarEntrega(id: string, datos: { texto: string; revision_id?: string }): Promise<ComentarioEntrega> {
    return unwrapData<ComentarioEntrega>((await httpClient.post(`/entregas/${id}/comentarios/`, datos)).data);
  },
  async reabrirEntrega(id: string, fecha_limite?: string | null): Promise<EntregaActividad> {
    return unwrapData<EntregaActividad>((await httpClient.post(`/entregas/${id}/reabrir/`, { fecha_limite })).data);
  },
  async actualizarAsignacion(id: string, datos: { fecha_limite?: string | null; estado?: string }): Promise<AsignacionActividad> {
    return unwrapData<AsignacionActividad>((await httpClient.patch(`/asignaciones/${id}/`, datos)).data);
  },
};

export default actividadesService;
