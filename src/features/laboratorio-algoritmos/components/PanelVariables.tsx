import React from 'react';
import { Variable, Braces } from 'lucide-react';
import type { StackFrameRuntime } from '../types/contracts';

interface PanelVariablesProps {
  frame?: StackFrameRuntime | null;
}

export const PanelVariables: React.FC<PanelVariablesProps> = ({ frame }) => {
  const variables = frame?.variables || {};
  const entradas = Object.entries(variables);

  const renderizarValor = (val: unknown): React.ReactNode => {
    if (val === null || val === undefined) {
      return <span className="italic text-slate-500">null</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
            val
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}
        >
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof val === 'number') {
      return <span className="font-mono text-cyan-400 font-semibold">{val}</span>;
    }
    if (typeof val === 'string') {
      return <span className="text-amber-300 font-mono">"{val}"</span>;
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      if (obj.tipo_objeto === 'Hecho') {
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-950/80 px-2 py-0.5 text-xs text-blue-300 border border-blue-800">
            <span className="font-semibold">{String(obj.variable_nombre)}:</span>
            <span>{String(obj.valor)}</span>
          </span>
        );
      }
      if (obj.tipo_objeto === 'Regla') {
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-950/80 px-2 py-0.5 text-xs text-indigo-300 border border-indigo-800">
            <span className="font-semibold">{String(obj.nombre)}</span>
          </span>
        );
      }
      if (obj.tipo_objeto === 'Variable') {
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-950/80 px-2 py-0.5 text-xs text-purple-300 border border-purple-800">
            <span>{String(obj.nombre)}</span>
          </span>
        );
      }
      if (obj.tipo_objeto === 'Lista' || obj.tipo_objeto === 'Pila' || obj.tipo_objeto === 'Cola') {
        const elementos = Array.isArray(obj.elementos) ? obj.elementos : [];
        return (
          <span className="text-xs text-slate-400 font-mono">
            {obj.tipo_objeto}&lt;len={elementos.length}&gt;
          </span>
        );
      }
      if (obj.tipo_objeto === 'BaseHechos') {
        const hechos = typeof obj.hechos === 'object' && obj.hechos ? Object.keys(obj.hechos).length : 0;
        return <span className="text-xs text-blue-400 font-mono">BH (Total: {hechos})</span>;
      }
    }
    return <span className="text-slate-300">{String(val)}</span>;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Variables Locales ({entradas.length})
          </h3>
        </div>
        {frame && (
          <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">
            <Braces className="h-3 w-3 text-slate-400" />
            {frame.nombre_funcion}()
          </span>
        )}
      </div>

      {/* Lista de variables */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {entradas.length === 0 ? (
          <div className="py-6 text-center text-xs italic text-slate-500">
            No hay variables locales en este ámbito.
          </div>
        ) : (
          entradas.map(([nombre, valor]) => (
            <div
              key={nombre}
              className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs"
            >
              <span className="font-mono font-semibold text-slate-300">{nombre}</span>
              <div>{renderizarValor(valor)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

