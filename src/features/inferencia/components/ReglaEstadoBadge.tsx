import React from 'react';
import Badge from '@/components/ui/Badge';
import type { EstadoRegla } from '../types/types';
import { getEstadoBadgeVariant } from '../utils/estadoRegla';

export interface ReglaEstadoBadgeProps {
  estado: EstadoRegla;
}

export const ReglaEstadoBadge: React.FC<ReglaEstadoBadgeProps> = ({ estado }) => {
  const variant = getEstadoBadgeVariant(estado);

  return (
    <Badge variant={variant} size="sm" dot>
      {estado}
    </Badge>
  );
};

export default ReglaEstadoBadge;
