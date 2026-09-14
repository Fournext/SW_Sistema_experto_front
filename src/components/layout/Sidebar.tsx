import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import {
  Layers,
  Network,
  Database,
  PlayCircle,
  PlusCircle,
  Cpu,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();

  // Detectar si estamos dentro del contexto de un sistema experto específico
  const currentSistemaId = id || (location.pathname.match(/\/sistemas\/(\d+)/)?.[1]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block">
              SE-Docente
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              Sistemas Expertos v1.0
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* General Section */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              General
            </div>
            <nav className="space-y-1">
              <NavLink to="/sistemas" end className={navItemClass} onClick={onClose}>
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Sistemas Expertos</span>
              </NavLink>
              <NavLink to="/sistemas/nuevo" className={navItemClass} onClick={onClose}>
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span>Nuevo Sistema</span>
              </NavLink>
            </nav>
          </div>

          {/* Sistema Contextual Section */}
          {currentSistemaId && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Módulos del Sistema #{currentSistemaId}
                </span>
              </div>

              <nav className="space-y-1">
                <NavLink
                  to={`/sistemas/${currentSistemaId}`}
                  end
                  className={navItemClass}
                  onClick={onClose}
                >
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>Detalle General</span>
                </NavLink>

                <NavLink
                  to={`/sistemas/${currentSistemaId}/editor`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <Network className="w-4 h-4 text-sky-500" />
                  <span>Editor Visual</span>
                </NavLink>

                <NavLink
                  to={`/sistemas/${currentSistemaId}/base-conocimiento`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>Base de Conocimiento</span>
                </NavLink>

                <NavLink
                  to={`/sistemas/${currentSistemaId}/inferencia`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <PlayCircle className="w-4 h-4 text-emerald-600" />
                  <span>Motor de Inferencia</span>
                </NavLink>
              </nav>
            </div>
          )}

          {!currentSistemaId && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                Sugerencia
              </p>
              Selecciona o crea un sistema experto para habilitar el editor visual, base de conocimiento e inferencia.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-500 text-center">
            Software Educativo Universitario
            <span className="block text-slate-400 font-mono mt-0.5">Apoyo Docente</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
