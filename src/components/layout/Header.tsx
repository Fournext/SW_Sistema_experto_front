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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
          aria-label="Alternar menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              {sistemaNombre ? sistemaNombre : 'Sistema Experto'}
            </h1>
            <p className="text-xs text-slate-500 leading-tight hidden sm:block">
              {getSectionTitle()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Modo Docente
        </span>
      </div>
    </header>
  );
};

export default Header;
