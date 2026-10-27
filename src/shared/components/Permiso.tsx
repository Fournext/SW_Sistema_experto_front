import type { ReactNode } from 'react';
import { usePuede } from '@/config/permisos';

/** Oculta una acción cuando la sesión no tiene los permisos requeridos. */
export function Permiso({ permisos, children }: { permisos: string[]; children: ReactNode }) {
  return usePuede(...permisos) ? <>{children}</> : null;
}
