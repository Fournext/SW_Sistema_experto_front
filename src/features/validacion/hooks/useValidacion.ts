import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import validacionService from '../services/validacionService';

export const VALIDACION_ULTIMA_KEY = 'validacion-ultima';
export const VALIDACION_INCIDENCIAS_KEY = 'validacion-incidencias';

export const useUltimaValidacion = (baseId: string | undefined) => {
  return useQuery({
    queryKey: [VALIDACION_ULTIMA_KEY, baseId],
    queryFn: () => {
      if (!baseId) throw new Error('ID de base de conocimiento requerido');
      return validacionService.obtenerUltima(baseId);
    },
    enabled: Boolean(baseId),
  });
};

export const useIncidenciasValidacion = (
  validacionId: string | undefined,
  filtros?: { severidad?: string; tipo?: string }
) => {
  return useQuery({
    queryKey: [VALIDACION_INCIDENCIAS_KEY, validacionId, filtros],
    queryFn: () => {
      if (!validacionId) return [];
      return validacionService.listarIncidencias(validacionId, filtros);
    },
    enabled: Boolean(validacionId),
  });
};

export const useValidarBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (baseId: string) => validacionService.validarBase(baseId),
    onSuccess: (data) => {
      if (data?.base_conocimiento_id) {
        queryClient.setQueryData([VALIDACION_ULTIMA_KEY, data.base_conocimiento_id], data);
        queryClient.invalidateQueries({
          queryKey: [VALIDACION_INCIDENCIAS_KEY, data.id],
        });
      }
    },
  });
};
