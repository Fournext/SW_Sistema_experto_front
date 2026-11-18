import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { authService } from '@/features/auth/services/authService';
import { CORPORATE_LANDING_URL, PRIVACY_SECTIONS, TERMS_SECTIONS } from '@/config/legal';

export const TerminosPrimerIngresoModal: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const actualizarUsuario = useAuthStore((s) => s.actualizarUsuario);
  const logout = useAuthStore((s) => s.logout);

  const [tab, setTab] = useState<'terminos' | 'privacidad'>('terminos');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError(
        'Debes marcar la casilla para aceptar los Términos y Condiciones y la Política de Privacidad.',
      );
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authService.aceptarTerminos();
      await actualizarUsuario();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la aceptación.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeSections = tab === 'terminos' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Primer ingreso a ExpertEdu Studio
            </p>
            <a
              href={CORPORATE_LANDING_URL}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white"
            >
              Volver a ExpertEdu
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <h1 className="mt-1 text-xl font-bold">
            Términos y Condiciones y Política de Privacidad
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Usuario: {user?.username} ({user?.email}) — Aceptación obligatoria para continuar.
          </p>
        </div>

        <form onSubmit={handleAccept} className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('terminos')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  tab === 'terminos'
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Términos y Condiciones ({TERMS_SECTIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('privacidad')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                  tab === 'privacidad'
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Política de Privacidad ({PRIVACY_SECTIONS.length})
              </button>
            </div>

            <a
              href={
                tab === 'terminos'
                  ? `${CORPORATE_LANDING_URL}/terminos`
                  : `${CORPORATE_LANDING_URL}/privacidad`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              Abrir en la web de ExpertEdu
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 space-y-3">
            {activeSections.map((sec) => (
              <div key={sec.title}>
                <p className="font-bold text-slate-900">{sec.title}</p>
                {sec.paragraphs.map((p, idx) => (
                  <p key={idx} className="mt-1">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            <span>
              He leído y acepto obligatoriamente los{' '}
              <a
                href={`${CORPORATE_LANDING_URL}/terminos`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                Términos y Condiciones de Uso
              </a>{' '}
              y la{' '}
              <a
                href={`${CORPORATE_LANDING_URL}/privacidad`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-700 underline"
              >
                Política de Privacidad
              </a>{' '}
              para acceder a ExpertEdu Studio.
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
            <button
              type="submit"
              disabled={!accepted || submitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? 'Guardando aceptación...' : 'Aceptar y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TerminosPrimerIngresoModal;
