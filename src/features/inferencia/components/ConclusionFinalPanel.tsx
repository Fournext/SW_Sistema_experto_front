import React from 'react';
import { Target, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ConclusionFinalPanelProps {
  conclusion?: string;
  factorCerteza?: number;
  estado?: string;
}

export const ConclusionFinalPanel: React.FC<ConclusionFinalPanelProps> = ({
  conclusion,
  factorCerteza,
  estado,
}) => {
  const tieneConclusion = Boolean(conclusion && conclusion.trim() !== '');

  return (
    <div
      className={`rounded-2xl p-6 border-2 shadow-sm text-left transition-all ${
        tieneConclusion
          ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 border-emerald-400'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            tieneConclusion
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900">4. Conclusión Final del Sistema</h4>
          <p className="text-xs text-slate-500">
            Deducción global generada mediante encadenamiento hacia adelante.
          </p>
        </div>
      </div>

      {tieneConclusion ? (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Resultado Deducido
              </span>
              <p className="mt-1 text-lg font-extrabold text-slate-900 font-mono">
                {conclusion}
              </p>
            </div>
          </div>

          {factorCerteza !== undefined && (
            <div className="flex items-center justify-between text-xs bg-emerald-100/50 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-900 font-medium">
              <span>Factor de Certeza Acumulado (CF):</span>
              <span className="font-mono font-bold text-sm text-emerald-950">
                {(factorCerteza * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {estado === 'EN_PROGRESO'
              ? 'Procesando reglas de inferencia...'
              : 'No se ha derivado una conclusión final aún. Pulsa en "Ejecutar Inferencia" para iniciar el motor.'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ConclusionFinalPanel;
