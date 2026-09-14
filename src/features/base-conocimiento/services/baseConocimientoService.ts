import httpClient from '@/services/httpClient';
import type {
  BaseConocimiento,
  Hecho,
  Variable,
  Regla,
  Condicion,
  Conclusion,
  CrearHechoDTO,
  CrearVariableDTO,
  CrearReglaDTO,
  CrearCondicionDTO,
  CrearConclusionDTO,
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

export const baseConocimientoService = {
  /**
   * Obtiene la base de conocimiento de un sistema experto
   */
  async obtenerPorSistemaExperto(sistemaId: number | string): Promise<BaseConocimiento> {
    const response = await httpClient.get<BaseConocimiento>(
      `/sistemas-expertos/${sistemaId}/base-conocimiento/`
    );
    return response.data;
  },

  // ================= HECHOS =================
  async listarHechos(baseConocimientoId: number | string): Promise<Hecho[]> {
    const response = await httpClient.get<Hecho[] | { results: Hecho[] }>(
      `/bases-conocimiento/${baseConocimientoId}/hechos/`
    );
    return unwrapList(response.data);
  },

  async crearHecho(baseConocimientoId: number | string, datos: CrearHechoDTO): Promise<Hecho> {
    const response = await httpClient.post<Hecho>(
      `/bases-conocimiento/${baseConocimientoId}/hechos/`,
      datos
    );
    return response.data;
  },

  async actualizarHecho(id: number | string, datos: Partial<CrearHechoDTO>): Promise<Hecho> {
    const response = await httpClient.patch<Hecho>(`/hechos/${id}/`, datos);
    return response.data;
  },

  async eliminarHecho(id: number | string): Promise<void> {
    await httpClient.delete(`/hechos/${id}/`);
  },

  // ================= VARIABLES =================
  async listarVariables(baseConocimientoId: number | string): Promise<Variable[]> {
    const response = await httpClient.get<Variable[] | { results: Variable[] }>(
      `/bases-conocimiento/${baseConocimientoId}/variables/`
    );
    return unwrapList(response.data);
  },

  async crearVariable(
    baseConocimientoId: number | string,
    datos: CrearVariableDTO
  ): Promise<Variable> {
    const response = await httpClient.post<Variable>(
      `/bases-conocimiento/${baseConocimientoId}/variables/`,
      datos
    );
    return response.data;
  },

  async actualizarVariable(
    id: number | string,
    datos: Partial<CrearVariableDTO>
  ): Promise<Variable> {
    const response = await httpClient.patch<Variable>(`/variables/${id}/`, datos);
    return response.data;
  },

  async eliminarVariable(id: number | string): Promise<void> {
    await httpClient.delete(`/variables/${id}/`);
  },

  // ================= REGLAS =================
  async listarReglas(baseConocimientoId: number | string): Promise<Regla[]> {
    const response = await httpClient.get<Regla[] | { results: Regla[] }>(
      `/bases-conocimiento/${baseConocimientoId}/reglas/`
    );
    return unwrapList(response.data);
  },

  async crearRegla(baseConocimientoId: number | string, datos: CrearReglaDTO): Promise<Regla> {
    const response = await httpClient.post<Regla>(
      `/bases-conocimiento/${baseConocimientoId}/reglas/`,
      datos
    );
    return response.data;
  },

  async actualizarRegla(id: number | string, datos: Partial<CrearReglaDTO>): Promise<Regla> {
    const response = await httpClient.patch<Regla>(`/reglas/${id}/`, datos);
    return response.data;
  },

  async eliminarRegla(id: number | string): Promise<void> {
    await httpClient.delete(`/reglas/${id}/`);
  },

  // ================= CONDICIONES Y CONCLUSIONES =================
  async agregarCondicion(reglaId: number | string, datos: CrearCondicionDTO): Promise<Condicion> {
    const response = await httpClient.post<Condicion>(`/reglas/${reglaId}/condiciones/`, datos);
    return response.data;
  },

  async eliminarCondicion(id: number | string): Promise<void> {
    await httpClient.delete(`/condiciones/${id}/`);
  },

  async agregarConclusion(
    reglaId: number | string,
    datos: CrearConclusionDTO
  ): Promise<Conclusion> {
    const response = await httpClient.post<Conclusion>(`/reglas/${reglaId}/conclusiones/`, datos);
    return response.data;
  },

  async eliminarConclusion(id: number | string): Promise<void> {
    await httpClient.delete(`/conclusiones/${id}/`);
  },
};

export default baseConocimientoService;
