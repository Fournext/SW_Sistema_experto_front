import httpClient from '@/services/trabajoHttpClient';
import type {
  EjecucionInferencia,
  DetalleInferencia,
  IniciarInferenciaDTO,
  ConflictoInferencia,
  HechoDeducido,
  ExplicacionConclusion,
} from '../types/types';

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

export const inferenciaService = {
  /**
   * Dispara inferencia directa estándar
   */
  async ejecutar(
    sistemaId: string,
    datos?: IniciarInferenciaDTO
  ): Promise<EjecucionInferencia> {
    const response = await httpClient.post<unknown>(
      `/sistemas-expertos/${sistemaId}/inferencias/`,
      datos || {}
    );
    return unwrapData<EjecucionInferencia>(response.data);
  },

  /**
   * Inicia una sesión interactiva de simulación paso a paso
   */
  async iniciarSimulacion(
    sistemaId: string,
    datos?: IniciarInferenciaDTO
  ): Promise<EjecucionInferencia> {
    const response = await httpClient.post<unknown>(
      `/sistemas-expertos/${sistemaId}/simulaciones/iniciar/`,
      datos || {}
    );
    return unwrapData<EjecucionInferencia>(response.data);
  },

  /**
   * Ejecuta un paso incremental de inferencia en la simulación
   */
  async avanzarPaso(
    simulacionId: string,
    datos?: {
      regla_id?: string;
      modo_evaluacion?: string;
      hechos_nuevos?: Array<{ nombre: string; valor: string; tipo_dato?: string; opciones?: string[] }>;
    }
  ): Promise<EjecucionInferencia> {
    const response = await httpClient.post<unknown>(
      `/simulaciones/${simulacionId}/paso/`,
      datos || {}
    );
    return unwrapData<EjecucionInferencia>(response.data);
  },

  /**
   * Controla el ciclo de vida de la simulación: PAUSAR, CONTINUAR, REINICIAR, FINALIZAR
   */
  async controlarSimulacion(
    simulacionId: string,
    accion: 'PAUSAR' | 'CONTINUAR' | 'REINICIAR' | 'FINALIZAR'
  ): Promise<EjecucionInferencia> {
    const response = await httpClient.post<unknown>(
      `/simulaciones/${simulacionId}/control/`,
      { accion }
    );
    return unwrapData<EjecucionInferencia>(response.data);
  },

  /**
   * Obtiene una ejecución o simulación por su ID
   */
  async obtenerPorId(inferenciaId: string): Promise<EjecucionInferencia> {
    const response = await httpClient.get<unknown>(
      `/inferencias/${inferenciaId}/`
    );
    return unwrapData<EjecucionInferencia>(response.data);
  },

  /**
   * Obtiene la trazabilidad de detalles de evaluación de reglas
   */
  async obtenerDetalles(inferenciaId: string): Promise<DetalleInferencia[]> {
    const response = await httpClient.get<unknown>(`/inferencias/${inferenciaId}/detalles/`);
    return unwrapList<DetalleInferencia>(response.data);
  },

  /**
   * Consulta los conflictos de reglas ocurridos durante la ejecución
   */
  async obtenerConflictos(inferenciaId: string): Promise<ConflictoInferencia[]> {
    const response = await httpClient.get<unknown>(`/ejecuciones/${inferenciaId}/conflictos/`);
    return unwrapList<ConflictoInferencia>(response.data);
  },

  /**
   * Consulta los hechos inferidos en cada paso
   */
  async obtenerHechosInferidos(inferenciaId: string): Promise<HechoDeducido[]> {
    const response = await httpClient.get<unknown>(`/ejecuciones/${inferenciaId}/hechos-inferidos/`);
    return unwrapList<HechoDeducido>(response.data);
  },

  /**
   * Consulta la explicación determinista de la conclusión
   */
  async obtenerExplicacion(inferenciaId: string): Promise<ExplicacionConclusion> {
    const response = await httpClient.get<unknown>(`/ejecuciones/${inferenciaId}/explicacion/`);
    return unwrapData<ExplicacionConclusion>(response.data);
  },

  /**
   * Consulta el historial general de ejecuciones
   */
  async listarHistorial(filtros?: {
    sistema_experto_id?: string;
    modo?: string;
    estado?: string;
  }): Promise<EjecucionInferencia[]> {
    const response = await httpClient.get<unknown>(`/historial-inferencias/`, {
      params: {
        sistema_id: filtros?.sistema_experto_id,
        modo: filtros?.modo,
        estado: filtros?.estado,
      },
    });
    return unwrapList<EjecucionInferencia>(response.data);
  },
};

export default inferenciaService;
