import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inferenciaService from '../services/inferenciaService';
import type { IniciarInferenciaDTO } from '../types/types';

export const INFERENCIA_KEY = 'inferencia';
export const INFERENCIA_DETALLES_KEY = 'inferencia-detalles';
export const INFERENCIA_CONFLICTOS_KEY = 'inferencia-conflictos';
export const INFERENCIA_HECHOS_KEY = 'inferencia-hechos';
export const INFERENCIA_EXPLICACION_KEY = 'inferencia-explicacion';
export const INFERENCIA_HISTORIAL_KEY = 'inferencia-historial';

export const useInferencia = (inferenciaId: string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) throw new Error('ID de inferencia requerido');
      return inferenciaService.obtenerPorId(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useDetallesInferencia = (inferenciaId: string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_DETALLES_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) return [];
      return inferenciaService.obtenerDetalles(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useConflictosInferencia = (inferenciaId: string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_CONFLICTOS_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) return [];
      return inferenciaService.obtenerConflictos(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useHechosInferidos = (inferenciaId: string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_HECHOS_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) return [];
      return inferenciaService.obtenerHechosInferidos(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useExplicacionConclusion = (inferenciaId: string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_EXPLICACION_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) throw new Error('ID de inferencia requerido');
      return inferenciaService.obtenerExplicacion(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useHistorialInferencia = (filtros?: {
  sistema_experto_id?: string;
  modo?: string;
  estado?: string;
}) => {
  return useQuery({
    queryKey: [INFERENCIA_HISTORIAL_KEY, filtros],
    queryFn: () => inferenciaService.listarHistorial(filtros),
  });
};

export const useEjecutarInferencia = (sistemaId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos?: IniciarInferenciaDTO) => {
      if (!sistemaId) throw new Error('ID del sistema no disponible');
      return inferenciaService.ejecutar(sistemaId, datos);
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData([INFERENCIA_KEY, String(data.id)], data);
      }
    },
  });
};

export const useIniciarSimulacion = (sistemaId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos?: IniciarInferenciaDTO) => {
      if (!sistemaId) throw new Error('ID del sistema no disponible');
      return inferenciaService.iniciarSimulacion(sistemaId, datos);
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData([INFERENCIA_KEY, String(data.id)], data);
      }
    },
  });
};

export const useAvanzarPasoSimulacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      param:
        | string
        | {
            simulacionId: string;
            datos?: {
              regla_id?: string;
              modo_evaluacion?: string;
              hechos_nuevos?: Array<{
                nombre: string;
                valor: string;
                tipo_dato?: string;
                opciones?: string[];
              }>;
            };
          }
    ) => {
      if (typeof param === 'string') {
        return inferenciaService.avanzarPaso(param);
      }
      return inferenciaService.avanzarPaso(param.simulacionId, param.datos);
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData([INFERENCIA_KEY, String(data.id)], data);
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_CONFLICTOS_KEY, String(data.id)] });
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_HECHOS_KEY, String(data.id)] });
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_DETALLES_KEY, String(data.id)] });
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_EXPLICACION_KEY, String(data.id)] });
      }
    },
  });
};

export const useControlarSimulacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      simulacionId,
      accion,
    }: {
      simulacionId: string;
      accion: 'PAUSAR' | 'CONTINUAR' | 'REINICIAR' | 'FINALIZAR';
    }) => inferenciaService.controlarSimulacion(simulacionId, accion),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData([INFERENCIA_KEY, String(data.id)], data);
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_CONFLICTOS_KEY, String(data.id)] });
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_HECHOS_KEY, String(data.id)] });
        queryClient.invalidateQueries({ queryKey: [INFERENCIA_EXPLICACION_KEY, String(data.id)] });
      }
    },
  });
};
