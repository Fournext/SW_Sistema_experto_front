import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import Spinner from '@/components/ui/Spinner';
import TerminosPrimerIngresoModal from '@/shared/components/TerminosPrimerIngresoModal';

export default function AuthGuard() {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const restaurarSesion = useAuthStore(state => state.restaurarSesion);
  const location = useLocation();
  useEffect(() => { void restaurarSesion(); }, [restaurarSesion]);
  if (status === 'cargando') return <div className="min-h-screen flex items-center justify-center gap-3 text-teal-800"><Spinner />Restaurando sesión…</div>;
  if (status !== 'autenticado') return <Navigate replace to={`/central/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`} />;
  if (user && user.terminos_aceptados === false) return <TerminosPrimerIngresoModal />;
  return <Outlet />;
}
