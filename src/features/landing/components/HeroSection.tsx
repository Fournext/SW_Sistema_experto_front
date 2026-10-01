import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, Play } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-stone-50 via-teal-50/20 to-stone-50">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-teal-200/40 via-emerald-200/30 to-amber-100/40 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-teal-400/10 blur-2xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Top Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-semibold mb-6 shadow-xs animate-bounce-slow">
          <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
          <span>Plataforma Didáctica de Inteligencia Artificial Simbólica</span>
          <span className="hidden sm:inline-block bg-teal-200/60 text-teal-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Sprint 1
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.15] max-w-5xl mx-auto font-sans">
          Enseña y Experimenta{' '}
          <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Sistemas Expertos
          </span>{' '}
          de Forma Visual
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Diseñado para apoyar la enseñanza universitaria y demostración práctica de bases de conocimiento,
          diagramación mediante grafos de producción y motor de razonamiento por{' '}
          <strong className="text-teal-800 font-semibold">Encadenamiento Hacia Adelante</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => navigate('/sistemas')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-teal-700/25 hover:shadow-xl hover:shadow-teal-700/35 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>Explorar Sistemas Expertos</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('demostracion');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-semibold text-base border border-stone-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <Play className="w-4 h-4 text-teal-600 fill-teal-600" />
            <span>Ver Demostración Interactiva</span>
          </button>
        </div>

        {/* Feature Checkmarks */}
        <div className="mt-12 pt-8 border-t border-stone-200/60 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm font-medium text-stone-600">
          <div className="flex items-center justify-center gap-2 bg-white/60 py-2.5 px-4 rounded-lg border border-stone-200/50 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Lienzo Visual con React Flow</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white/60 py-2.5 px-4 rounded-lg border border-stone-200/50 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Motor Forward Chaining Puro</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white/60 py-2.5 px-4 rounded-lg border border-stone-200/50 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Traza de Ejecución Transparente</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
