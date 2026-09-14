import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Workflow } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const ReglaNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  const factorCertezaFormateado =
    data.factor_certeza !== undefined
      ? Number(data.factor_certeza).toFixed(2)
      : '1.00';

  return (
    <div
      className={`min-w-[190px] max-w-[240px] bg-white rounded-xl shadow-md border-2 transition-all text-left overflow-hidden ${
        selected ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-lg' : 'border-indigo-400 hover:border-indigo-500'
      }`}
    >
      {/* Handles de Entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-indigo-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada superior"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-indigo-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral izquierda"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-indigo-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral derecha"
      />

      <div className="bg-indigo-50 px-3 py-1.5 border-b border-indigo-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
          <Workflow className="w-3 h-3 text-indigo-600" />
          Regla
        </span>
        <span
          className={`w-2 h-2 rounded-full ${
            data.activa !== false ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={data.activa !== false ? 'Activa' : 'Inactiva'}
        />
      </div>

      <div className="p-3">
        <h4 className="text-sm font-bold text-slate-900 truncate">
          {data.nombre || 'Regla sin nombre'}
        </h4>

        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Prioridad:</span>
            <span className="font-semibold text-slate-800">
              {data.prioridad ?? 10}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Factor certeza:</span>
            <span className="font-mono font-bold text-indigo-600">
              {factorCertezaFormateado}
            </span>
          </div>
        </div>
      </div>

      {/* Handles de Salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-indigo-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida inferior"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-indigo-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral izquierda"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-indigo-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral derecha"
      />
    </div>
  );
});

ReglaNode.displayName = 'ReglaNode';
export default ReglaNode;
