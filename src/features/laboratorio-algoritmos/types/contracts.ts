/**
 * Contratos y tipado TypeScript para el Laboratorio de Algoritmos de Inferencia.
 */

export type EstadoCorrida =
  | 'INICIADA'
  | 'EJECUTANDO'
  | 'ESPERANDO_ENTRADA'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'ERROR'
  | 'CANCELADA';

export type ModoAvance = 'LINE_STEP' | 'INSTRUCTION_STEP' | 'RUN_TO_END';

export interface ErrorCompilacion {
  mensaje: string;
  linea?: number;
  columna?: number;
  offset?: number;
  fase: string;
}

export interface CompilarSalida {
  valido: boolean;
  errores: ErrorCompilacion[];
  warnings: Array<Record<string, unknown>>;
  funciones?: string[];
}

export interface EventoTraza {
  tipo: string;
  descripcion: string;
  datos?: Record<string, unknown>;
  pc: number;
  linea: number;
  columna: number;
}

export interface PreguntaPendiente {
  id_pregunta: string;
  variable_id: string;
  variable_nombre: string;
  texto: string;
}

export interface VariableRuntime {
  tipo_objeto: 'Variable';
  id: string;
  nombre: string;
  tipo_dato: string;
  es_nativa?: boolean;
}

export interface HechoRuntime {
  tipo_objeto: 'Hecho';
  id: string;
  variable_id: string;
  variable_nombre: string;
  valor: unknown;
  tipo_dato: string;
}

export interface ReglaRuntime {
  tipo_objeto: 'Regla';
  id: string;
  nombre: string;
  orden: number;
  condiciones: string;
  conclusion: string;
  marcada?: boolean;
  disparada?: boolean;
}

export interface BaseHechosRuntime {
  tipo_objeto: 'BaseHechos';
  hechos: Record<string, HechoRuntime>;
  consultadas: string[];
}

export interface ColeccionRuntime<T = unknown> {
  tipo_objeto: 'Lista' | 'Pila' | 'Cola';
  elementos: T[];
}

export interface StackFrameRuntime {
  nombre_funcion: string;
  pc: number;
  variables: Record<string, unknown>;
  pila_operandos: unknown[];
}

export interface EstadoVM {
  estado: EstadoCorrida;
  pasos_visibles: number;
  instrucciones_totales: number;
  marcas_reglas: string[];
  pregunta_pendiente: PreguntaPendiente | null;
  frames: StackFrameRuntime[];
  eventos: EventoTraza[];
  salidas_texto: string[];
  error_detalle?: { codigo: string; mensaje: string } | null;
}

export interface SnapshotBC {
  sistema_experto_id?: string;
  base_conocimiento_id?: string;
  base_conocimiento_nombre?: string;
  variables: Array<{
    id: string;
    nombre: string;
    tipo_dato: string;
    pregunta?: string;
    es_inicial?: boolean;
  }>;
  hechos_iniciales: Array<{
    variable: string;
    valor: unknown;
    origen?: string;
  }>;
  reglas: Array<{
    id: string;
    nombre: string;
    orden: number;
    prioridad: number;
    marcada: boolean;
    disparada: boolean;
    premisas: Array<{ variable: string; operador: string; valor: unknown }>;
    conclusiones: Array<{ variable: string; valor: unknown }>;
  }>;
}

export interface CorridaLaboratorio {
  id: string;
  programa?: string | null;
  sistema_experto?: string | null;
  estado: EstadoCorrida;
  total_pasos: number;
  mensaje_salida: string;
  estado_vm: EstadoVM;
  creada_en: string;
  actualizada_en: string;
}

export interface PlantillaAlgoritmo {
  id: string;
  titulo: string;
  descripcion: string;
  codigo: string;
}

export interface ProgramaAlgoritmo {
  id: string;
  owner: string;
  owner_nombre: string;
  sistema_experto?: string | null;
  titulo: string;
  descripcion: string;
  codigo_fuente: string;
  version_entero: number;
  es_publico: boolean;
  creado_en: string;
  actualizado_en: string;
}

