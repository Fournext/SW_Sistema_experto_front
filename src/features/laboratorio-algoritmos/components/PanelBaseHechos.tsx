import React from 'react';
import { Database, Sparkles, UserCheck } from 'lucide-react';
import type { BaseHechosRuntime, HechoRuntime } from '../types/contracts';

interface PanelBaseHechosProps {
  baseHechos?: BaseHechosRuntime | null;
  hechosInicialesNombres?: string[];
}

export const PanelBaseHechos: React.FC<PanelBaseHechosProps> = ({
  baseHechos,
  hechosInicialesNombres = [],
}) => {
  const hechosMap = baseHechos?.hechos || {};
  const listaHechos = Object.values(hechosMap) as HechoRuntime[];
  const consultadas = new Set(baseHechos?.consultadas || []);
  const inicialesSet = new Set(hechosInicialesNombres.map((n) => n.toLowerCase().trim()));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Base de Hechos (BH)
          </h3>
        </div>
        <span className="rounded-full bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-800">
          {listaHechos.length} hechos
        </span>
      </div>

      {/* Lista de hechos */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {listaHechos.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-slate-500">
            Base de Hechos vacía.
          </div>
        ) : (
          listaHechos.map((h) => {
            const esInicial = inicialesSet.has(h.variable_nombre.toLowerCase().trim());
            const fueConsultado = consultadas.has(h.variable_nombre.toLowerCase().trim());

            return (
              <div
                key={h.id || h.variable_nombre}
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-2.5 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  {esInicial ? (
                    <span className="flex h-2 w-2 rounded-full bg-slate-500" title="Hecho Inicial" />
                  ) : fueConsultado ? (
                    <span title="Hecho ingresado por el usuario">
                      <UserCheck className="h-4 w-4 text-amber-400" />
                    </span>
                  ) : (
                    <span title="Hecho derivado por regla">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                    </span>
                  )}

                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-200">
                      {h.variable_nombre}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {esInicial ? 'Inicial' : fueConsultado ? 'Consultado' : 'Inferido'}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold text-blue-300 bg-blue-950/60 px-2 py-1 rounded border border-blue-900/60">
                  {String(h.valor)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
