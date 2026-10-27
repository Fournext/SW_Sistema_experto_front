import type { TipoDato } from '@/features/base-conocimiento/types/types';

export interface EntradaTrabajo {
  id?: string;
  nombre: string;
  tipo_dato: TipoDato;
  valor?: unknown;
  pregunta?: string;
  opciones?: string[];
}
