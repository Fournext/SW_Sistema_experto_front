import React, { useState } from 'react';
import { Shuffle, X, Award } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { ConflictoInferencia } from '../types/types';

interface ConflictosPanelProps {
  conflictos: ConflictoInferencia[];
  pasoActual?: number;
}

export const ConflictosPanel: React.FC<ConflictosPanelProps> = ({
  conflictos,
  pasoActual,
}) => {
  const [pasoSeleccionado, setPasoSeleccionado] = useState<number | null>(null);

  if (!conflictos || conflictos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm text-center text-stone-400">
        <Shuffle className="w-7 h-7 mx-auto mb-2 opacity-40 text-stone-300" />
        <h4 className="text-xs font-bold text-stone-700">Conjunto de Conflicto</h4>
        <p className="text-[11px] text-stone-500 mt-1">
          No se presentaron conflictos de múltiples reglas activables simultáneas en este paso.
        </p>
      </div>
    );
  }

  // Si no hay paso seleccionado, mostrar el más reciente
  const pasoActivo = pasoSeleccionado !== null
    ? pasoSeleccionado
    : (pasoActual || conflictos[conflictos.length - 1]?.paso_numero || 1);

  const conflictoActual = conflictos.find((c) => c.paso_numero === pasoActivo) || conflictos[conflictos.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 bg-amber-50/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
            <Shuffle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Resolución de Conflictos</h3>
            <p className="text-[11px] text-stone-600">
              Criterio determinista: <strong className="font-mono text-amber-900">{conflictoActual.criterio_aplicado}</strong>
            </p>
          </div>
        </div>

        {/* Selector de Pasos con Conflicto */}
        {conflictos.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-stone-500 font-medium">Paso:</span>
            <select
              value={pasoActivo}
              onChange={(e) => setPasoSeleccionado(Number(e.target.value))}
              aria-label="Seleccionar paso de conflicto"
              className="text-xs font-medium bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {conflictos.map((c) => (
                <option key={c.id || c.paso_numero} value={c.paso_numero}>
                  Paso #{c.paso_numero} ({c.reglas_candidatas?.length || 0} candidatas)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Detalle del Conflicto */}
      <div className="p-4 space-y-3">
        <div className="text-xs text-stone-600 flex items-center justify-between">
          <span>Reglas candidatas evaluadas como activables simultáneamente:</span>
          <Badge variant="neutral" className="font-mono text-[10px]">
            {conflictoActual.reglas_candidatas?.length || 0} candidatas
          </Badge>
        </div>

        <div className="space-y-2">
          {conflictoActual.reglas_candidatas?.map((rc, idx) => {
            const esGanadora = rc.seleccionada;

            return (
              <div
                key={rc.id || `${rc.regla_id}-${idx}`}
                className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                  esGanadora
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-200'
                    : 'border-stone-200/80 bg-stone-50/50 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {esGanadora ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Award className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center shrink-0">
                        <X className="w-3 h-3" />
                      </span>
                    )}
                    <span className="font-semibold text-stone-900 text-sm">
                      {rc.nombre_regla}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded">
                      Prioridad: <strong>{rc.prioridad}</strong>
                    </span>
                    <span className="text-[11px] font-mono text-stone-500 bg-white border border-stone-200 px-1.5 py-0.5 rounded">
                      {rc.numero_condiciones} cond.
                    </span>
                    {esGanadora ? (
                      <Badge variant="success" className="text-[10px]">Seleccionada</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px]">Descartada</Badge>
                    )}
                  </div>
                </div>

                {/* Motivo de descarte o confirmación */}
                <div className="text-[11px] pl-7">
                  {esGanadora ? (
                    <span className="text-emerald-800 font-medium">
                      Ganó por mayor prioridad o criterio de especificidad/orden determinista.
                    </span>
                  ) : (
                    <span className="text-stone-500">
                      {rc.motivo_descarte || 'Superada por otra regla con mayor prioridad o especificidad.'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConflictosPanel;
