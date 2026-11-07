import React, { useState } from 'react';
import {
  ListOrdered,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Eye,
  Workflow,
} from 'lucide-react';
import type { Regla } from '@/features/base-conocimiento/types/types';

export interface PanelOrdenReglasProps {
  reglas: Regla[];
  onSeleccionarRegla?: (reglaId: string | number) => void;
  onActualizarPrioridad?: (reglaId: string | number, nuevaPrioridad: number) => void;
  onCambiarPrioridad?: (reglaId: string | number, nuevaPrioridad: number) => void;
  reglaSeleccionadaId?: string | number | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const PanelOrdenReglas: React.FC<PanelOrdenReglasProps> = ({
  reglas,
  onSeleccionarRegla,
  onActualizarPrioridad,
  onCambiarPrioridad,
  reglaSeleccionadaId,
  isOpen,
  onClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const abierto = isOpen !== undefined ? isOpen : internalOpen;
  const setAbierto = (val: boolean) => {
    if (!val && onClose) {
      onClose();
    }
    setInternalOpen(val);
  };
  const handleCambiarPrioridad = onActualizarPrioridad || onCambiarPrioridad;

  // Ordenar deterministamente según el algoritmo de Forward Chaining: Prioridad DESC, Nombre ASC
  const reglasOrdenadas = [...reglas].sort((a, b) => {
    const pA = a.prioridad ?? 0;
    const pB = b.prioridad ?? 0;
    if (pB !== pA) return pB - pA;
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  return (
    <div
      className={`fixed top-24 right-4 z-30 transition-all duration-300 ease-in-out ${
        abierto ? 'translate-x-0' : 'translate-x-[calc(100%-42px)]'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 flex overflow-hidden max-h-[80vh]">
        {/* Pestaña / Botón de Apertura */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-10 bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-between py-4 cursor-pointer transition-colors shrink-0 shadow-inner"
          title={abierto ? 'Ocultar orden de reglas' : 'Ver orden de evaluación de reglas'}
        >
          {abierto ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <div className="rotate-90 origin-center whitespace-nowrap text-[11px] font-black uppercase tracking-wider my-8 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5 rotate-[-90deg]" />
            Orden BC ({reglas.length})
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* Contenido del Panel */}
        {abierto && (
          <div className="w-80 p-4 flex flex-col max-h-[80vh] overflow-hidden">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-indigo-600" />
                  Secuencia de Reglas (BC)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Orden de evaluación en Forward Chaining
                </p>
              </div>
            </div>

            {/* Lista ordenada de reglas */}
            <div className="overflow-y-auto space-y-2 py-3 pr-1 flex-1">
              {reglasOrdenadas.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No hay reglas en esta Base de Conocimiento.
                </div>
              ) : (
                reglasOrdenadas.map((regla, index) => {
                  const esSeleccionada = String(regla.id) === String(reglaSeleccionadaId);
                  const condiciones = Array.isArray(regla.condiciones) ? regla.condiciones : [];
                  const conclusiones = Array.isArray(regla.conclusiones) ? regla.conclusiones : [];

                  const resumenIF = condiciones
                    .map((c) => `${c.variable_nombre || c.referencia || 'x'} ${c.operador || '='} ${c.valor_esperado}`)
                    .join(' ∧ ');

                  const resumenTHEN = conclusiones
                    .map((c) => `${c.variable_nombre || c.destino || 'y'} = ${c.valor_resultante}`)
                    .join(', ');

                  return (
                    <div
                      key={regla.id}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        esSeleccionada
                          ? 'bg-indigo-50/80 border-indigo-400 shadow-xs ring-1 ring-indigo-300'
                          : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-black text-slate-900 truncate">
                            {regla.nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                            title="Prioridad para resolución de conflictos"
                          >
                            P:{regla.prioridad ?? 10}
                          </span>
                          {handleCambiarPrioridad && (
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCambiarPrioridad(regla.id, (regla.prioridad ?? 10) + 1)
                                }
                                className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Aumentar prioridad"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCambiarPrioridad(
                                    regla.id,
                                    Math.max(0, (regla.prioridad ?? 10) - 1)
                                  )
                                }
                                className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Disminuir prioridad"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resumen Lógico IF-THEN */}
                      <div className="text-[11px] font-mono space-y-0.5 text-slate-700 bg-white/70 p-1.5 rounded-lg border border-slate-200/60">
                        <div className="truncate text-emerald-800">
                          <span className="font-bold text-emerald-600">IF </span>
                          {resumenIF || 'sin premisas'}
                        </div>
                        <div className="truncate text-purple-800">
                          <span className="font-bold text-purple-600">THEN </span>
                          {resumenTHEN || 'sin deducción'}
                        </div>
                      </div>

                      {onSeleccionarRegla && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onSeleccionarRegla(regla.id)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Ver en Lienzo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              Evaluación: Mayor Prioridad → Mayor Especificidad
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelOrdenReglas;
