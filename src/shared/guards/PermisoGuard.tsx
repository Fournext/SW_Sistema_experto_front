import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { usePuede } from '@/config/permisos';
import { useAuthStore } from '@/features/auth/authStore';
import { destinoPostLogin } from '@/features/auth/utils/destinoPostLogin';
import Button from '@/components/ui/Button';

export default function PermisoGuard({ permisos }: { permisos: string[] }) {
  const puede = usePuede(...permisos);
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  if (puede) return <Outlet />;
  return <section className="mx-auto my-16 max-w-xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-800"><ShieldAlert size={36} /></div>
    <p className="text-xs uppercase tracking-[.2em] text-teal-700">Acceso restringido</p>
    <h1 className="my-4 font-serif text-3xl text-stone-900">No tiene acceso a esta sección</h1>
    <p className="mb-8 text-sm leading-6 text-stone-500">Tu cuenta no cuenta con los permisos necesarios. Solicita al administrador que revise los permisos de tu rol.</p>
    <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(user ? destinoPostLogin(user) : '/', { replace: true })}>Volver al inicio</Button>
  </section>;
}
