import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import type { FlowNode } from '../types/types';

export const HechoNode: React.FC<NodeProps<FlowNode>> = memo(({ data, selected }) => {
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
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-emerald-600" />
          Hecho
        </span>
        {data.es_inicial && (
          <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded">
            Inicial
          </span>
        )}
      </div>

      <div className="p-2.5">
        <h4 className="text-xs font-mono font-bold text-slate-900 truncate">
          {data.nombre || 'Hecho'}
        </h4>
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium font-sans">Valor:</span>
          <code className="bg-slate-50 text-slate-900 font-mono px-1.5 py-0.5 rounded text-[11px] font-bold truncate max-w-[100px] border border-slate-200">
            {String(data.valor ?? 'N/A')}
          </code>
        </div>
        {data.tipo_dato && (
          <div className="mt-1 text-[9px] font-mono text-slate-400 text-right">
            Tipo: <span className="font-semibold text-slate-600">{data.tipo_dato}</span>
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

HechoNode.displayName = 'HechoNode';
export default HechoNode;
