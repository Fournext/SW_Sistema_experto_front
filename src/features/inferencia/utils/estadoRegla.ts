import type { EstadoRegla } from '../types/types';
import type { BadgeVariant } from '@/components/ui/Badge';

export const getEstadoBadgeVariant = (estado: EstadoRegla): BadgeVariant => {
  switch (estado) {
    case 'ACTIVADA':
      return 'success';
    case 'EJECUTADA':
      return 'indigo';
    case 'RECHAZADA':
      return 'danger';
    case 'EVALUADA':
    default:
      return 'neutral';
  }
};

export const getEstadoDescripcion = (estado: EstadoRegla): string => {
  switch (estado) {
    case 'ACTIVADA':
      return 'Condiciones satisfechas (Lista para resolver conflicto)';
    case 'EJECUTADA':
      return 'Regla disparada y conclusión agregada a la memoria de trabajo';
    case 'RECHAZADA':
      return 'Una o más premisas no se cumplieron';
    case 'EVALUADA':
    default:
      return 'Condiciones analizadas por el motor de inferencia';
  }
};
