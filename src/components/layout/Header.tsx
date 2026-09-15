import React from 'react';
import { BookOpen, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  sistemaNombre?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sistemaNombre }) => {
  const location = useLocation();

  const getSectionTitle = () => {
    if (location.pathname.includes('/editor')) return 'Editor Visual de Reglas';
    if (location.pathname.includes('/base-conocimiento')) return 'Base de Conocimiento';
    if (location.pathname.includes('/inferencia')) return 'Motor de Inferencia';
    if (location.pathname.includes('/nuevo')) return 'Nuevo Sistema Experto';
    return 'Panel de Docencia';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-xs border-b border-stone-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg lg:hidden cursor-pointer"
          aria-label="Alternar menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-stone-900 leading-tight font-serif">
              {sistemaNombre ? sistemaNombre : 'Sistema Experto'}
            </h1>
            <p className="text-xs text-stone-500 leading-tight hidden sm:block">
              {getSectionTitle()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/90">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse" />
          Laboratorio Docente
        </span>
      </div>
    </header>
  );
};

export default Header;
