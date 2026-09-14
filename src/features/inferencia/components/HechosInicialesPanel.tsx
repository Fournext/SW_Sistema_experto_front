import React from 'react';
import { FileText } from 'lucide-react';
import type { Hecho } from '@/features/base-conocimiento/types/types';

export interface HechosInicialesPanelProps {
  hechos: Hecho[];
}

export const HechosInicialesPanel: React.FC<HechosInicialesPanelProps> = ({ hechos }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
        <FileText className="w-4 h-4 text-emerald-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Hechos Iniciales en Memoria de Trabajo
        </h4>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold ml-auto">
          {hechos.length}
        </span>
      </div>

      {hechos.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No hay hechos iniciales cargados en este momento.
        </p>
      ) : (
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
      )}
    </div>
  );
};

export default HechosInicialesPanel;
