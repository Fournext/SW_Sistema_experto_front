import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { CORPORATE_LANDING_URL, PRIVACY_SECTIONS } from '@/config/legal';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-stone-200 bg-stone-900 px-6 py-7 text-white sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a ExpertEdu Studio
            </Link>
            <a
              href={CORPORATE_LANDING_URL}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700"
            >
              Volver a ExpertEdu
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <ShieldCheck className="h-4 w-4" />
            Transparencia y protección de datos
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm text-stone-300">
            ExpertEdu Solutions S.R.L. · Plataforma ExpertEdu Studio
          </p>
        </div>

        <div className="space-y-6 p-6 text-sm leading-relaxed text-stone-600 sm:p-8">
          {PRIVACY_SECTIONS.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-base font-bold text-stone-900">{sec.title}</h2>
              {sec.paragraphs.map((p, idx) => (
                <p key={idx} className="mt-2">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-6">
            <Link
              to="/terminos"
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              Ver Términos y Condiciones &rarr;
            </Link>
            <a
              href={`${CORPORATE_LANDING_URL}/privacidad`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              Ver en la web corporativa de ExpertEdu
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
