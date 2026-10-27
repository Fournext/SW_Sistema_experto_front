import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import actividadesService from '../services/actividadesService';
import type { DatosActividad, Curso } from '../types/types';

export const CURSOS_KEY = 'cursos';
export const ACTIVIDADES_KEY = 'actividades';
export const ACTIVIDAD_DETAIL_KEY = 'actividad-detail';
export const ASIGNACIONES_KEY = 'asignaciones';
export const ESTUDIANTE_ACTIVIDADES_KEY = 'estudiante-actividades';
export const ENTREGA_ESTUDIANTE_KEY = 'entrega-estudiante';
export const CONTEXTO_ACTIVIDAD_KEY = 'contexto-actividad';

export const useCurso = (id?: string) => useQuery({
  queryKey: [CURSOS_KEY, id], queryFn: () => actividadesService.obtenerCurso(id!), enabled: Boolean(id),
});
export const useMiembrosCurso = (id?: string, enabled = true) => useQuery({
  queryKey: [CURSOS_KEY, id, 'miembros'], queryFn: () => actividadesService.listarMiembros(id!), enabled: Boolean(id) && enabled,
});
export const useContextoActividad = (id?: string) => useQuery({
  queryKey: [CONTEXTO_ACTIVIDAD_KEY, id], queryFn: () => actividadesService.obtenerContexto(id!), enabled: Boolean(id),
  refetchInterval: 30000,
});
export const useContextoAsignacion = useContextoActividad;
export const useEntregasDocente = (id?: string) => useQuery({
  queryKey: ['entregas-docente', id], queryFn: () => actividadesService.listarEntregas(id!), enabled: Boolean(id),
});
export const useDetalleEntregaDocente = (id?: string) => useQuery({
  queryKey: ['entrega-docente', id], queryFn: () => actividadesService.detalleEntrega(id!), enabled: Boolean(id),
});
export const useActualizarCurso = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, datos }: { id: string; datos: Partial<Pick<Curso, 'nombre' | 'codigo' | 'descripcion' | 'activo'>> }) => actividadesService.actualizarCurso(id, datos),
    onSuccess: () => client.invalidateQueries({ queryKey: [CURSOS_KEY] }) });
};
export const useUnirseCurso = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: (datos: { codigo?: string; token?: string }) => actividadesService.unirseCurso(datos),
    onSuccess: () => { client.invalidateQueries({ queryKey: [CURSOS_KEY] }); client.invalidateQueries({ queryKey: [ESTUDIANTE_ACTIVIDADES_KEY] }); } });
};

export const useCursos = () => {
  return useQuery({
    queryKey: [CURSOS_KEY],
    queryFn: () => actividadesService.listarCursos(),
  });
};

export const useCrearCurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: { codigo: string; nombre: string; descripcion?: string }) =>
      actividadesService.crearCurso(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CURSOS_KEY] }),
  });
};

export const useActividades = (estado?: string) => {
  return useQuery({
    queryKey: [ACTIVIDADES_KEY, estado],
    queryFn: () => actividadesService.listarActividades(estado),
  });
};

export const useActividad = (id: string | undefined) => {
  return useQuery({
    queryKey: [ACTIVIDAD_DETAIL_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('ID requerido');
      return actividadesService.obtenerActividad(id);
    },
    enabled: Boolean(id),
  });
};

export const useCrearActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosActividad) => actividadesService.crearActividad(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASIGNACIONES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CURSOS_KEY] });
    },
  });
};

export const useActualizarActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: string;
      datos: Partial<DatosActividad>;
    }) => actividadesService.actualizarActividad(id, datos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVIDAD_DETAIL_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CURSOS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTEXTO_ACTIVIDAD_KEY] });
    },
  });
};

export const useDesactivarActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actividadesService.desactivarActividad(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASIGNACIONES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CURSOS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ESTUDIANTE_ACTIVIDADES_KEY] });
    },
  });
};

export const useAsignaciones = (params?: { curso_id?: string; actividad_id?: string }) => {
  return useQuery({
    queryKey: [ASIGNACIONES_KEY, params],
    queryFn: () => actividadesService.listarAsignaciones(params),
  });
};

export const useAsignarActividad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: {
      actividad_id: string;
      curso_id: string;
      fecha_limite?: string | null;
    }) => actividadesService.asignarActividad(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASIGNACIONES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CURSOS_KEY] });
    },
  });
};

export const useActividadesEstudiante = () => {
  return useQuery({
    queryKey: [ESTUDIANTE_ACTIVIDADES_KEY],
    queryFn: () => actividadesService.listarActividadesEstudiante(),
  });
};

export const useEntregaEstudiante = (asignacionId: string | undefined) => {
  return useQuery({
    queryKey: [ENTREGA_ESTUDIANTE_KEY, asignacionId],
    queryFn: () => {
      if (!asignacionId) throw new Error('ID de asignación requerido');
      return actividadesService.obtenerEntrega(asignacionId);
    },
    enabled: Boolean(asignacionId),
  });
};

export const useGuardarBorrador = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      asignacionId,
      datos,
    }: {
      asignacionId: string;
      datos: {
        solucion_texto?: string;
        hechos_ingresados?: Array<{ nombre: string; valor: unknown }>;
        ejecucion_inferencia_id?: string | null;
        ejecuciones_ids?: string[];
      };
    }) => actividadesService.guardarBorrador(asignacionId, datos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ENTREGA_ESTUDIANTE_KEY, variables.asignacionId],
      });
      queryClient.invalidateQueries({ queryKey: [ESTUDIANTE_ACTIVIDADES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTEXTO_ACTIVIDAD_KEY, variables.asignacionId] });
    },
  });
};

export const useEnviarEntrega = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      asignacionId,
      datos,
    }: {
      asignacionId: string;
      datos: {
        solucion_texto?: string;
        hechos_ingresados?: Array<{ nombre: string; valor: unknown }>;
        ejecucion_inferencia_id?: string | null;
        ejecuciones_ids?: string[];
      };
    }) => actividadesService.enviarEntrega(asignacionId, datos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ENTREGA_ESTUDIANTE_KEY, variables.asignacionId],
      });
      queryClient.invalidateQueries({ queryKey: [ESTUDIANTE_ACTIVIDADES_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTEXTO_ACTIVIDAD_KEY, variables.asignacionId] });
    },
  });
};
