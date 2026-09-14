import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const CondicionNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  return (
    <div
      className={`min-w-[170px] max-w-[220px] bg-white rounded-xl shadow-md border-2 transition-all text-left overflow-hidden ${
        selected ? 'border-amber-600 ring-2 ring-amber-200 shadow-lg' : 'border-amber-400 hover:border-amber-500'
      }`}
    >
      {/* Handles de Entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-amber-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada superior"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-amber-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral izquierda"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-amber-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral derecha"
      />

      <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
          <GitBranch className="w-3 h-3 text-amber-600" />
          Condición (IF)
        </span>
        {data.orden !== undefined && (
          <span className="text-[9px] font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full">
            #{data.orden}
          </span>
        )}
      </div>

      <div className="p-3 font-mono">
        <div className="text-xs text-slate-800 font-semibold truncate">
          {data.referencia || 'referencia'}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <span className="font-bold text-amber-600">{data.operador || '=='}</span>
          <span className="bg-amber-50 text-amber-950 font-bold px-1.5 py-0.5 rounded border border-amber-200 text-[11px] truncate max-w-[110px]">
            {data.valor_esperado !== undefined ? `"${data.valor_esperado}"` : 'valor'}
          </span>
        </div>
      </div>

      {/* Handles de Salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-amber-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida inferior"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-amber-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral izquierda"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-amber-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral derecha"
      />
    </div>
  );
});

CondicionNode.displayName = 'CondicionNode';
export default CondicionNode;
