import httpClient from '@/services/trabajoHttpClient';
import type {
  CompilarSalida,
  CorridaLaboratorio,
  ModoAvance,
  PlantillaAlgoritmo,
  ProgramaAlgoritmo,
} from '../types/contracts';

interface RespuestaAPI<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: unknown;
}

const unwrap = <T>(res: unknown): T => {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as RespuestaAPI<T>).data;
  }
  return res as T;
};

export const laboratorioService = {
  /**
   * Valida sintaxis y tipos sin ejecutar el programa.
   */
  async compilar(codigoFuente: string): Promise<CompilarSalida> {
    const res = await httpClient.post<unknown>('/laboratorio/compilar/', {
      codigo_fuente: codigoFuente,
    });
    return unwrap<CompilarSalida>(res);
  },

  /**
   * Obtiene la lista de plantillas canónicas de clase.
   */
  async obtenerPlantillas(): Promise<PlantillaAlgoritmo[]> {
    const res = await httpClient.get<unknown>('/laboratorio/plantillas/');
    return unwrap<PlantillaAlgoritmo[]>(res);
  },

  /**
   * Inicia una corrida interactiva con snapshot de la BC.
   */
  async iniciarCorrida(datos: {
    sistema_experto_id?: string;
    programa_id?: string;
    codigo_fuente?: string;
    orden_reglas_ids?: string[];
    hechos_iniciales_override?: Record<string, unknown>;
    parametros_iniciales?: Record<string, unknown>;
  }): Promise<CorridaLaboratorio> {
    const res = await httpClient.post<unknown>('/laboratorio/ejecutar/', datos);
    return unwrap<CorridaLaboratorio>(res);
  },

  /**
   * Avanza la corrida (paso por línea o hasta el final).
   */
  async avanzarCorrida(
    corridaId: string,
    modo: ModoAvance = 'LINE_STEP',
    maxPasos: number = 100
  ): Promise<CorridaLaboratorio> {
    const res = await httpClient.post<unknown>(
      `/laboratorio/corridas/${corridaId}/avanzar/`,
      { modo, max_pasos: maxPasos }
    );
    return unwrap<CorridaLaboratorio>(res);
  },

  /**
   * Entrega la respuesta del usuario ante una pregunta interactiva (Preguntar).
   */
  async responderPregunta(
    corridaId: string,
    valor: string,
    cancelada: boolean = false
  ): Promise<CorridaLaboratorio> {
    const res = await httpClient.post<unknown>(
      `/laboratorio/corridas/${corridaId}/responder/`,
      { valor, cancelada }
    );
    return unwrap<CorridaLaboratorio>(res);
  },

  /**
   * Gestión de programas guardados por el usuario.
   */
  async listarProgramas(sistemaExpertoId?: string): Promise<ProgramaAlgoritmo[]> {
    const query = sistemaExpertoId ? `?sistema_experto=${sistemaExpertoId}` : '';
    const res = await httpClient.get<unknown>(`/laboratorio/programas/${query}`);
    return unwrap<ProgramaAlgoritmo[]>(res);
  },

  async guardarPrograma(datos: {
    titulo: string;
    descripcion?: string;
    codigo_fuente: string;
    sistema_experto?: string;
  }): Promise<ProgramaAlgoritmo> {
    const res = await httpClient.post<unknown>('/laboratorio/programas/', datos);
    return unwrap<ProgramaAlgoritmo>(res);
  },

  async actualizarPrograma(
    id: string,
    datos: {
      titulo?: string;
      descripcion?: string;
      codigo_fuente?: string;
    }
  ): Promise<ProgramaAlgoritmo> {
    const res = await httpClient.patch<unknown>(`/laboratorio/programas/${id}/`, datos);
    return unwrap<ProgramaAlgoritmo>(res);
  },
};

