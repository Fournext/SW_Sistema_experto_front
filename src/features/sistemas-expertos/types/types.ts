export interface SistemaExperto {
  id: string | number;
  nombre: string;
  descripcion: string | null;
  activo?: boolean;
  estado?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  creado_en?: string;
  actualizado_en?: string;
  created_at?: string;
  updated_at?: string;
  total_reglas?: number;
  total_hechos?: number;
}

export interface CrearSistemaExpertoDTO {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface ActualizarSistemaExpertoDTO {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
