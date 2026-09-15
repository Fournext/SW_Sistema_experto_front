import React, { memo, useCallback, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react';
import { GripVertical, X } from 'lucide-react';

export interface DraggableEdgeData {
  controlPoint?: { x: number; y: number };
  [key: string]: unknown;
}

export const DraggableEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  selected,
  data,
}) => {
  const { setEdges, screenToFlowPosition, deleteElements } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);

  // Calcular ruta predeterminada suave
  const [defaultPath, defaultLabelX, defaultLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = (data || {}) as DraggableEdgeData;
  const controlPoint = edgeData.controlPoint;

  let edgePath = defaultPath;
  let labelX = defaultLabelX;
  let labelY = defaultLabelY;

  if (controlPoint) {
    labelX = controlPoint.x;
    labelY = controlPoint.y;

    // Calcular el punto de control cuadrático Qc tal que la curva pase exactamente por (labelX, labelY) en t=0.5
    // P(0.5) = 0.25*P0 + 0.5*Qc + 0.25*P1 = (labelX, labelY)
    // Qc = 2 * (labelX, labelY) - 0.5 * (P0 + P1)
    const qcx = 2 * labelX - 0.5 * (sourceX + targetX);
    const qcy = 2 * labelY - 0.5 * (sourceY + targetY);

    edgePath = `M ${sourceX} ${sourceY} Q ${qcx} ${qcy} ${targetX} ${targetY}`;
  }

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      setIsDragging(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const flowPos = screenToFlowPosition({
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        });

        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id === id) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  controlPoint: {
                    x: Math.round(flowPos.x),
                    y: Math.round(flowPos.y),
                  },
                },
              };
            }
            return edge;
          })
        );
      };

      const onMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [id, screenToFlowPosition, setEdges]
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      // Restablecer punto de control para volver a la ruta predeterminada
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            const nextData = { ...(edge.data || {}) };
            delete nextData.controlPoint;
            return {
              ...edge,
              data: nextData,
            };
          }
          return edge;
        })
      );
    },
    [id, setEdges]
  );

  const handleDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      if (typeof deleteElements === 'function') {
        deleteElements({ edges: [{ id }] });
      } else {
        setEdges((eds) => eds.filter((edge) => edge.id !== id));
      }
    },
    [id, deleteElements, setEdges]
  );

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          ...(selected ? { strokeWidth: 3, filter: 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))' } : {}),
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Arrastra para desviar la curva | Doble clic para restablecer"
            style={{
              backgroundColor: (labelBgStyle?.fill as string) || '#ffffff',
              borderColor: (labelBgStyle?.stroke as string) || '#cbd5e1',
              color: (labelStyle?.fill as string) || '#1e293b',
            }}
            className={`group/edge flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-full border text-[9px] font-bold shadow-xs select-none transition-all cursor-grab active:cursor-grabbing hover:scale-105 ${
              isDragging
                ? 'ring-2 ring-indigo-500 scale-110 shadow-md cursor-grabbing'
                : selected || controlPoint
                ? 'ring-2 ring-indigo-400 shadow-sm'
                : 'hover:shadow-sm'
            }`}
          >
            <GripVertical className="w-2.5 h-2.5 opacity-50 shrink-0" />
            <span className="leading-none">{typeof label === 'string' ? label : 'RELACIÓN'}</span>

            {/* Botón para eliminar la relación */}
            <button
              type="button"
              onClick={handleDelete}
              title="Eliminar esta relación"
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-colors cursor-pointer ml-0.5 shrink-0"
              aria-label="Eliminar relación"
            >
              <X className="w-2 h-2" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

DraggableEdge.displayName = 'DraggableEdge';
export default DraggableEdge;
