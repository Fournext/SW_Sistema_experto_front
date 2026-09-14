import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const HechoNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
  return (
    <div
      className={`min-w-[170px] max-w-[220px] bg-white rounded-xl shadow-md border-2 transition-all text-left overflow-hidden ${
        selected ? 'border-emerald-600 ring-2 ring-emerald-200 shadow-lg' : 'border-emerald-400 hover:border-emerald-500'
      }`}
    >
      {/* Handles de Entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-emerald-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada superior"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral izquierda"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        style={{ top: '35%' }}
        className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white hover:scale-125 transition-transform"
        title="Entrada lateral derecha"
      />

      <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-100 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
          <FileText className="w-3 h-3 text-emerald-600" />
          Hecho
        </span>
        {data.es_inicial && (
          <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
            Inicial
          </span>
        )}
      </div>

      <div className="p-3">
        <h4 className="text-xs font-bold text-slate-900 truncate">
          {data.nombre || 'Hecho sin nombre'}
        </h4>
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Valor:</span>
          <code className="bg-slate-100 text-slate-800 font-mono px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[100px]">
            {String(data.valor ?? 'N/A')}
          </code>
        </div>
        {data.tipo_dato && (
          <div className="mt-1 text-[10px] text-slate-400 text-right">
            Tipo: <span className="font-semibold text-slate-600">{data.tipo_dato}</span>
          </div>
        )}
      </div>

      {/* Handles de Salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-emerald-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida inferior"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-emerald-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral izquierda"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        style={{ top: '65%' }}
        className="w-2.5 h-2.5 bg-emerald-600 border-2 border-white hover:scale-125 transition-transform"
        title="Salida lateral derecha"
      />
    </div>
  );
});

HechoNode.displayName = 'HechoNode';
export default HechoNode;
