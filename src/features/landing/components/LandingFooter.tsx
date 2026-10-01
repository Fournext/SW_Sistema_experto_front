import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ArrowUp } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-900 text-stone-400 py-16 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-stone-800">
          {/* Brand Info */}
          <div className="md:col-span-6">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">ExpertoLab</span>
            </Link>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Software Educativo Interactivo de Apoyo Docente para la Enseñanza y Experimentación de Sistemas Expertos Basados en Reglas (*Forward Chaining*).
            </p>
            <p className="text-xs text-stone-500 mt-4">
              Sprint 1 — Proyecto de Taller de Grado I
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-white text-sm mb-4">Módulos del Sistema</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/sistemas" className="hover:text-teal-400 transition-colors">
                  Sistemas Expertos
                </Link>
              </li>
              <li>
                <Link to="/sistemas" className="hover:text-teal-400 transition-colors">
                  Base de Conocimiento
                </Link>
              </li>
              <li>
                <Link to="/sistemas" className="hover:text-teal-400 transition-colors">
                  Lienzo Visual React Flow
                </Link>
              </li>
              <li>
                <Link to="/sistemas" className="hover:text-teal-400 transition-colors">
                  Motor de Inferencia
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Badges */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-white text-sm mb-4">Tecnologías</h4>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-stone-300">
              <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">Django DRF</span>
              <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">React 19</span>
              <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">TypeScript</span>
              <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">React Flow</span>
              <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">Tailwind v4</span>
              <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">TanStack Query</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} ExpertoLab. Herramienta Educativa Universitaria.</p>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
          >
            <span>Volver arriba</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
