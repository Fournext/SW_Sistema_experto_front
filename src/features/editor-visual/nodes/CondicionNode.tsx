import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const CondicionNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  return (
    <div
      className={`min-w-[170px] max-w-[220px] bg-white rounded-lg shadow-2xs border transition-all text-left overflow-hidden ${
        selected ? 'border-slate-900 ring-2 ring-slate-200 shadow-xs' : 'border-slate-200/90 hover:border-slate-400'
      }`}
    >
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
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 rounded-sm bg-slate-400 border border-white hover:bg-slate-700 hover:scale-125 transition-all"
        title="Entrada lateral izquierda"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 rounded-sm bg-slate-400 border border-white hover:bg-slate-700 hover:scale-125 transition-all"
        title="Entrada lateral derecha"
      />

      <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200/80 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
          <GitBranch className="w-3 h-3 text-emerald-600" />
          Condición (IF)
        </span>
        {data.isLocal ? (
          <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
            Pendiente
          </span>
        ) : data.orden !== undefined ? (
          <span className="text-[9px] font-mono font-bold bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded">
            #{data.orden}
          </span>
        ) : null}
      </div>

      <div className="p-2.5 font-mono">
        <div className={`text-xs font-bold truncate ${!data.referencia ? 'text-amber-600 italic font-sans' : 'text-slate-900'}`}>
          {data.referencia || '(Sin vincular)'}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <span className="font-bold text-emerald-700">{data.operador || '='}</span>
          <span className="bg-slate-50 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[11px] truncate max-w-[110px]">
            {data.valor_esperado !== undefined && data.valor_esperado !== '' ? `"${data.valor_esperado}"` : 'valor'}
          </span>
        </div>
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
        position={Position.Left}
        id="left-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 rounded-sm bg-slate-500 border border-white hover:bg-slate-800 hover:scale-125 transition-all"
        title="Salida lateral izquierda"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 rounded-sm bg-slate-500 border border-white hover:bg-slate-800 hover:scale-125 transition-all"
        title="Salida lateral derecha"
      />
    </div>
  );
});

CondicionNode.displayName = 'CondicionNode';
export default CondicionNode;
