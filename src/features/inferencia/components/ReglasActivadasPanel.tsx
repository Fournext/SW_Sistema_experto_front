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
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
        <Zap className="w-4 h-4 text-amber-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          3. Reglas Activadas (Conjunto Conflicto)
        </h4>
        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold ml-auto">
          {reglasActivadas.length} activadas
        </span>
      </div>

      {reglasActivadas.length === 0 ? (
        <p className="text-xs text-stone-400 italic py-2">
          Ninguna regla satisfizo todas sus premisas con los hechos conocidos.
        </p>
      ) : (
        <div className="space-y-2.5">
          {reglasActivadas.map((r, index) => {
            const nombre =
              (typeof r.regla === 'string' ? r.regla : r.regla?.nombre) ||
              r.nombre_regla ||
              r.regla_nombre ||
              (r.regla_id ? `Regla_${String(r.regla_id).slice(0, 6)}` : `Regla_${index + 1}`);

            return (
              <div
                key={r.id || index}
                className="p-3 bg-white rounded-lg border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center font-bold">
                    <Award className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h5 className="font-bold text-stone-800 text-xs">{nombre}</h5>
                    <span className="text-[11px] text-stone-500">
                      Prioridad: <strong className="text-stone-700">{r.prioridad ?? 10}</strong>
                    </span>
                  </div>
                </div>

                {r.resultado_generado && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] text-emerald-900 font-medium">Deducción:</span>
                    <strong className="text-emerald-950 font-mono text-xs">
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
