import httpClient from '@/services/trabajoHttpClient';
import type { IncidenciaValidacion, ResultadoValidacion } from '../types/types';

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

export const validacionService = {
  /**
   * Ejecuta la validación determinista sobre la base de conocimiento
   */
  async validarBase(baseId: string): Promise<ResultadoValidacion> {
    const response = await httpClient.post<unknown>(
      `/bases-conocimiento/${baseId}/validar/`,
      {}
    );
    return unwrapData<ResultadoValidacion>(response.data);
  },

  /**
   * Obtiene la última validación persistida de la base
   */
  async obtenerUltima(baseId: string): Promise<ResultadoValidacion | null> {
    const response = await httpClient.get<unknown>(
      `/bases-conocimiento/${baseId}/validaciones/ultima/`
    );
    return unwrapData<ResultadoValidacion | null>(response.data);
  },

  /**
   * Obtiene una validación específica por su ID
   */
  async obtenerPorId(validacionId: string): Promise<ResultadoValidacion> {
    const response = await httpClient.get<unknown>(`/validaciones/${validacionId}/`);
    return unwrapData<ResultadoValidacion>(response.data);
  },

  /**
   * Obtiene el reporte detallado de incidencias con filtros de severidad y tipo
   */
  async listarIncidencias(
    validacionId: string,
    filtros?: { severidad?: string; tipo?: string }
  ): Promise<IncidenciaValidacion[]> {
    const response = await httpClient.get<unknown>(
      `/validaciones/${validacionId}/incidencias/`,
      { params: filtros }
    );
    return unwrapList<IncidenciaValidacion>(response.data);
  },
};

export default validacionService;
