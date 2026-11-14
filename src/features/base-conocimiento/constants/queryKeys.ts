export const BASE_CONOCIMIENTO_KEY = 'base-conocimiento';
export const HECHOS_KEY = 'hechos';
export const VARIABLES_KEY = 'variables';
export const REGLAS_KEY = 'reglas';

export const baseConocimientoKeys = {
  all: [BASE_CONOCIMIENTO_KEY] as const,
  porSistema: (sistemaId: number | string | undefined) => [BASE_CONOCIMIENTO_KEY, sistemaId] as const,
  base: (baseId: number | string | undefined) => [BASE_CONOCIMIENTO_KEY, 'base', baseId] as const,
  hechos: (baseId: number | string | undefined) => [HECHOS_KEY, baseId] as const,
  variables: (baseId: number | string | undefined) => [VARIABLES_KEY, baseId] as const,
  reglas: (baseId: number | string | undefined) => [REGLAS_KEY, baseId] as const,
};

