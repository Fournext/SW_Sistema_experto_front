import React, { useState } from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import { authService } from '@/features/auth/services/authService';

export const TerminosPrimerIngresoModal: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const actualizarUsuario = useAuthStore((s) => s.actualizarUsuario);
  const logout = useAuthStore((s) => s.logout);

  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError('Debes marcar la casilla para aceptar los Términos y Condiciones antes de ingresar.');
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Primer ingreso a ExpertEdu Studio
          </p>
          <h1 className="mt-1 text-xl font-bold">
            Uso académico, inteligencia artificial y responsabilidad del usuario
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Usuario: {user?.username} ({user?.email}) — Aceptación obligatoria para continuar.
          </p>
        </div>

        <form onSubmit={handleAccept} className="p-6 space-y-5">
          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 space-y-3">
            <div>
              <p className="font-bold text-slate-900">1. Finalidad de la plataforma</p>
              <p>
                ExpertEdu Studio es una plataforma educativa destinada a apoyar la enseñanza y el
                aprendizaje de Sistemas Expertos mediante herramientas interactivas para la
                creación, edición, ejecución, simulación y validación de bases de conocimiento.
                Constituye un recurso de apoyo pedagógico y no sustituye la orientación, supervisión
                ni evaluación realizada por un docente.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-900">2. Responsabilidades del docente</p>
              <p>
                El docente es responsable de supervisar los contenidos académicos, configurar las
                actividades, verificar la coherencia de las bases de conocimiento utilizadas y
                revisar los resultados de las evaluaciones. La publicación de actividades y la
                asignación de calificaciones permanecen bajo responsabilidad docente.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-900">3. Uso de inteligencia artificial</p>
              <p>
                ExpertEdu podrá proporcionar asistencia mediante inteligencia artificial para sugerir
                hechos, variables, reglas de producción, ejemplos y explicaciones. Los contenidos
                generados automáticamente pueden presentar errores o imprecisiones y deberán
                considerarse propuestas sujetas a revisión y validación humana.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-900">4. Resultados del motor de inferencia</p>
              <p>
                El motor de inferencia procesa los hechos y reglas definidos en cada base de
                conocimiento. La validez de las conclusiones depende de la correcta formulación de
                las reglas e integridad de los hechos iniciales; la ejecución satisfactoria no
                implica automáticamente validez respecto al dominio real sin revisión experta.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-900">5. Uso responsable de la plataforma</p>
              <p>
                Los usuarios deben utilizar ExpertEdu exclusivamente para actividades autorizadas.
                Queda prohibida la manipulación no autorizada de evaluaciones, la suplantación de
                identidad y cualquier actividad destinada a comprometer la seguridad o el
                funcionamiento del servicio.
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-900">
                6. Privacidad y protección de información académica
              </p>
              <p>
                Los datos personales y académicos se tratan conforme a la Política de Privacidad de
                ExpertEdu Solutions S.R.L., y los contenidos enviados a servicios externos de
                inteligencia artificial quedan sujetos a las condiciones aplicables.
              </p>
            </div>
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
              <strong>Términos y Condiciones de Uso</strong> y la{' '}
              <strong>Política de Privacidad</strong> para acceder a ExpertEdu Studio.
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
