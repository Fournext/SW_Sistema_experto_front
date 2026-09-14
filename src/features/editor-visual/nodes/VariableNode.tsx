import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Variable as VariableIcon } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const VariableNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  return (
    <div
      className={`min-w-[170px] max-w-[220px] bg-white rounded-xl shadow-md border-2 transition-all text-left overflow-hidden ${
        selected ? 'border-sky-600 ring-2 ring-sky-200 shadow-lg' : 'border-sky-400 hover:border-sky-500'
      }`}
    >
      {/* Handles de Entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-sky-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada superior"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-sky-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral izquierda"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-sky-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral derecha"
      />

      <div className="bg-sky-50 px-3 py-1.5 border-b border-sky-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
          <VariableIcon className="w-3 h-3 text-sky-600" />
          Variable
        </span>
        {data.tipo && (
          <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full border border-sky-200">
            {data.tipo}
          </span>
        )}
      </div>

      <div className="p-3">
        <h4 className="text-xs font-bold text-slate-900 truncate">
          {data.nombre || 'Variable'}
        </h4>
        {data.valor_por_defecto && (
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Default:</span>
            <code className="bg-slate-100 text-slate-700 font-mono px-1 py-0.5 rounded text-[10px] truncate max-w-[90px]">
              {String(data.valor_por_defecto)}
            </code>
          </div>
        )}
        {data.descripcion && (
          <p className="mt-1 text-[10px] text-slate-500 line-clamp-1 italic">
            {data.descripcion}
          </p>
        )}
      </div>

      {/* Handles de Salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-sky-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida inferior"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-sky-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral izquierda"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-sky-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral derecha"
      />
    </div>
  );
});

VariableNode.displayName = 'VariableNode';
export default VariableNode;
