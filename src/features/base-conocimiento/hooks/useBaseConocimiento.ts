import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import baseConocimientoService from '../services/baseConocimientoService';
import {
  baseConocimientoKeys,
  BASE_CONOCIMIENTO_KEY,
  HECHOS_KEY,
  VARIABLES_KEY,
  REGLAS_KEY,
} from '../constants/queryKeys';
import type {
  CrearHechoDTO,
  CrearVariableDTO,
  CrearReglaDTO,
  CrearCondicionDTO,
  CrearConclusionDTO,
  CrearReglaCompletaDTO,
} from '../types/types';

export {
  baseConocimientoKeys,
  BASE_CONOCIMIENTO_KEY,
  HECHOS_KEY,
  VARIABLES_KEY,
  REGLAS_KEY,
};

export const useBaseConocimiento = (sistemaId: number | string | undefined) => {
  return useQuery({
    queryKey: baseConocimientoKeys.porSistema(sistemaId),
    queryFn: () => {
      if (!sistemaId) throw new Error('ID de sistema experto requerido');
      return baseConocimientoService.obtenerPorSistemaExperto(sistemaId);
    },
    enabled: Boolean(sistemaId),
  });
};

export const useHechos = (baseId: number | string | undefined) => {
  return useQuery({
    queryKey: baseConocimientoKeys.hechos(baseId),
    queryFn: () => {
      if (!baseId) return [];
      return baseConocimientoService.listarHechos(baseId);
    },
    enabled: Boolean(baseId),
  });
};

export const useVariables = (baseId: number | string | undefined) => {
  return useQuery({
    queryKey: baseConocimientoKeys.variables(baseId),
    queryFn: () => {
      if (!baseId) return [];
      return baseConocimientoService.listarVariables(baseId);
    },
    enabled: Boolean(baseId),
  });
};

export const useReglas = (baseId: number | string | undefined) => {
  return useQuery({
    queryKey: baseConocimientoKeys.reglas(baseId),
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
    queryClient.invalidateQueries({ queryKey: baseConocimientoKeys.hechos(baseId) });
    queryClient.invalidateQueries({ queryKey: baseConocimientoKeys.all });
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
    queryClient.invalidateQueries({ queryKey: baseConocimientoKeys.variables(baseId) });
    queryClient.invalidateQueries({ queryKey: baseConocimientoKeys.all });
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
    queryClient.invalidateQueries({ queryKey: baseConocimientoKeys.reglas(baseId) });
    queryClient.invalidateQueries({ queryKey: baseConocimientoKeys.all });
    // También invalidar queries de validación si existen
    queryClient.invalidateQueries({ queryKey: ['validacion', baseId] });
  };

  const crear = useMutation({
    mutationFn: (datos: CrearReglaDTO) => {
      if (!baseId) throw new Error('Base de conocimiento no identificada');
      return baseConocimientoService.crearRegla(baseId, datos);
    },
    onSuccess: invalidar,
  });

  const crearCompleta = useMutation({
    mutationFn: (datos: CrearReglaCompletaDTO) => {
      if (!baseId) throw new Error('Base de conocimiento no identificada');
      return baseConocimientoService.crearReglaCompleta(baseId, datos);
    },
    onSuccess: invalidar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: Partial<CrearReglaDTO> }) =>
      baseConocimientoService.actualizarRegla(id, datos),
    onSuccess: invalidar,
  });

  const actualizarCompleta = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: CrearReglaCompletaDTO }) =>
      baseConocimientoService.actualizarReglaCompleta(id, datos),
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
    crearCompleta,
    actualizar,
    actualizarCompleta,
    eliminar,
    agregarCondicion,
    eliminarCondicion,
    agregarConclusion,
    eliminarConclusion,
  };
};
