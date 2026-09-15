import httpClient from '@/services/httpClient';
import type {
  EditorVisualDataBackend,
  NodoVisualBackend,
  ConexionVisualBackend,
  CrearNodoDTO,
  ActualizarNodoPosicionDTO,
  ActualizarNodoDTO,
  CrearConexionDTO,
} from '../types/types';

const unwrapData = <T>(res: unknown): T => {
  if (res && typeof res === 'object' && 'data' in res && (res as { data?: unknown }).data !== undefined) {
    return (res as { data: T }).data;
  }
  return res as T;
};

export const editorVisualService = {
  /**
   * Obtiene la estructura del editor (nodos y conexiones) de un sistema experto
   */
  async obtenerEditor(sistemaId: number | string): Promise<EditorVisualDataBackend> {
    const response = await httpClient.get(
      `/sistemas-expertos/${sistemaId}/editor/`
    );
    const data = unwrapData<EditorVisualDataBackend>(response.data);
    return {
      sistema_experto_id: data?.sistema_experto_id || String(sistemaId),
      nodos: data?.nodos || [],
      conexiones: data?.conexiones || [],
    };
  },

  /**
   * Agrega un nuevo nodo en el editor visual referenciando una entidad existente
   */
  async crearNodo(sistemaId: number | string, datos: CrearNodoDTO): Promise<NodoVisualBackend> {
    const payload = {
      tipo: datos.tipo,
      referencia_id: datos.referencia_id,
      posicion_x:
        typeof datos.posicion_x === 'number'
          ? datos.posicion_x.toFixed(2)
          : String(datos.posicion_x),
      posicion_y:
        typeof datos.posicion_y === 'number'
          ? datos.posicion_y.toFixed(2)
          : String(datos.posicion_y),
    };
    const response = await httpClient.post(
      `/sistemas-expertos/${sistemaId}/nodos/`,
      payload
    );
    return unwrapData<NodoVisualBackend>(response.data);
  },

  /**
   * Actualiza las coordenadas espaciales (X, Y) de un nodo visual
   */
  async moverNodo(
    idNodoVisual: string,
    datos: ActualizarNodoPosicionDTO
  ): Promise<NodoVisualBackend> {
    const payload = {
      posicion_x:
        typeof datos.posicion_x === 'number'
          ? datos.posicion_x.toFixed(2)
          : String(datos.posicion_x),
      posicion_y:
        typeof datos.posicion_y === 'number'
          ? datos.posicion_y.toFixed(2)
          : String(datos.posicion_y),
    };
    const response = await httpClient.patch(`/nodos/${idNodoVisual}/`, payload);
    return unwrapData<NodoVisualBackend>(response.data);
  },

  /**
   * Actualiza la posición o propiedades de un nodo (compatibilidad)
   */
  async actualizarNodo(
    id: number | string,
    datos: ActualizarNodoDTO
  ): Promise<NodoVisualBackend> {
    if (datos.posicion_x !== undefined && datos.posicion_y !== undefined) {
      return this.moverNodo(String(id), {
        posicion_x: datos.posicion_x,
        posicion_y: datos.posicion_y,
      });
    }
    const response = await httpClient.patch(`/nodos/${id}/`, datos);
    return unwrapData<NodoVisualBackend>(response.data);
  },

  /**
   * Elimina un nodo del editor visual
   */
  async eliminarNodo(idNodoVisual: string): Promise<void> {
    await httpClient.delete(`/nodos/${idNodoVisual}/`);
  },

  /**
   * Crea una nueva conexión entre dos nodos visuales
   */
  async crearConexion(
    sistemaId: number | string,
    datos: CrearConexionDTO
  ): Promise<ConexionVisualBackend> {
    const response = await httpClient.post(
      `/sistemas-expertos/${sistemaId}/conexiones/`,
      datos
    );
    return unwrapData<ConexionVisualBackend>(response.data);
  },

  /**
   * Elimina una conexión por su ID
   */
  async eliminarConexion(idConexion: string): Promise<void> {
    await httpClient.delete(`/conexiones/${idConexion}/`);
  },
};

export default editorVisualService;
