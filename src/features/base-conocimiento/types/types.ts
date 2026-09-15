export type TipoDato = 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO';
export type OperadorComparacion = '==' | '!=' | '>' | '<' | '>=' | '<=';

export interface Hecho {
  id: number | string;
  nombre: string;
  valor: string;
  tipo_dato: TipoDato;
  es_inicial: boolean;
  base_conocimiento?: number | string;
  base_conocimiento_id?: number | string;
  sistema_experto?: number | string;
}

export interface Variable {
  id: number | string;
  nombre: string;
  tipo: TipoDato;
  tipo_dato?: TipoDato;
  valor_por_defecto?: string;
  valor_defecto?: string;
  descripcion?: string;
  base_conocimiento?: number | string;
  base_conocimiento_id?: number | string;
  sistema_experto?: number | string;
}

export interface Condicion {
  id: number | string;
  referencia?: string;
  variable_id?: number | string | null;
  hecho_id?: number | string | null;
  variable_nombre?: string;
  hecho_nombre?: string;
  operador: OperadorComparacion | string;
  valor_esperado: string;
  orden?: number;
  regla?: number | string;
  regla_id?: number | string;
}

export interface Conclusion {
  id: number | string;
  destino?: string;
  hecho_resultante_id?: number | string | null;
  variable_resultante_id?: number | string | null;
  variable_nombre?: string;
  hecho_nombre?: string;
  valor_resultante: string;
  regla?: number | string;
  regla_id?: number | string;
}

export interface Regla {
  id: number | string;
  nombre: string;
  descripcion?: string;
  prioridad: number;
  factor_certeza: number | string;
  activa: boolean;
  condiciones?: Condicion[];
  conclusiones?: Conclusion[];
  base_conocimiento?: number | string;
  base_conocimiento_id?: number | string;
  sistema_experto?: number | string;
}

export interface BaseConocimiento {
  id: number;
  sistema_experto: number;
  hechos?: Hecho[];
  variables?: Variable[];
  reglas?: Regla[];
}

// DTOs
export interface CrearHechoDTO {
  nombre: string;
  valor: string;
  tipo_dato: TipoDato;
  es_inicial: boolean;
  base_conocimiento?: number;
}

export interface CrearVariableDTO {
  nombre: string;
  tipo: TipoDato;
  tipo_dato?: TipoDato;
  valor_por_defecto?: string;
  valor_defecto?: string;
  descripcion?: string;
  base_conocimiento?: number;
}

export interface CrearReglaDTO {
  nombre: string;
  descripcion?: string;
  prioridad: number;
  factor_certeza: number;
  activa: boolean;
  base_conocimiento?: number;
}

export interface CrearCondicionDTO {
  referencia?: string;
  operador: OperadorComparacion | string;
  valor_esperado: string;
  orden?: number;
  variable_id?: number | string | null;
  hecho_id?: number | string | null;
}

export interface CrearConclusionDTO {
  destino?: string;
  valor_resultante: string;
  variable_resultante_id?: number | string | null;
  hecho_resultante_id?: number | string | null;
}
