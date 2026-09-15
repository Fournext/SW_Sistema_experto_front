import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const ConclusionNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  return (
    <div
      className={`min-w-[170px] max-w-[220px] bg-white rounded-xl shadow-md border-2 transition-all text-left overflow-hidden ${
        selected ? 'border-purple-600 ring-2 ring-purple-200 shadow-lg' : 'border-purple-400 hover:border-purple-500'
      }`}
    >
      {/* Handles de Entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-purple-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada superior"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-purple-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral izquierda"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-purple-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral derecha"
      />

      <div className="bg-purple-50 px-3 py-1.5 border-b border-purple-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-purple-600" />
          Conclusión (THEN)
        </span>
        {data.isLocal && (
          <span className="text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full animate-pulse">
            Pendiente
          </span>
        )}
      </div>

      <div className="p-3 font-mono">
        <div className={`text-xs font-semibold truncate ${!data.destino ? 'text-purple-600 italic' : 'text-slate-800'}`}>
          {data.destino || '(Sin vincular)'}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className="text-slate-400">=</span>
          <span className="bg-purple-50 text-purple-950 font-bold px-1.5 py-0.5 rounded border border-purple-200 text-[11px] truncate max-w-[120px]">
            {data.valor_resultante !== undefined && data.valor_resultante !== '' ? `"${data.valor_resultante}"` : 'valor'}
          </span>
        </div>
      </div>

      {/* Handles de Salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-purple-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida inferior"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-purple-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral izquierda"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-purple-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral derecha"
      />
    </div>
  );
});

ConclusionNode.displayName = 'ConclusionNode';
export default ConclusionNode;
