import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import baseConocimientoService from '../services/baseConocimientoService';
import type {
  CrearHechoDTO,
  CrearVariableDTO,
  CrearReglaDTO,
  CrearCondicionDTO,
  CrearConclusionDTO,
} from '../types/types';

export const BASE_CONOCIMIENTO_KEY = 'base-conocimiento';
export const HECHOS_KEY = 'hechos';
export const VARIABLES_KEY = 'variables';
export const REGLAS_KEY = 'reglas';

export const useBaseConocimiento = (sistemaId: number | string | undefined) => {
  return useQuery({
    queryKey: [BASE_CONOCIMIENTO_KEY, sistemaId],
    queryFn: () => {
      if (!sistemaId) throw new Error('ID de sistema experto requerido');
      return baseConocimientoService.obtenerPorSistemaExperto(sistemaId);
    },
    enabled: Boolean(sistemaId),
  });
};

export const useHechos = (baseId: number | string | undefined) => {
  return useQuery({
    queryKey: [HECHOS_KEY, baseId],
    queryFn: () => {
      if (!baseId) return [];
      return baseConocimientoService.listarHechos(baseId);
    },
    enabled: Boolean(baseId),
  });
};

export const useVariables = (baseId: number | string | undefined) => {
  return useQuery({
    queryKey: [VARIABLES_KEY, baseId],
    queryFn: () => {
      if (!baseId) return [];
      return baseConocimientoService.listarVariables(baseId);
    },
    enabled: Boolean(baseId),
  });
};

export const useReglas = (baseId: number | string | undefined) => {
  return useQuery({
    queryKey: [REGLAS_KEY, baseId],
    queryFn: () => {
      if (!baseId) return [];
      return baseConocimientoService.listarReglas(baseId);
    },
    enabled: Boolean(baseId),
  });
};

export const useHechosMutations = (baseId: number | string | undefined) => {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: [HECHOS_KEY, baseId] });
    queryClient.invalidateQueries({ queryKey: [BASE_CONOCIMIENTO_KEY] });
  };

  const crear = useMutation({
    mutationFn: (datos: CrearHechoDTO) => {
      if (!baseId) throw new Error('Base de conocimiento no identificada');
      return baseConocimientoService.crearHecho(baseId, datos);
    },
    onSuccess: invalidar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: Partial<CrearHechoDTO> }) =>
      baseConocimientoService.actualizarHecho(id, datos),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (id: number | string) => baseConocimientoService.eliminarHecho(id),
    onSuccess: invalidar,
  });

  return { crear, actualizar, eliminar };
};

export const useVariablesMutations = (baseId: number | string | undefined) => {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: [VARIABLES_KEY, baseId] });
    queryClient.invalidateQueries({ queryKey: [BASE_CONOCIMIENTO_KEY] });
  };

  const crear = useMutation({
    mutationFn: (datos: CrearVariableDTO) => {
      if (!baseId) throw new Error('Base de conocimiento no identificada');
      return baseConocimientoService.crearVariable(baseId, datos);
    },
    onSuccess: invalidar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: Partial<CrearVariableDTO> }) =>
      baseConocimientoService.actualizarVariable(id, datos),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (id: number | string) => baseConocimientoService.eliminarVariable(id),
    onSuccess: invalidar,
  });

  return { crear, actualizar, eliminar };
};

export const useReglasMutations = (baseId: number | string | undefined) => {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: [REGLAS_KEY, baseId] });
    queryClient.invalidateQueries({ queryKey: [BASE_CONOCIMIENTO_KEY] });
  };

  const crear = useMutation({
    mutationFn: (datos: CrearReglaDTO) => {
      if (!baseId) throw new Error('Base de conocimiento no identificada');
      return baseConocimientoService.crearRegla(baseId, datos);
    },
    onSuccess: invalidar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: Partial<CrearReglaDTO> }) =>
      baseConocimientoService.actualizarRegla(id, datos),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (id: number | string) => baseConocimientoService.eliminarRegla(id),
    onSuccess: invalidar,
  });

  const agregarCondicion = useMutation({
    mutationFn: ({ reglaId, datos }: { reglaId: number | string; datos: CrearCondicionDTO }) =>
      baseConocimientoService.agregarCondicion(reglaId, datos),
    onSuccess: invalidar,
  });

  const eliminarCondicion = useMutation({
    mutationFn: (condicionId: number | string) =>
      baseConocimientoService.eliminarCondicion(condicionId),
    onSuccess: invalidar,
  });

  const agregarConclusion = useMutation({
    mutationFn: ({ reglaId, datos }: { reglaId: number | string; datos: CrearConclusionDTO }) =>
      baseConocimientoService.agregarConclusion(reglaId, datos),
    onSuccess: invalidar,
  });

  const eliminarConclusion = useMutation({
    mutationFn: (conclusionId: number | string) =>
      baseConocimientoService.eliminarConclusion(conclusionId),
    onSuccess: invalidar,
  });

  return {
    crear,
    actualizar,
    eliminar,
    agregarCondicion,
    eliminarCondicion,
    agregarConclusion,
    eliminarConclusion,
  };
};
