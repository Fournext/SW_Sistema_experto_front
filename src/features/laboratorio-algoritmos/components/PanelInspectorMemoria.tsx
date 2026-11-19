import React, { useState } from 'react';
import { Database, GitCommit, Layers } from 'lucide-react';
import { PanelVariables } from './PanelVariables';
import { PanelBaseHechos } from './PanelBaseHechos';
import { PanelReglas } from './PanelReglas';
import { PanelEstructuras } from './PanelEstructuras';
import type {
  BaseHechosRuntime,
  ColeccionRuntime,
  StackFrameRuntime,
} from '../types/contracts';

interface PanelInspectorMemoriaProps {
  frame: StackFrameRuntime | null;
  baseHechos: BaseHechosRuntime | null;
  snapshotReglas: any;
  marcasReglas: string[];
  pilaHN: ColeccionRuntime<{ nombre: string }> | null;
  colaQ: ColeccionRuntime<{ nombre: string }> | null;
  listaMetas: ColeccionRuntime<{ nombre: string }> | null;
}

export const PanelInspectorMemoria: React.FC<PanelInspectorMemoriaProps> = ({
  frame,
  baseHechos,
  snapshotReglas,
  marcasReglas,
  pilaHN,
  colaQ,
  listaMetas,
}) => {
  const [pestañaActiva, setPestañaActiva] = useState<'memoria' | 'reglas' | 'estructuras'>('memoria');

  const totalHechos = baseHechos ? Object.keys(baseHechos.hechos).length : 0;
  const totalReglas = snapshotReglas?.reglas?.length || 0;
  const totalHN = pilaHN?.elementos?.length || 0;
  const totalQ = colaQ?.elementos?.length || 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
      {/* Cabecera de Pestañas */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setPestañaActiva('memoria')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              pestañaActiva === 'memoria'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800/80 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>Memoria & BH</span>
            {totalHechos > 0 && (
              <span className="rounded-full bg-indigo-900/80 px-1.5 py-0.2 text-[10px] text-indigo-200 font-mono">
                {totalHechos}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestañaActiva('reglas')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              pestañaActiva === 'reglas'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800/80 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitCommit className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span>Reglas R</span>
            {totalReglas > 0 && (
              <span className="rounded-full bg-purple-900/80 px-1.5 py-0.2 text-[10px] text-purple-200 font-mono">
                {totalReglas}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestañaActiva('estructuras')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              pestañaActiva === 'estructuras'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800/80 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Pilas & Colas</span>
            {(totalHN > 0 || totalQ > 0) && (
              <span className="rounded-full bg-cyan-900/80 px-1.5 py-0.2 text-[10px] text-cyan-200 font-mono">
                {totalHN + totalQ}
              </span>
            )}
          </button>
        </div>

        <span className="hidden xl:inline text-[10px] uppercase tracking-wider font-mono text-slate-500 shrink-0">
          Inspector
        </span>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="flex-1 overflow-hidden p-2.5">
        {pestañaActiva === 'memoria' && (
          <div className="flex h-full flex-col gap-2.5 overflow-hidden">
            <div className="h-1/2 overflow-hidden">
              <PanelVariables frame={frame} />
            </div>
            <div className="h-1/2 overflow-hidden">
              <PanelBaseHechos baseHechos={baseHechos} />
            </div>
          </div>
        )}

        {pestañaActiva === 'reglas' && (
          <div className="h-full overflow-hidden">
            <PanelReglas snapshot={snapshotReglas} marcasReglas={marcasReglas} />
          </div>
        )}

        {pestañaActiva === 'estructuras' && (
          <div className="h-full overflow-hidden">
            <PanelEstructuras
              pilaHN={pilaHN}
              colaQ={colaQ}
              listaMetas={listaMetas}
              baseHechos={baseHechos}
            />
          </div>
        )}
      </div>
    </div>
  );
};
