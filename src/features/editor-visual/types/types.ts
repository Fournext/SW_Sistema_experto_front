import type { Node, Edge } from '@xyflow/react';

export type TipoNodo = 'HECHO' | 'VARIABLE' | 'CONDICION' | 'REGLA' | 'CONCLUSION';

export interface NodoDatosGenerales {
  etiqueta?: string;
  nombre?: string;
  tipo?: string;
  valor?: string;
  tipo_dato?: string;
  es_inicial?: boolean;
  valor_por_defecto?: string;
  descripcion?: string;
  prioridad?: number;
  factor_certeza?: number;
  activa?: boolean;
  referencia?: string;
  operador?: string;
  valor_esperado?: string;
  orden?: number;
  destino?: string;
  valor_resultante?: string;
  [key: string]: unknown;
}

export interface NodoVisualBackend {
  id: number | string;
  tipo: TipoNodo;
  posicion_x: number;
  posicion_y: number;
  datos: NodoDatosGenerales;
  sistema_experto?: number;
}

export interface ConexionVisualBackend {
  id: number | string;
  nodo_origen: number | string;
  nodo_destino: number | string;
  sistema_experto?: number;
}

export interface EditorVisualDataBackend {
  nodos: NodoVisualBackend[];
  conexiones: ConexionVisualBackend[];
}

export type FlowNode = Node<NodoDatosGenerales, TipoNodo>;
export type FlowEdge = Edge;

export interface CrearNodoDTO {
  tipo: TipoNodo;
  posicion_x: number;
  posicion_y: number;
  datos: NodoDatosGenerales;
}

export interface ActualizarNodoDTO {
  posicion_x?: number;
  posicion_y?: number;
  datos?: Partial<NodoDatosGenerales>;
}

export interface CrearConexionDTO {
  nodo_origen: number | string;
  nodo_destino: number | string;
}
