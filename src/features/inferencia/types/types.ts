import type { Regla } from '@/features/base-conocimiento/types/types';

export type EstadoRegla = 'EVALUADA' | 'RECHAZADA' | 'ACTIVADA' | 'EJECUTADA' | string;
export type EstadoEjecucion =
  | 'INACTIVA'
  | 'INICIADA'
  | 'EJECUTANDO'
  | 'EN_PROGRESO'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'COMPLETADA'
  | 'ERROR'
  | string;

export interface DetalleInferencia {
  paso_visual?: number | null;
  paso_numero?: number | null;
  id?: number | string;
  inferencia?: number | string;
  regla?: string | Regla;
  regla_id?: string | number;
  nombre_regla?: string;
  regla_nombre?: string;
  estado: EstadoRegla;
  orden_evaluacion?: number;
  condiciones_cumplidas?: boolean[] | string[];
  condiciones_evaluadas?: Array<{ condicion_id: string | number; resultado: boolean }>;
  total_condiciones?: number;
  condiciones_exitosas?: number;
  resultado_generado?: string;
  explicacion?: string;
  prioridad?: number;
  factor_certeza?: number;
}

export interface HechoDeducido {
  id?: string;
  paso_numero?: number;
  nombre: string;
  valor: unknown;
  tipo_dato?: string;
  factor_certeza?: number;
  procedencia?: 'INICIAL' | 'INFERIDO' | string;
  regla_origen_id?: string;
  regla_origen_nombre?: string;
}

export interface ReglaCandidataConflicto {
  id?: string;
  regla_id: string;
  nombre_regla: string;
  prioridad: number;
  numero_condiciones: number;
  seleccionada: boolean;
  motivo_descarte?: string;
}

export interface ConflictoInferencia {
  id: string;
  paso_numero: number;
  criterio_aplicado: string;
  regla_seleccionada_id?: string;
  regla_seleccionada_nombre?: string;
  reglas_candidatas: ReglaCandidataConflicto[];
}

export interface PasoInferencia {
  id: string;
  paso_numero: number;
  tipo_operacion: string;
  regla_id?: string;
  regla_nombre?: string;
  descripcion_evento: string;
  memoria_trabajo_snapshot: Record<string, unknown>;
  condiciones_evaluadas: Array<{ condicion: string; resultado: boolean; detalle?: string }>;
  hecho_producido?: Record<string, unknown>;
  creado_en?: string;
}

export interface ExplicacionConclusion {
  conclusion: string | null;
  texto: string;
  arbol: Record<string, unknown>;
  conclusion_nombre: string | null;
  conclusion_valor: unknown;
  factor_certeza_final: number | null;
  hechos_iniciales_relevantes: Array<{ nombre: string; valor: unknown; fc?: number }>;
  hechos_intermedios_derivados: Array<{ nombre: string; valor: unknown; paso?: number }>;
  reglas_disparadas: Array<{
    id: string;
    nombre: string;
    prioridad: number | null;
    factor_certeza: number | null;
    condiciones_cumplidas: string[];
    consecuencia: string;
  }>;
  cadena_razonamiento: string[];
  resumen_explicativo: string;
}

export interface EjecucionInferencia {
  paso_visual_actual?: number;
  numero_vuelta?: number;
  siguiente_regla?: { id: string; nombre: string; prioridad: number } | null;
  hechos_iniciales_snapshot?: Array<{ nombre: string; valor: unknown; tipo_dato?: string; opciones?: string[] }>;
  id?: string;
  ejecucion_id?: string;
  sistema_experto?: string;
  sistema_experto_id?: string;
  sistema_experto_nombre?: string;
  fecha_ejecucion?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  created_at?: string;
  estado: EstadoEjecucion;
  modo_inferencia?: 'DIRECTO' | 'SIMULACION_PASO_A_PASO' | string;
  modo?: string;
  es_simulacion?: boolean;
  paso_actual?: number;
  total_pasos?: number;
  conclusion_final?: string;
  factor_certeza_final?: number;
  hechos_iniciales?: Array<{ nombre: string; valor: unknown }>;
  hechos_generados?: HechoDeducido[];
  memoria_trabajo?: Record<string, unknown>;
  detalles?: DetalleInferencia[];
  reglas_evaluadas?: DetalleInferencia[];
  reglas_activadas?: DetalleInferencia[];
  total_reglas_evaluadas?: number;
  total_reglas_activadas?: number;
  tiempo_ejecucion_ms?: number;
}

export type ModoAvanceSimulacion = 'POR_REGLA' | 'COMPLETO';

export interface IniciarInferenciaDTO {
  hechos_iniciales?: Array<{ nombre: string; valor: string | boolean | number; factor_certeza?: number }>;
  modo?: string;
}
