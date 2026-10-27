import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import { Permisos, usePuede } from '../../config/permisos';
import {
  Layers,
  Network,
  Database,
  PlayCircle,
  PlusCircle,
  Cpu,
  ChevronRight,
  Info,
  ShieldCheck,
  History,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

const PermissionLink = ({ permiso, ...props }: NavLinkProps & { permiso: string }) => {
  const permitido = usePuede(permiso);
  return permitido ? <NavLink {...props} /> : null;
};

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const puedeVerSistemas = usePuede(Permisos.SISTEMAS_VER);
  const puedeCrearSistemas = usePuede(Permisos.SISTEMAS_CREAR);
  const puedeVerActividades = usePuede(Permisos.ACTIVIDADES_VER);
  const puedeResolverActividades = usePuede(Permisos.ACTIVIDADES_RESOLVER);

  // Detectar si estamos dentro del contexto de un sistema experto específico (soporta UUID o numérico)
  const currentSistemaId = id || (location.pathname.match(/\/sistemas\/([a-zA-Z0-9-]+)/)?.[1]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-teal-50/90 text-teal-900 font-semibold shadow-2xs border-r-2 border-teal-700'
        : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-900'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-stone-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-800 to-teal-950 text-teal-300 flex items-center justify-center shadow-md shadow-teal-950/15 border border-teal-700/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-stone-900 text-base tracking-tight block font-serif">
              SE-Docente
            </span>
            <span className="text-[11px] text-stone-500 font-medium block">
              Sistemas Expertos v2.0
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* General Section */}
          {(puedeVerSistemas || puedeCrearSistemas) && <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              General
            </div>
            <nav className="space-y-1">
              <PermissionLink permiso={Permisos.SISTEMAS_VER} to="/sistemas" end className={navItemClass} onClick={onClose}>
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Sistemas Expertos</span>
              </PermissionLink>
              <PermissionLink permiso={Permisos.SISTEMAS_CREAR} to="/sistemas/nuevo" className={navItemClass} onClick={onClose}>
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Nuevo Sistema</span>
              </PermissionLink>
            </nav>
          </div>}

          {/* Actividades Educativas */}
          {(puedeVerActividades || puedeResolverActividades) && <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Actividades Didácticas
            </div>
            <nav className="space-y-1">
              <NavLink to="/cursos" className={navItemClass} onClick={onClose}>
                <BookOpen className="w-4 h-4 text-teal-700" />
                <span>Mis cursos</span>
              </NavLink>
              <PermissionLink permiso={Permisos.ACTIVIDADES_VER} to="/actividades" className={navItemClass} onClick={onClose}>
                <GraduationCap className="w-4 h-4 text-teal-700" />
                <span>Biblioteca de actividades</span>
              </PermissionLink>
              <PermissionLink permiso={Permisos.ACTIVIDADES_RESOLVER} to="/mis-actividades" className={navItemClass} onClick={onClose}>
                <BookOpen className="w-4 h-4 text-sky-600" />
                <span>Mis Actividades (Estudiante)</span>
              </PermissionLink>
            </nav>
          </div>}

          {/* Sistema Contextual Section */}
          {currentSistemaId && currentSistemaId !== 'nuevo' && !location.pathname.startsWith('/actividades/resolver/') && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 truncate max-w-[200px]" title={currentSistemaId}>
                  Módulos del Sistema
                </span>
              </div>

              <nav className="space-y-1">
                <PermissionLink permiso={Permisos.SISTEMAS_VER}
                  to={`/sistemas/${currentSistemaId}`}
                  end
                  className={navItemClass}
                  onClick={onClose}
                >
                  <Info className="w-4 h-4 text-stone-500" />
                  <span>Detalle General</span>
                </PermissionLink>

                <PermissionLink permiso={Permisos.EDITOR_VER}
                  to={`/sistemas/${currentSistemaId}/editor`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <Network className="w-4 h-4 text-teal-600" />
                  <span>Editor Visual</span>
                </PermissionLink>

                <PermissionLink permiso={Permisos.BASE_CONOCIMIENTO_VER}
                  to={`/sistemas/${currentSistemaId}/base-conocimiento`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Base de Conocimiento</span>
                </PermissionLink>

                <PermissionLink permiso={Permisos.INFERENCIA_EJECUTAR}
                  to={`/sistemas/${currentSistemaId}/inferencia`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <PlayCircle className="w-4 h-4 text-emerald-600" />
                  <span>Motor de Inferencia</span>
                </PermissionLink>

                {/* Submódulos de Inferencia y Validación */}
                <PermissionLink permiso={Permisos.VALIDACION_VER}
                  to={`/sistemas/${currentSistemaId}/validacion`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Validar BC</span>
                </PermissionLink>

                <PermissionLink permiso={Permisos.INFERENCIA_HISTORIAL_VER}
                  to={`/sistemas/${currentSistemaId}/historial`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <History className="w-4 h-4 text-stone-600" />
                  <span>Historial</span>
                </PermissionLink>
              </nav>
            </div>
          )}

          {!currentSistemaId && puedeVerSistemas && (
            <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-600">
              <p className="font-medium text-stone-800 mb-1 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
                Sugerencia Docente
              </p>
              Selecciona o crea un sistema experto para explorar el editor visual, base de conocimiento, simulación y reportes.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/60">
          <div className="text-[11px] text-stone-500 text-center">
            Software de Apoyo a Sistemas Expertos
            <span className="block text-stone-400 font-mono text-[10px] mt-0.5">Módulo de Inferencia y Didáctica</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
