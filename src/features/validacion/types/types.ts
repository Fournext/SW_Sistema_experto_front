export type SeveridadIncidencia = 'ERROR' | 'ADVERTENCIA';

export type TipoIncidencia = 'ESTRUCTURAL' | 'SEMANTICA' | 'REFERENCIAL' | 'CICLO';

export interface IncidenciaValidacion {
  id: string;
  validacion_id?: string;
  codigo: string;
  tipo: TipoIncidencia;
  severidad: SeveridadIncidencia;
  entidad_tipo: string;
  entidad_id?: string;
  entidad_nombre: string;
  descripcion: string;
  posible_causa?: string;
  sugerencia?: string;
  creada_en?: string;
}

export interface ResultadoValidacion {
  id: string;
  base_conocimiento_id: string;
  fecha_validacion: string;
  es_valida: boolean;
  total_errores: number;
  total_advertencias: number;
  resumen: string;
  incidencias: IncidenciaValidacion[];
}
