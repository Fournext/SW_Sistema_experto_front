import React, { useState } from 'react';
import { Database, Check, Info, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { HechoDeducido } from '../types/types';

interface HechosGeneradosPanelProps {
  hechos: HechoDeducido[];
  pasoActual?: number;
}

export const HechosGeneradosPanel: React.FC<HechosGeneradosPanelProps> = ({
  hechos,
  pasoActual,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'INICIAL' | 'INFERIDO'>('TODOS');

  const hechosFiltrados = hechos.filter((h) => {
    if (filtroTipo === 'TODOS') return true;
    return (h.procedencia || 'INFERIDO') === filtroTipo;
  });

  const hechosInicialesCount = hechos.filter((h) => h.procedencia === 'INICIAL').length;
  const hechosInferidosCount = hechos.filter((h) => h.procedencia !== 'INICIAL').length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Encabezado */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Memoria de Trabajo y Hechos</h3>
            <p className="text-[11px] text-stone-500">
              {hechos.length} hecho(s) registrado(s) en memoria
            </p>
          </div>
        </div>

        {/* Filtros de Procedencia */}
        <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg text-xs font-medium text-stone-600">
          <button
            type="button"
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-2 py-1 rounded-md transition-all ${
              filtroTipo === 'TODOS' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            Todos ({hechos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('INICIAL')}
            className={`px-2 py-1 rounded-md transition-all ${
              filtroTipo === 'INICIAL' ? 'bg-white text-teal-800 shadow-2xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            Iniciales ({hechosInicialesCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('INFERIDO')}
            className={`px-2 py-1 rounded-md transition-all ${
              filtroTipo === 'INFERIDO' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            Inferidos ({hechosInferidosCount})
          </button>
        </div>
      </div>

      {/* Lista de Hechos */}
      <div className="overflow-y-auto p-4 space-y-2.5 max-h-[360px]">
        {hechosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50 text-stone-300" />
            <p className="text-xs font-medium">No hay hechos registrados con este filtro.</p>
          </div>
        ) : (
          hechosFiltrados.map((h, idx) => {
            const esInferido = h.procedencia !== 'INICIAL';
            const esReciente = pasoActual && h.paso_numero === pasoActual;

            return (
              <div
                key={h.id || `${h.nombre}-${idx}`}
                className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                  esReciente
                    ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300'
                    : esInferido
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : 'border-stone-200/80 bg-stone-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                  <div className="flex items-baseline gap-2 font-mono flex-wrap flex-1 min-w-0">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm break-words">{h.nombre}</span>
                    <span className="text-stone-400 font-semibold">=</span>
                    <span className="text-teal-900 font-semibold bg-teal-100/80 px-2 py-0.5 rounded text-xs break-all leading-relaxed">
                      {String(h.valor)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                    {esInferido ? (
                      <Badge variant="success" className="text-[10px] flex items-center gap-1 whitespace-nowrap">
                        <Check className="w-3 h-3" /> Inferido (Paso {h.paso_numero || 1})
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px] whitespace-nowrap">Inicial</Badge>
                    )}
                    {h.factor_certeza !== undefined && (
                      <span className="text-[10px] font-mono font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                        FC: {Number(h.factor_certeza).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Origen de la regla que lo generó */}
                {esInferido && (
                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-1 border-t border-emerald-100/80 flex-wrap">
                    <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>
                      Derivado por regla:{' '}
                      <strong className="text-stone-800 font-medium break-all">
                        {h.regla_origen_nombre || h.regla_origen_id || 'Regla del sistema'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HechosGeneradosPanel;
