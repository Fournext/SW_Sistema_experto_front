import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, CheckCircle2, Play } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 border-b border-stone-200 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Top Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-xs sm:text-sm font-medium mb-6">
          <Cpu className="w-3.5 h-3.5 text-teal-700" />
          <span>Plataforma Didáctica de Inteligencia Artificial Simbólica</span>
          <span className="hidden sm:inline-block bg-teal-100 text-teal-900 text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono">
            Sistemas Expertos
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.12] max-w-4xl mx-auto font-sans">
          Enseña y Experimenta{' '}
          <span className="text-teal-800 font-serif font-normal italic">
            Sistemas Expertos
          </span>{' '}
          de Forma Visual
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Diseñado para apoyar la enseñanza universitaria y demostración práctica de bases de conocimiento,
          diagramación mediante grafos de producción y motor de razonamiento por{' '}
          <strong className="text-stone-800 font-semibold">Encadenamiento Hacia Adelante</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => navigate('/central/login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <span>Explorar Sistemas Expertos</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('demostracion');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 font-medium text-sm border border-stone-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-stone-500 fill-stone-500" />
            <span>Ver Demostración</span>
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
