import httpClient from '@/services/httpClient';
import type {
  EjecucionInferencia,
  DetalleInferencia,
  IniciarInferenciaDTO,
} from '../types/types';

const unwrapList = <T>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
};

export const inferenciaService = {
  /**
   * Dispara el motor de inferencia hacia adelante en el backend Django
   */
  async ejecutar(
    sistemaId: number | string,
    datos?: IniciarInferenciaDTO
  ): Promise<EjecucionInferencia> {
    const response = await httpClient.post<EjecucionInferencia>(
      `/sistemas-expertos/${sistemaId}/inferencias/`,
      datos || {}
    );
    return response.data;
  },

  /**
   * Obtiene el estado y resultado de una inferencia
   */
  async obtenerPorId(inferenciaId: number | string): Promise<EjecucionInferencia> {
    const response = await httpClient.get<EjecucionInferencia>(
      `/inferencias/${inferenciaId}/`
    );
    return response.data;
  },

  /**
   * Obtiene la trazabilidad detallada de evaluación de reglas
   */
  async obtenerDetalles(inferenciaId: number | string): Promise<DetalleInferencia[]> {
    const response = await httpClient.get<unknown>(`/inferencias/${inferenciaId}/detalles/`);
    return unwrapList<DetalleInferencia>(response.data);
  },
};

export default inferenciaService;
