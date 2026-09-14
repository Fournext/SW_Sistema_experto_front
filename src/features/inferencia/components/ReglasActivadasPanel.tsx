import React from 'react';
import { Zap, ArrowRight, Award } from 'lucide-react';
import type { DetalleInferencia } from '../types/types';

export interface ReglasActivadasPanelProps {
  reglasActivadas: DetalleInferencia[];
}

export const ReglasActivadasPanel: React.FC<ReglasActivadasPanelProps> = ({
  reglasActivadas,
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-200 p-4 shadow-2xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-indigo-100">
        <Zap className="w-4 h-4 text-indigo-600 fill-indigo-500" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
          3. Reglas Activadas (Conjunto Conflicto)
        </h4>
        <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold ml-auto">
          {reglasActivadas.length} activadas
        </span>
      </div>

      {reglasActivadas.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          Ninguna regla satisfizo todas sus premisas con los hechos conocidos.
        </p>
      ) : (
        <div className="space-y-2.5">
          {reglasActivadas.map((r, index) => {
            const nombre = r.nombre_regla || r.regla_nombre || r.regla?.nombre || `Regla_${index + 1}`;

            return (
              <div
                key={r.id || index}
                className="p-3 bg-white rounded-xl border-2 border-indigo-400/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Award className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{nombre}</h5>
                    <span className="text-[11px] text-slate-500">
                      Prioridad: <strong>{r.prioridad ?? 10}</strong>
                    </span>
                  </div>
                </div>

                {r.resultado_generado && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] text-emerald-900 font-medium">Deducción:</span>
                    <strong className="text-emerald-950 font-mono">
                      {r.resultado_generado}
                    </strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReglasActivadasPanel;
