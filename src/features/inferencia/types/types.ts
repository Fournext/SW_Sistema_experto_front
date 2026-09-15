import type { Regla } from '@/features/base-conocimiento/types/types';

export type EstadoRegla = 'EVALUADA' | 'RECHAZADA' | 'ACTIVADA' | 'EJECUTADA' | string;
export type EstadoEjecucion = 'INACTIVA' | 'EN_PROGRESO' | 'COMPLETADA' | 'FINALIZADA' | 'ERROR' | string;

export interface DetalleInferencia {
  id?: number | string;
  inferencia?: number | string;
  regla?: string | Regla;
  regla_id?: string | number;
  nombre_regla?: string;
  regla_nombre?: string;
  estado: EstadoRegla;
  orden_evaluacion?: number;
  condiciones_cumplidas?: boolean[] | string[];
  total_condiciones?: number;
  condiciones_exitosas?: number;
  resultado_generado?: string;
  explicacion?: string;
  prioridad?: number;
  factor_certeza?: number;
}

export interface HechoDeducido {
  nombre: string;
  valor: string | boolean | number;
  origen_regla?: string;
}

export interface EjecucionInferencia {
  id?: number | string;
  ejecucion_id?: string | number;
  sistema_experto?: number;
  fecha_ejecucion?: string;
  created_at?: string;
  estado: EstadoEjecucion;
  conclusion_final?: string;
  factor_certeza_final?: number;
  hechos_iniciales?: Array<{ nombre: string; valor: unknown }>;
  hechos_generados?: HechoDeducido[];
  detalles?: DetalleInferencia[];
  reglas_evaluadas?: DetalleInferencia[];
  reglas_activadas?: DetalleInferencia[];
  total_reglas_evaluadas?: number;
  total_reglas_activadas?: number;
  tiempo_ejecucion_ms?: number;
}

export interface IniciarInferenciaDTO {
  hechos_iniciales?: Array<{ nombre: string; valor: string }>;
}
