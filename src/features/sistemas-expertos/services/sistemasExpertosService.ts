import httpClient from '@/services/httpClient';
import type {
  SistemaExperto,
  CrearSistemaExpertoDTO,
  ActualizarSistemaExpertoDTO,
} from '../types/types';

export const sistemasExpertosService = {
  /**
   * Obtiene todos los sistemas expertos registrados
   */
  async listar(): Promise<SistemaExperto[]> {
    const response = await httpClient.get<SistemaExperto[] | { results: SistemaExperto[] }>(
      '/sistemas-expertos/'
    );
    // Tolera tanto formato plano de DRF como formato paginado
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return [];
  },

  /**
   * Obtiene el detalle de un sistema experto por ID
   */
  async obtenerPorId(id: number | string): Promise<SistemaExperto> {
    const response = await httpClient.get<SistemaExperto>(`/sistemas-expertos/${id}/`);
    return response.data;
  },

  /**
   * Registra un nuevo sistema experto
   */
  async crear(datos: CrearSistemaExpertoDTO): Promise<SistemaExperto> {
    const response = await httpClient.post<SistemaExperto>('/sistemas-expertos/', datos);
    return response.data;
  },

  /**
   * Actualiza completamente un sistema experto existente
   */
  async actualizar(id: number | string, datos: ActualizarSistemaExpertoDTO): Promise<SistemaExperto> {
    const response = await httpClient.put<SistemaExperto>(`/sistemas-expertos/${id}/`, datos);
    return response.data;
  },

  /**
   * Actualiza parcialmente un sistema experto existente
   */
  async actualizarParcial(
    id: number | string,
    datos: Partial<ActualizarSistemaExpertoDTO>
  ): Promise<SistemaExperto> {
    const response = await httpClient.patch<SistemaExperto>(`/sistemas-expertos/${id}/`, datos);
    return response.data;
  },

  /**
   * Elimina un sistema experto
   */
  async eliminar(id: number | string): Promise<void> {
    await httpClient.delete(`/sistemas-expertos/${id}/`);
  },
};

export default sistemasExpertosService;
