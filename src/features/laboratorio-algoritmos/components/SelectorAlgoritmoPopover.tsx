import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  FileCode,
  Users,
  Bookmark,
  Check,
  ChevronDown,
  Trash2,
  Lock,
  GitFork,
  X,
} from 'lucide-react';
import type {
  ComparticionPrograma,
  PlantillaAlgoritmo,
  ProgramaAlgoritmo,
} from '../types/contracts';

interface SelectorAlgoritmoPopoverProps {
  plantillas: PlantillaAlgoritmo[];
  programasPropios: ProgramaAlgoritmo[];
  programasCompartidos: ComparticionPrograma[];
  programaActivo: ProgramaAlgoritmo | null;
  valorSeleccionado: string;
  onSeleccionar: (claveCompuesta: string) => void;
  onNuevo: () => void;
  onEliminarPrograma?: (id: string, titulo: string) => void;
}

export const SelectorAlgoritmoPopover: React.FC<SelectorAlgoritmoPopoverProps> = ({
  plantillas,
  programasPropios,
  programasCompartidos,
  programaActivo,
  valorSeleccionado,
  onSeleccionar,
  onNuevo,
  onEliminarPrograma,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    if (abierto) {
      document.addEventListener('mousedown', handleClickFuera);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  // Cerrar al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) {
        setAbierto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto]);

  const q = busqueda.trim().toLowerCase();

  const plantillasFiltradas = plantillas.filter(
    (p) => !q || p.titulo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
  );

  const propiosFiltrados = programasPropios.filter(
    (p) => !q || p.titulo.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
  );

  const compartidosFiltrados = programasCompartidos.filter(
    (c) =>
      !q ||
      c.programa_titulo.toLowerCase().includes(q) ||
      c.curso_nombre.toLowerCase().includes(q) ||
      c.docente_nombre.toLowerCase().includes(q)
  );

  // Obtener etiqueta amigable del elemento activo actual
  let etiquetaActual = 'Seleccionar Algoritmo...';
  if (programaActivo) {
    etiquetaActual = programaActivo.titulo;
  } else if (valorSeleccionado.startsWith('plantilla:')) {
    const id = valorSeleccionado.replace('plantilla:', '');
    const p = plantillas.find((item) => item.id === id);
    if (p) etiquetaActual = p.titulo;
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón Disparador del Popover */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700/80 hover:border-slate-600 px-3 py-1.5 text-xs text-slate-200 transition-colors shadow-sm outline-none focus:ring-1 focus:ring-indigo-500 max-w-[260px]"
        title="Seleccionar o buscar algoritmo"
      >
        <FolderOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="truncate font-medium">{etiquetaActual}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-auto" />
      </button>

      {/* Menú Desplegable con Búsqueda */}
      {abierto && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden max-h-[480px]">
          {/* Cabecera con Buscador */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar algoritmo o plantilla..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Acción Rápida: Nuevo Algoritmo */}
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                onNuevo();
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-indigo-700/60 bg-indigo-950/30 hover:bg-indigo-900/50 py-1.5 text-xs font-semibold text-indigo-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Algoritmo en Blanco</span>
            </button>
          </div>

          {/* Listado con Secciones */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-3 divide-y divide-slate-800/60">
            {/* Grupo 1: Mis Algoritmos */}
            <div className="pt-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="h-3 w-3 text-indigo-400" />
                  Mis Algoritmos Guardados
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-400">
                  {propiosFiltrados.length}
                </span>
              </div>

              {propiosFiltrados.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-slate-500 italic">
                  {busqueda ? 'No coincide ningún algoritmo' : 'No tienes algoritmos guardados aún'}
                </div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {propiosFiltrados.map((prog) => {
                    const clave = `propio:${prog.id}`;
                    const esSeleccionado = valorSeleccionado === clave || programaActivo?.id === prog.id;
                    return (
                      <div
                        key={prog.id}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                          esSeleccionado
                            ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-800/60'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                        }`}
                        onClick={() => {
                          onSeleccionar(clave);
                          setAbierto(false);
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <div className="truncate">
                            <div className="truncate font-medium">{prog.titulo}</div>
                            {prog.programa_origen_titulo && (
                              <div className="text-[10px] text-slate-500 truncate">
                                Fork: {prog.programa_origen_titulo}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-mono text-slate-400">
                            v{prog.version_entero}
                          </span>
                          {esSeleccionado && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                          {onEliminarPrograma && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEliminarPrograma(prog.id, prog.titulo);
                              }}
                              title="Eliminar este algoritmo"
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grupo 2: Compartidos por el Docente */}
            {programasCompartidos.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-cyan-400" />
                    Compartidos por el Docente
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-400">
                    {compartidosFiltrados.length}
                  </span>
                </div>

                {compartidosFiltrados.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-slate-500 italic">
                    No coincide ningún algoritmo compartido
                  </div>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {compartidosFiltrados.map((comp) => {
                      const clave = `compartido:${comp.id}`;
                      const esSeleccionado = valorSeleccionado === clave;
                      return (
                        <div
                          key={comp.id}
                          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                            esSeleccionado
                              ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-800/60'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                          }`}
                          onClick={() => {
                            onSeleccionar(clave);
                            setAbierto(false);
                          }}
                        >
                          <div className="truncate">
                            <div className="truncate font-medium">{comp.programa_titulo}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              Prof. {comp.docente_nombre} • {comp.curso_nombre}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                comp.modo_acceso === 'LECTURA'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              }`}
                            >
                              {comp.modo_acceso === 'LECTURA' ? (
                                <Lock className="inline h-2.5 w-2.5 mr-0.5" />
                              ) : (
                                <GitFork className="inline h-2.5 w-2.5 mr-0.5" />
                              )}
                              {comp.modo_acceso === 'LECTURA' ? 'Lectura' : 'Editable'}
                            </span>
                            {esSeleccionado && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Grupo 3: Plantillas Oficiales */}
            <div className="pt-2">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileCode className="h-3 w-3 text-slate-400" />
                  Plantillas Canónicas Oficiales
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-400">
                  {plantillasFiltradas.length}
                </span>
              </div>

              <div className="space-y-0.5 mt-1">
                {plantillasFiltradas.map((p) => {
                  const clave = `plantilla:${p.id}`;
                  const esSeleccionado = valorSeleccionado === clave;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                        esSeleccionado
                          ? 'bg-slate-800 text-slate-100 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                      }`}
                      onClick={() => {
                        onSeleccionar(clave);
                        setAbierto(false);
                      }}
                    >
                      <div className="truncate">
                        <div className="truncate">{p.titulo}</div>
                        <div className="text-[10px] text-slate-500 truncate">{p.descripcion}</div>
                      </div>
                      {esSeleccionado && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

