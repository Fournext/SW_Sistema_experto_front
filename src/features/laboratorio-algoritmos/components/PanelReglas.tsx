import React from 'react';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import type { SnapshotBC } from '../types/contracts';

interface PanelReglasProps {
  snapshot?: SnapshotBC | null;
  marcasReglas?: string[];
  reglaActualId?: string | null;
}

export const PanelReglas: React.FC<PanelReglasProps> = ({
  snapshot,
  marcasReglas = [],
  reglaActualId,
}) => {
  const reglas = snapshot?.reglas || [];
  const marcasSet = new Set(marcasReglas);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Reglas de Inferencia (R)
          </h3>
        </div>
        <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-800">
          {reglas.length} reglas
        </span>
      </div>

      {/* Lista de reglas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {reglas.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-slate-500">
            No hay reglas cargadas en la Base de Conocimiento.
          </div>
        ) : (
          reglas.map((r, idx) => {
            const estaMarcada = marcasSet.has(r.id);
            const esActiva = reglaActualId === r.id;

            return (
              <div
                key={r.id || idx}
                className={`rounded-md border p-2.5 text-xs transition-all ${
                  esActiva
                    ? 'border-amber-500 bg-amber-950/20 shadow-md ring-1 ring-amber-500'
                    : estaMarcada
                    ? 'border-emerald-900/60 bg-emerald-950/15 text-slate-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                {/* Cabecera de la regla */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">[{idx}]</span>
                    <span
                      className={`font-mono font-bold ${
                        estaMarcada ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {r.nombre}
                    </span>
                  </div>

                  {estaMarcada ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Marcada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                      <Circle className="h-2.5 w-2.5" />
                      Libre
                    </span>
                  )}
                </div>

                {/* Resumen de premisas y conclusiones */}
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold">SI:</span>{' '}
                    {r.premisas && r.premisas.length > 0
                      ? r.premisas
                          .map((p) => `${p.variable} ${p.operador} ${String(p.valor)}`)
                          .join(' Y ')
                      : 'Verdad'}
                  </div>
                  <div className="truncate text-blue-300 font-semibold">
                    <span className="text-slate-500">ENTONCES:</span>{' '}
                    {r.conclusiones && r.conclusiones.length > 0
                      ? r.conclusiones
                          .map((c) => `${c.variable} = ${String(c.valor)}`)
                          .join(', ')
                      : 'N/A'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
