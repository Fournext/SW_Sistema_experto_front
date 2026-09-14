import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sistemasExpertosService from '../services/sistemasExpertosService';
import type {
  CrearSistemaExpertoDTO,
  ActualizarSistemaExpertoDTO,
} from '../types/types';

export const SISTEMAS_EXPERTOS_QUERY_KEY = ['sistemas-expertos'];

/**
 * Hook para obtener la lista de sistemas expertos
 */
export const useSistemasExpertos = () => {
  return useQuery({
    queryKey: SISTEMAS_EXPERTOS_QUERY_KEY,
    queryFn: () => sistemasExpertosService.listar(),
  });
};

/**
 * Hook para obtener un sistema experto por su ID
 */
export const useSistemaExperto = (id: number | string | undefined) => {
  return useQuery({
    queryKey: [...SISTEMAS_EXPERTOS_QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error('ID no proporcionado');
      return sistemasExpertosService.obtenerPorId(id);
    },
    enabled: Boolean(id),
  });
};

/**
 * Hook con las mutaciones de creación, actualización y eliminación
 */
export const useSistemaExpertoMutations = () => {
  const queryClient = useQueryClient();

  const crearMutation = useMutation({
    mutationFn: (datos: CrearSistemaExpertoDTO) => sistemasExpertosService.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SISTEMAS_EXPERTOS_QUERY_KEY });
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number | string;
      datos: ActualizarSistemaExpertoDTO;
    }) => sistemasExpertosService.actualizar(id, datos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SISTEMAS_EXPERTOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SISTEMAS_EXPERTOS_QUERY_KEY, variables.id] });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number | string) => sistemasExpertosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SISTEMAS_EXPERTOS_QUERY_KEY });
    },
  });

  return {
    crear: crearMutation,
    actualizar: actualizarMutation,
    eliminar: eliminarMutation,
  };
};
