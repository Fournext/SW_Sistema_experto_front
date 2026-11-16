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
  const elementosHN = (pilaHN as any)?.elementos || [];
  const elementosQ = (colaQ as any)?.elementos || [];
  const elementosMetas = (listaMetas as any)?.elementos || [];
  const hechosEnBH = new Set(
    baseHechos?.hechos ? Object.keys(baseHechos.hechos).map((k) => k.toLowerCase()) : []
  );

  const obtenerTextoElemento = (elem: unknown): string => {
    if (elem === null || elem === undefined) return 'null';
    if (typeof elem === 'string' || typeof elem === 'number' || typeof elem === 'boolean') {
      return String(elem);
    }
    const obj = elem as Record<string, unknown>;
    if (obj.nombre) return String(obj.nombre);
    if (obj.variable_nombre && obj.valor !== undefined) return `${obj.variable_nombre}=${obj.valor}`;
    if (obj.variable && obj.valor !== undefined) return `${obj.variable}=${obj.valor}`;
    return String(obj.id || 'item');
  };

  const nombrePila = (pilaHN as any)?.nombreVariable ? String((pilaHN as any).nombreVariable) : 'Pila';
  const nombreCola = (colaQ as any)?.nombreVariable ? String((colaQ as any).nombreVariable) : 'Cola';
  const nombreLista = (listaMetas as any)?.nombreVariable ? String((listaMetas as any).nombreVariable) : 'Lista de Metas';

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
        {/* Pila */}
        <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-purple-300 font-mono">
              Pila {nombrePila !== 'Pila' ? `(${nombrePila})` : ''}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{elementosHN.length} items</span>
          </div>

          {elementosHN.length === 0 ? (
            <div className="text-center py-2 text-slate-600 italic">Pila vacía</div>
          ) : (
            <div className="flex flex-col-reverse gap-1.5">
              {elementosHN.map((elem: unknown, idx: number) => {
                const esTope = idx === elementosHN.length - 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded px-2.5 py-1 font-mono transition-all ${esTope
                        ? 'border border-purple-500 bg-purple-950/60 text-purple-200 font-bold shadow'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                  >
                    <span>{obtenerTextoElemento(elem)}</span>
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

        {/* Cola */}
        <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-cyan-300 font-mono flex items-center gap-1.5">
              <ListOrdered className="h-3.5 w-3.5" />
              Cola {nombreCola !== 'Cola' ? `(${nombreCola})` : ''}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{elementosQ.length} elementos</span>
          </div>

          {elementosQ.length === 0 ? (
            <div className="text-center py-2 text-slate-600 italic">Cola vacía</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {elementosQ.map((r: unknown, idx: number) => {
                const esFrente = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1 rounded px-2 py-1 font-mono ${esFrente
                        ? 'border border-cyan-500 bg-cyan-950/60 text-cyan-200 font-bold'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                  >
                    {esFrente && <span className="text-[9px] text-cyan-400 font-sans">FRENTE:</span>}
                    <span>{obtenerTextoElemento(r)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metas / Lista si existen */}
        {elementosMetas.length > 0 && (
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
              <span className="font-semibold text-amber-300 font-mono flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {nombreLista}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{elementosMetas.length} items</span>
            </div>

            <div className="space-y-1.5">
              {elementosMetas.map((m: unknown, idx: number) => {
                const texto = obtenerTextoElemento(m);
                const resuelta = hechosEnBH.has(texto.toLowerCase());
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded px-2.5 py-1 font-mono ${resuelta
                        ? 'border border-emerald-800 bg-emerald-950/40 text-emerald-300'
                        : 'border border-slate-800 bg-slate-900/40 text-slate-400'
                      }`}
                  >
                    <span>{texto}</span>
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

