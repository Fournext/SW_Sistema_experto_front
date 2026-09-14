import httpClient from '@/services/httpClient';
import type {
  EditorVisualDataBackend,
  NodoVisualBackend,
  ConexionVisualBackend,
  CrearNodoDTO,
  ActualizarNodoDTO,
  CrearConexionDTO,
} from '../types/types';

export const editorVisualService = {
  /**
   * Obtiene la estructura del editor (nodos y conexiones) de un sistema experto
   */
  async obtenerEditor(sistemaId: number | string): Promise<EditorVisualDataBackend> {
    const response = await httpClient.get<EditorVisualDataBackend>(
      `/sistemas-expertos/${sistemaId}/editor/`
    );
    return {
      nodos: response.data.nodos || [],
      conexiones: response.data.conexiones || [],
    };
  },

  /**
   * Agrega un nuevo nodo en el editor visual
   */
  async crearNodo(sistemaId: number | string, datos: CrearNodoDTO): Promise<NodoVisualBackend> {
    const response = await httpClient.post<NodoVisualBackend>(
      `/sistemas-expertos/${sistemaId}/nodos/`,
      datos
    );
    return response.data;
  },

  /**
   * Actualiza la posición o propiedades de un nodo
   */
  async actualizarNodo(
    id: number | string,
    datos: ActualizarNodoDTO
  ): Promise<NodoVisualBackend> {
    const response = await httpClient.patch<NodoVisualBackend>(`/nodos/${id}/`, datos);
    return response.data;
  },

  /**
   * Elimina un nodo del editor
   */
  async eliminarNodo(id: number | string): Promise<void> {
    await httpClient.delete(`/nodos/${id}/`);
  },

  /**
   * Crea una nueva conexión entre dos nodos
   */
  async crearConexion(
    sistemaId: number | string,
    datos: CrearConexionDTO
  ): Promise<ConexionVisualBackend> {
    const response = await httpClient.post<ConexionVisualBackend>(
      `/sistemas-expertos/${sistemaId}/conexiones/`,
      datos
    );
    return response.data;
  },

  /**
   * Elimina una conexión por su ID
   */
  async eliminarConexion(id: number | string): Promise<void> {
    await httpClient.delete(`/conexiones/${id}/`);
  },
};

export default editorVisualService;
