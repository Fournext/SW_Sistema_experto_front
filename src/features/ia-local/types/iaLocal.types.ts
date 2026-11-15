import type { TipoDato, OperadorComparacion } from '@/features/base-conocimiento/types/types';

export type EstadoMotorIALocal =
  | 'no_cargado'
  | 'descargando'
  | 'listo'
  | 'generando'
  | 'error';

export type NivelCapacidadModelo = 'compacto' | 'equilibrado' | 'avanzado' | 'pesado';

export type ModoEjecucionIA = 'auto' | 'gpu' | 'cpu';
export type BackendActivoIA = 'gpu' | 'cpu' | null;

export interface ModeloIALocalConfig {
  id: string;
  idCpu?: string;
  nombre: string;
  familia: string;
  nivel: NivelCapacidadModelo;
  parametros: string;
  tamanoAproxGB: string;
  vramMinimaGB: number;
  descripcion: string;
  recomendado?: boolean;
}

export interface VariablePropuestaIA {
  nombre: string;
  tipo: TipoDato;
  valor_por_defecto?: string;
  descripcion?: string;
  es_inicial?: boolean;
  pregunta?: string;
  opciones?: string[];
  yaExiste?: boolean;
}

export interface HechoPropuestoIA {
  nombre: string;
  valor: string;
  tipo_dato: TipoDato;
  descripcion?: string;
  es_inicial?: boolean;
  pregunta?: string;
  yaExiste?: boolean;
}

export interface CondicionPropuestaIA {
  referencia: string;
  operador: OperadorComparacion;
  valor_esperado: string;
}

export interface ConclusionPropuestaIA {
  destino: string;
  valor_resultante: string;
}

export interface ReglaPropuestaIA {
  nombre: string;
  descripcion: string;
  prioridad: number;
  factor_certeza: number;
  condiciones: CondicionPropuestaIA[];
  conclusiones: ConclusionPropuestaIA[];
}

export interface BorradorReglasIA {
  resumen: string;
  variables: VariablePropuestaIA[];
  hechos: HechoPropuestoIA[];
  reglas: ReglaPropuestaIA[];
}

export interface HechoEntradaPruebaIA {
  nombre: string;
  valor: string;
}

export interface CasoPruebaGeneradoIA {
  id: string;
  titulo: string;
  categoria: 'positivo' | 'borde' | 'negativo';
  descripcion: string;
  hechosEntrada: HechoEntradaPruebaIA[];
  conclusionEsperada: string;
  reglasEsperadas: string[];
  ultimoResultado?: {
    conclusionObtenida: string | null;
    coincide: boolean;
    reglasActivadas: string[];
    ejecutadoEn: string;
  };
}

