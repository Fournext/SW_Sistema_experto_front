import React from 'react';
import { Workflow, Check, X } from 'lucide-react';
import ReglaEstadoBadge from './ReglaEstadoBadge';
import type { DetalleInferencia } from '../types/types';

export interface ReglasEvaluadasPanelProps {
  detalles: DetalleInferencia[];
}

export const ReglasEvaluadasPanel: React.FC<ReglasEvaluadasPanelProps> = ({ detalles }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
        <Workflow className="w-4 h-4 text-indigo-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          2. Reglas Evaluadas por el Motor
        </h4>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold ml-auto">
          {detalles.length} evaluadas
        </span>
      </div>

      {detalles.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          Aún no se ha evaluado ninguna regla. Haz clic en "Ejecutar Inferencia".
        </p>
      ) : (
        <div className="space-y-2.5">
          {detalles.map((detalle, index) => {
            const nombre =
              (typeof detalle.regla === 'string' ? detalle.regla : detalle.regla?.nombre) ||
              detalle.nombre_regla ||
              detalle.regla_nombre ||
              (detalle.regla_id ? `Regla_${String(detalle.regla_id).slice(0, 6)}` : `Regla_${index + 1}`);
            const cumplidas = detalle.condiciones_cumplidas || [];
            const esExitosa = detalle.estado === 'ACTIVADA' || detalle.estado === 'EJECUTADA';

            return (
              <div
                key={detalle.id || index}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  esExitosa
                    ? 'bg-indigo-50/40 border-indigo-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {detalle.orden_evaluacion || index + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{nombre}</span>
                    <ReglaEstadoBadge estado={detalle.estado} />
                  </div>

                  {detalle.prioridad !== undefined && (
                    <span className="text-[11px] text-slate-500">
                      Prioridad: <strong className="text-slate-700">{detalle.prioridad}</strong>
                    </span>
                  )}
                </div>

                {/* Explicación o detalle de condiciones */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-3">
                  {cumplidas.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Condiciones:</span>
                      <div className="flex items-center gap-1">
                        {cumplidas.map((cumplio, cIdx) => (
                          <span
                            key={cIdx}
                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                              cumplio
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                            title={cumplio ? `Condición #${cIdx + 1} CUMPLIDA` : `Condición #${cIdx + 1} NO cumplida`}
                          >
                            {cumplio ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {detalle.resultado_generado && (
                    <div className="text-[11px] text-slate-700">
                      Genera:{' '}
                      <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-semibold text-indigo-700">
                        {detalle.resultado_generado}
                      </code>
                    </div>
                  )}

                  {detalle.explicacion && (
                    <p className="w-full text-[11px] text-slate-500 mt-1 italic">
                      {detalle.explicacion}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReglasEvaluadasPanel;
