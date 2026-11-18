import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTokens } from '@/features/auth/sessionStorage';
import { useAuthStore } from '@/features/auth/authStore';
import { destinoPostLogin } from '@/features/auth/utils/destinoPostLogin';
import Spinner from '@/components/ui/Spinner';

export default function SsoCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access = params.get('access');
    const refresh = params.get('refresh');

    if (!access || !refresh) {
      setError('No se recibieron credenciales de sesión válidas desde ExpertEdu.');
      return;
    }

    // Limpiar tokens de la URL inmediatamente
    window.history.replaceState(null, '', window.location.pathname);
    saveTokens({ access, refresh });

    useAuthStore.setState({ accessToken: access, refreshToken: refresh, status: 'cargando' });
    useAuthStore
      .getState()
      .restaurarSesion()
      .then(() => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          setError('No se pudo validar la sesión en ExpertEdu Studio.');
          return;
        }
        navigate(destinoPostLogin(currentUser), { replace: true });
      })
      .catch(() => {
        setError('No se pudo iniciar la sesión SSO en ExpertEdu Studio.');
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Error de acceso SSO</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <a
            href="/central/login"
            className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gap-3 text-teal-800">
      <Spinner />
      Iniciando sesión en ExpertEdu Studio…
    </div>
  );
}
