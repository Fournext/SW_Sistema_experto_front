import type { Hecho, Regla } from '@/features/base-conocimiento/types/types';

export type EstadoRegla = 'EVALUADA' | 'RECHAZADA' | 'ACTIVADA' | 'EJECUTADA';
export type EstadoEjecucion = 'INACTIVA' | 'EN_PROGRESO' | 'COMPLETADA' | 'ERROR';

export interface DetalleInferencia {
  id: number;
  inferencia?: number;
  regla?: Regla;
  nombre_regla?: string;
  regla_nombre?: string;
  estado: EstadoRegla;
  orden_evaluacion: number;
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
  valor: string;
  origen_regla?: string;
}

export interface EjecucionInferencia {
  id: number;
  sistema_experto: number;
  fecha_ejecucion?: string;
  created_at?: string;
  estado: EstadoEjecucion;
  conclusion_final?: string;
  factor_certeza_final?: number;
  hechos_iniciales?: Hecho[];
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
