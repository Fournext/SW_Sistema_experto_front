import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inferenciaService from '../services/inferenciaService';
import type { IniciarInferenciaDTO } from '../types/types';

export const INFERENCIA_KEY = 'inferencia';
export const INFERENCIA_DETALLES_KEY = 'inferencia-detalles';

export const useInferencia = (inferenciaId: number | string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) throw new Error('ID de inferencia requerido');
      return inferenciaService.obtenerPorId(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useDetallesInferencia = (inferenciaId: number | string | undefined) => {
  return useQuery({
    queryKey: [INFERENCIA_DETALLES_KEY, inferenciaId],
    queryFn: () => {
      if (!inferenciaId) return [];
      return inferenciaService.obtenerDetalles(inferenciaId);
    },
    enabled: Boolean(inferenciaId),
  });
};

export const useEjecutarInferencia = (sistemaId: number | string | undefined) => {
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
