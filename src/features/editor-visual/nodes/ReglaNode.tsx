import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Workflow, ArrowRight, CheckCircle2, Zap, XCircle } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const ReglaNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  const prioridad = data.prioridad ?? 10;
  const orden = data.ordenNumero;
  const activa = data.activa !== false;
  const estadoInferencia = data.estadoInferencia; // 'ACTIVADA' | 'EJECUTADA' | 'RECHAZADA' | null

  const condiciones = (data.condicionesLista || []) as Array<{ sujeto: string; operador: string; valor: string }>;
  const conclusiones = (data.conclusionesLista || []) as Array<{ destino: string; valor: string }>;

  // Estilos visuales calibrados (Anti-Slop UI: base neutra mate + acentos de estado de precisión)
  let containerStyle = 'border-slate-300 hover:border-slate-400 bg-white shadow-2xs';
  let headerStyle = 'bg-slate-50/90 text-slate-800 border-slate-200/80';
  let badgeStyle = 'bg-slate-200/80 text-slate-700 border-slate-300';
  let accentBar = 'bg-transparent';

  if (estadoInferencia === 'ANALIZANDO') {
    containerStyle = 'border-sky-500 ring-2 ring-sky-200 bg-sky-50/30 shadow-xs';
    headerStyle = 'bg-sky-50 text-sky-950 border-sky-200';
    badgeStyle = 'bg-sky-200 text-sky-800 border-sky-300';
    accentBar = 'bg-sky-500';
  } else if (estadoInferencia === 'EJECUTADA') {
    containerStyle = 'border-emerald-500 ring-2 ring-emerald-200/80 bg-emerald-50/20 shadow-xs';
    headerStyle = 'bg-emerald-50 text-emerald-950 border-emerald-200';
    badgeStyle = 'bg-emerald-200 text-emerald-800 border-emerald-300';
    accentBar = 'bg-emerald-500';
  } else if (estadoInferencia === 'ACTIVADA') {
    containerStyle = 'border-amber-500 ring-2 ring-amber-200/80 bg-amber-50/25 shadow-xs';
    headerStyle = 'bg-amber-50 text-amber-950 border-amber-200';
    badgeStyle = 'bg-amber-200 text-amber-800 border-amber-300';
    accentBar = 'bg-amber-500 animate-pulse';
  } else if (estadoInferencia === 'RECHAZADA') {
    containerStyle = 'border-slate-200 bg-slate-50/60 opacity-60';
    headerStyle = 'bg-slate-100 text-slate-500 border-slate-200';
    badgeStyle = 'bg-slate-200 text-slate-500 border-slate-300';
    accentBar = 'bg-slate-300';
  } else if (selected) {
    containerStyle = 'border-slate-900 ring-2 ring-slate-200 shadow-xs bg-white';
    headerStyle = 'bg-slate-100/90 text-slate-900 border-slate-300';
  }

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-lg border transition-all text-left overflow-hidden select-none relative ${containerStyle}`}
    >
      {/* Barra de acento lateral para estado de inferencia FWC */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${accentBar} transition-colors`} />

      {/* Handles de Entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-2.5 h-2.5 rounded-sm bg-slate-400 border border-white hover:bg-slate-700 hover:scale-125 transition-all"
        title="Entrada superior"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        style={{ top: '40%' }}
        className="w-2.5 h-2.5 rounded-sm bg-slate-400 border border-white hover:bg-slate-700 hover:scale-125 transition-all"
        title="Entrada lateral izquierda"
      />

      {/* Encabezado: Orden [#1], Nombre de la Regla (R1) y Prioridad */}
      <div className={`pl-3.5 pr-2.5 py-1.5 border-b flex items-center justify-between gap-2 ${headerStyle}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {orden !== undefined && (
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${badgeStyle}`}
              title={`Posición de evaluación en la Base de Conocimiento: #${orden}`}
            >
              #{orden}
            </span>
          )}
          <Workflow className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <h4 className="text-xs font-mono font-bold tracking-tight text-slate-900 truncate" title={data.nombre || 'Regla'}>
            {data.nombre || 'Regla'}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs"
            title="Prioridad para resolución de conflictos"
          >
            P:{prioridad}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${activa ? 'bg-emerald-500' : 'bg-slate-300'}`}
            title={activa ? 'Regla activa' : 'Regla inactiva'}
          />
        </div>
      </div>

      {/* Cuerpo Todo-en-Uno: Premisas IF y Consecuentes THEN */}
      <div className="p-2.5 space-y-2 text-xs bg-white">
        {/* Sección SI (IF / Condiciones) */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SI (IF)
          </div>
          {condiciones.length > 0 ? (
            <div className="space-y-1">
              {condiciones.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div className="flex items-center justify-center my-0.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded border border-slate-300/70">
                        AND
                      </span>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-1.5 font-mono text-xs text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs"
                  >
                    <span className="font-semibold text-slate-900">{c.sujeto}</span>
                    <span className="font-bold text-emerald-700">{c.operador}</span>
                    <span className="text-slate-700 font-medium">{c.valor}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Sin condiciones asignadas</p>
          )}
        </div>

        {/* Sección ENTONCES (THEN / Conclusiones) */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-md p-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5 mb-1.5">
            <ArrowRight className="w-3 h-3 text-indigo-600" />
            ENTONCES (THEN)
          </div>
          {conclusiones.length > 0 ? (
            <div className="space-y-1">
              {conclusiones.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 font-mono text-xs text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs"
                >
                  <span className="font-semibold text-slate-900">{c.destino}</span>
                  <span className="font-bold text-indigo-600">=</span>
                  <span className="text-slate-900 font-bold">{c.valor}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Sin conclusiones asignadas</p>
          )}
        </div>

        {/* Estado en Simulación Forward Chaining si está activo */}
        {estadoInferencia && (
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-slate-500 font-sans">Estado FWC:</span>
            {estadoInferencia === 'ANALIZANDO' && (
              <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" /> Evaluando...
              </span>
            )}
            {estadoInferencia === 'EJECUTADA' && (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disparada
              </span>
            )}
            {estadoInferencia === 'ACTIVADA' && (
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" /> En Conflicto
              </span>
            )}
            {estadoInferencia === 'RECHAZADA' && (
              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-slate-400" /> Descartada
              </span>
            )}
          </div>
        )}
      </div>

      {/* Handles de Salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2.5 h-2.5 rounded-sm bg-slate-500 border border-white hover:bg-slate-800 hover:scale-125 transition-all"
        title="Salida inferior"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '60%' }}
        className="w-2.5 h-2.5 rounded-sm bg-slate-500 border border-white hover:bg-slate-800 hover:scale-125 transition-all"
        title="Salida lateral derecha"
      />
    </div>
  );
});

ReglaNode.displayName = 'ReglaNode';
export default ReglaNode;
