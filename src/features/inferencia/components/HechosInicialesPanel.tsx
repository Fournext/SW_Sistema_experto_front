import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import type { Hecho } from '@/features/base-conocimiento/types/types';
import type { HechoDeducido } from '../types/types';

export interface HechosInicialesPanelProps {
  hechos: Hecho[];
  hechosGenerados?: HechoDeducido[];
}

export const HechosInicialesPanel: React.FC<HechosInicialesPanelProps> = ({
  hechos,
  hechosGenerados = [],
}) => {
  const total = hechos.length + hechosGenerados.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <FileText className="w-4 h-4 text-emerald-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Hechos en Memoria de Trabajo
        </h4>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold ml-auto">
          {total} en memoria
        </span>
      </div>

      {hechos.length === 0 && hechosGenerados.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No hay hechos cargados en la memoria de trabajo.
        </p>
      ) : (
        <div className="space-y-3">
          {hechos.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 text-left">
                Hechos Iniciales:
              </span>
              <div className="flex flex-wrap gap-2">
                {hechos.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="inline-flex items-center gap-2 bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-950 font-medium"
                  >
                    <span className="font-bold text-emerald-900">{h.nombre}:</span>
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] border border-emerald-200 font-bold text-emerald-800">
                      {String(h.valor)}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hechosGenerados.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 text-left">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Nuevos Hechos Deducidos:
              </span>
              <div className="flex flex-wrap gap-2">
                {hechosGenerados.map((hg, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 bg-indigo-50/70 border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-indigo-950 font-medium"
                  >
                    <span className="font-bold text-indigo-900">{hg.nombre}:</span>
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] border border-indigo-200 font-bold text-indigo-800">
                      {String(hg.valor)}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HechosInicialesPanel;
