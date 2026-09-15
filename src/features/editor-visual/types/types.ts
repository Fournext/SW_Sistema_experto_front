import type { Node, Edge } from '@xyflow/react';

export type TipoNodo = 'HECHO' | 'VARIABLE' | 'CONDICION' | 'REGLA' | 'CONCLUSION';

export interface NodoDatosGenerales {
  id?: string | number;
  nodoVisualId?: string;
  isLocal?: boolean;
  reglaId?: string | number;
  etiqueta?: string;
  nombre?: string;
  tipo?: string;
  valor?: string;
  tipo_dato?: string;
  es_inicial?: boolean;
  valor_por_defecto?: string;
  descripcion?: string;
  prioridad?: number;
  factor_certeza?: number | string;
  activa?: boolean;
  referencia?: string;
  operador?: string;
  valor_esperado?: string;
  orden?: number;
  variable_id?: string | number | null;
  hecho_id?: string | number | null;
  destino?: string;
  valor_resultante?: string;
  variable_resultante_id?: string | number | null;
  hecho_resultante_id?: string | number | null;
  [key: string]: unknown;
}

export interface NodoVisualBackend {
  id: string;
  sistema_experto_id?: string | null;
  tipo: TipoNodo;
  referencia_id: string;
  posicion_x: string | number;
  posicion_y: string | number;
}

export interface ConexionVisualBackend {
  id: string;
  sistema_experto_id?: string | null;
  nodo_origen_id: string;
  nodo_destino_id: string;
  etiqueta?: string | null;
  tipo?: string | null;
}

export interface EditorVisualDataBackend {
  sistema_experto_id?: string;
  nodos: NodoVisualBackend[];
  conexiones: ConexionVisualBackend[];
}

export type FlowNode = Node<NodoDatosGenerales, TipoNodo>;
export type FlowEdge = Edge;

export interface CrearNodoDTO {
  tipo: TipoNodo;
  referencia_id: string;
  posicion_x: number | string;
  posicion_y: number | string;
}

export interface ActualizarNodoPosicionDTO {
  posicion_x: number | string;
  posicion_y: number | string;
}

export interface ActualizarNodoDTO {
  posicion_x?: number | string;
  posicion_y?: number | string;
  datos?: Partial<NodoDatosGenerales>;
}

export interface CrearConexionDTO {
  nodo_origen_id: string;
  nodo_destino_id: string;
  etiqueta?: string;
  tipo?: string;
}
