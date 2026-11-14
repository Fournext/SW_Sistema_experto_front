import React from 'react';
import { Layers, ListOrdered, Target, CheckCircle } from 'lucide-react';
import type { ColeccionRuntime, BaseHechosRuntime } from '../types/contracts';

interface PanelEstructurasProps {
  pilaHN?: ColeccionRuntime<{ nombre: string }> | null;
  colaQ?: ColeccionRuntime<{ nombre: string }> | null;
  listaMetas?: ColeccionRuntime<{ nombre: string }> | null;
  baseHechos?: BaseHechosRuntime | null;
}

export const PanelEstructuras: React.FC<PanelEstructurasProps> = ({
  pilaHN,
  colaQ,
  listaMetas,
  baseHechos,
}) => {
  const elementosHN = pilaHN?.elementos || [];
  const elementosQ = colaQ?.elementos || [];
  const elementosMetas = listaMetas?.elementos || [];
  const hechosEnBH = new Set(
    baseHechos?.hechos ? Object.keys(baseHechos.hechos).map((k) => k.toLowerCase()) : []
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Estructuras de Datos
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* Pila HN */}
        <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-purple-300 font-mono">Pila HN (Hechos Nativos)</span>
            <span className="text-[11px] text-slate-500 font-mono">{elementosHN.length} items</span>
          </div>

          {elementosHN.length === 0 ? (
            <div className="text-center py-2 text-slate-600 italic">Pila HN vacía</div>
          ) : (
            <div className="flex flex-col-reverse gap-1.5">
              {elementosHN.map((elem, idx) => {
                const esTope = idx === elementosHN.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded px-2.5 py-1 font-mono transition-all ${
                      esTope
                        ? 'border border-purple-500 bg-purple-950/60 text-purple-200 font-bold shadow'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <span>{elem.nombre}</span>
                    {esTope && (
                      <span className="rounded bg-purple-800 px-1 text-[9px] uppercase tracking-wider text-purple-100">
                        TOPE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cola Q */}
        <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-cyan-300 font-mono flex items-center gap-1.5">
              <ListOrdered className="h-3.5 w-3.5" />
              Cola Q (FIFO de Reglas)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{elementosQ.length} reglas</span>
          </div>

          {elementosQ.length === 0 ? (
            <div className="text-center py-2 text-slate-600 italic">Cola Q vacía</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {elementosQ.map((r, idx) => {
                const esFrente = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1 rounded px-2 py-1 font-mono ${
                      esFrente
                        ? 'border border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    {esFrente && <span className="text-[9px] text-cyan-400 font-sans">FRENTE:</span>}
                    <span>{r.nombre}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metas si existen */}
        {elementosMetas.length > 0 && (
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
              <span className="font-semibold text-amber-300 font-mono flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Lista de Metas
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{elementosMetas.length} metas</span>
            </div>

            <div className="space-y-1.5">
              {elementosMetas.map((m, idx) => {
                const resuelta = hechosEnBH.has(m.nombre.toLowerCase());
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded px-2.5 py-1 font-mono ${
                      resuelta
                        ? 'border border-emerald-800 bg-emerald-950/40 text-emerald-300'
                        : 'border border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <span>{m.nombre}</span>
                    {resuelta ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                        <CheckCircle className="h-3 w-3" /> Resuelta
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-sans">Pendiente</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

