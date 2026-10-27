import React, { useState } from 'react';
import { BookOpen, Menu, ShieldCheck, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Permisos, usePuede } from '../../config/permisos';
import { useAuthStore } from '../../features/auth/authStore';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  sistemaNombre?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sistemaNombre }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const puedeCentral = usePuede(Permisos.CENTRAL_ACCEDER);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const cerrarSesion = async () => {
    setCerrandoSesion(true);
    try {
      await logout();
    } finally {
      navigate('/central/login', { replace: true });
    }
  };

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

      <div className="flex items-center gap-2 sm:gap-3">
        {puedeCentral && (
          <Link to="/central" className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100" title="Admin Central">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden md:inline">Admin Central</span>
          </Link>
        )}
        <span className="hidden sm:block max-w-40 truncate text-xs font-semibold text-stone-700" title={user?.nombre || user?.username}>
          {user?.nombre || user?.username}
        </span>
        <button type="button" onClick={cerrarSesion} disabled={cerrandoSesion} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{cerrandoSesion ? 'Saliendo…' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
