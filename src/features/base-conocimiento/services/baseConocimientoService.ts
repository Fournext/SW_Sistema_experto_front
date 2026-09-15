import httpClient from '@/services/httpClient';
import type {
  BaseConocimiento,
  Hecho,
  Variable,
  TipoDato,
  Regla,
  Condicion,
  Conclusion,
  CrearHechoDTO,
  CrearVariableDTO,
  CrearReglaDTO,
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

const normalizeVariable = (v: unknown): Variable => {
  if (!v || typeof v !== 'object') return v as Variable;
  const raw = v as Record<string, unknown>;
  const tipo = (raw.tipo || raw.tipo_dato || 'TEXTO') as TipoDato;
  const valorDefecto =
    raw.valor_por_defecto !== undefined && raw.valor_por_defecto !== null
      ? String(raw.valor_por_defecto)
      : raw.valor_defecto !== undefined && raw.valor_defecto !== null
      ? String(raw.valor_defecto)
      : '';

  return {
    ...(raw as unknown as Variable),
    tipo,
    tipo_dato: tipo,
    valor_por_defecto: valorDefecto,
    valor_defecto: valorDefecto,
  };
};

export const baseConocimientoService = {
  /**
   * Obtiene la base de conocimiento de un sistema experto
   */
  async obtenerPorSistemaExperto(sistemaId: number | string): Promise<BaseConocimiento> {
    const response = await httpClient.get<BaseConocimiento>(
      `/sistemas-expertos/${sistemaId}/base-conocimiento/`
    );
    const data = response.data;
    if (data && Array.isArray(data.variables)) {
      data.variables = data.variables.map(normalizeVariable);
    }
    return data;
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
    return unwrapList(response.data).map(normalizeVariable);
  },

  async crearVariable(
    baseConocimientoId: number | string,
    datos: CrearVariableDTO
  ): Promise<Variable> {
    const payload = {
      nombre: datos.nombre,
      tipo_dato: (datos as unknown as Record<string, unknown>).tipo_dato || datos.tipo || 'TEXTO',
      valor_defecto:
        (datos as unknown as Record<string, unknown>).valor_defecto !== undefined
          ? (datos as unknown as Record<string, unknown>).valor_defecto
          : datos.valor_por_defecto || null,
      descripcion: datos.descripcion || '',
    };
    const response = await httpClient.post<Variable>(
      `/bases-conocimiento/${baseConocimientoId}/variables/`,
      payload
    );
    return normalizeVariable(response.data);
  },

  async actualizarVariable(
    id: number | string,
    datos: Partial<CrearVariableDTO>
  ): Promise<Variable> {
    const raw = datos as unknown as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (raw.tipo_dato !== undefined) payload.tipo_dato = raw.tipo_dato;
    else if (datos.tipo !== undefined) payload.tipo_dato = datos.tipo;
    if (raw.valor_defecto !== undefined) payload.valor_defecto = raw.valor_defecto;
    else if (datos.valor_por_defecto !== undefined) payload.valor_defecto = datos.valor_por_defecto;
    if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;

    const response = await httpClient.patch<Variable>(`/variables/${id}/`, payload);
    return normalizeVariable(response.data);
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
    const payload = {
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      prioridad: datos.prioridad ?? 0,
      factor_certeza:
        typeof datos.factor_certeza === 'number'
          ? datos.factor_certeza.toFixed(2)
          : String(datos.factor_certeza ?? '1.00'),
      activa: datos.activa !== false,
    };
    const response = await httpClient.post<Regla>(
      `/bases-conocimiento/${baseConocimientoId}/reglas/`,
      payload
    );
    return response.data;
  },

  async actualizarRegla(id: number | string, datos: Partial<CrearReglaDTO>): Promise<Regla> {
    const payload: Record<string, unknown> = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
    if (datos.prioridad !== undefined) payload.prioridad = datos.prioridad;
    if (datos.factor_certeza !== undefined) {
      payload.factor_certeza =
        typeof datos.factor_certeza === 'number'
          ? datos.factor_certeza.toFixed(2)
          : String(datos.factor_certeza);
    }
    if (datos.activa !== undefined) payload.activa = datos.activa;

    const response = await httpClient.patch<Regla>(`/reglas/${id}/`, payload);
    return response.data;
  },

  async eliminarRegla(id: number | string): Promise<void> {
    await httpClient.delete(`/reglas/${id}/`);
  },

  // ================= CONDICIONES Y CONCLUSIONES =================
  async agregarCondicion(
    reglaId: number | string,
    datos: Partial<Condicion> | Record<string, unknown>
  ): Promise<Condicion> {
    const operador = datos.operador === '==' ? '=' : String(datos.operador || '=');
    const payload = {
      operador,
      valor_esperado: String(datos.valor_esperado ?? 'true'),
      variable_id: datos.variable_id ?? null,
      hecho_id: datos.hecho_id ?? null,
      orden: datos.orden ?? 1,
    };
    const response = await httpClient.post<Condicion>(`/reglas/${reglaId}/condiciones/`, payload);
    return response.data;
  },

  async actualizarCondicion(
    id: number | string,
    datos: Partial<Condicion> | Record<string, unknown>
  ): Promise<Condicion> {
    const payload: Record<string, unknown> = {};
    if (datos.operador !== undefined) {
      payload.operador = datos.operador === '==' ? '=' : String(datos.operador);
    }
    if (datos.valor_esperado !== undefined) {
      payload.valor_esperado = String(datos.valor_esperado);
    }
    if (datos.variable_id !== undefined) payload.variable_id = datos.variable_id;
    if (datos.hecho_id !== undefined) payload.hecho_id = datos.hecho_id;
    if (datos.orden !== undefined) payload.orden = datos.orden;

    const response = await httpClient.put<Condicion>(`/condiciones/${id}/`, payload);
    return response.data;
  },

  async eliminarCondicion(id: number | string): Promise<void> {
    await httpClient.delete(`/condiciones/${id}/`);
  },

  async agregarConclusion(
    reglaId: number | string,
    datos: Partial<Conclusion> | Record<string, unknown>
  ): Promise<Conclusion> {
    const payload = {
      valor_resultante: String(datos.valor_resultante ?? 'deducción'),
      hecho_resultante_id: datos.hecho_resultante_id ?? null,
      variable_resultante_id: datos.variable_resultante_id ?? null,
    };
    const response = await httpClient.post<Conclusion>(`/reglas/${reglaId}/conclusiones/`, payload);
    return response.data;
  },

  async actualizarConclusion(
    id: number | string,
    datos: Partial<Conclusion> | Record<string, unknown>
  ): Promise<Conclusion> {
    const payload: Record<string, unknown> = {};
    if (datos.valor_resultante !== undefined) {
      payload.valor_resultante = String(datos.valor_resultante);
    }
    if (datos.hecho_resultante_id !== undefined) {
      payload.hecho_resultante_id = datos.hecho_resultante_id;
    }
    if (datos.variable_resultante_id !== undefined) {
      payload.variable_resultante_id = datos.variable_resultante_id;
    }

    const response = await httpClient.put<Conclusion>(`/conclusiones/${id}/`, payload);
    return response.data;
  },

  async eliminarConclusion(id: number | string): Promise<void> {
    await httpClient.delete(`/conclusiones/${id}/`);
  },
};

export default baseConocimientoService;
