import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

export const SeedTemplateBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/15 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plantilla Precargada de Ejemplo (Seed Sprint 1)</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Recomendador de Metodología de Desarrollo
            </h3>
            <p className="mt-3 text-stone-200 text-sm sm:text-base leading-relaxed">
              Explora una base de conocimiento lista para usar que evalúa el tamaño de equipo, dinamismo de requisitos y disponibilidad del cliente para recomendar metodologías como <strong>Scrum</strong>, <strong>Waterfall</strong> o <strong>XP</strong>.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-teal-200 font-medium">
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                4 Hechos Iniciales
              </span>
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                3 Reglas de Producción
              </span>
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Lienzo de Nodos Diagramado
              </span>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <button
              onClick={() => navigate('/sistemas')}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold text-base shadow-lg shadow-emerald-400/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Explorar Plantilla en la App</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeedTemplateBanner;
