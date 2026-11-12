import React from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { Database } from 'lucide-react';
import { Permisos } from '@/config/permisos';
import { Permiso } from '@/shared/components/Permiso';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import DraggableEdge from '../edges/DraggableEdge';
import nodeTypes from '../nodes/nodeTypes';
import type { FlowEdge, FlowNode } from '../types/types';

const edgeTypes = {
  draggable: DraggableEdge,
};

export interface EditorLienzoProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  isCargando: boolean;
  sincronizando: boolean;
  puedeEditarNodos: boolean;
  puedeEliminarNodos: boolean;
  puedeCrearConexiones: boolean;
  puedeEditarConexiones: boolean;
  puedeEliminarConexiones: boolean;
  guardandoPosicionesRef: React.MutableRefObject<boolean>;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
  onEdgesDelete: (edgesToDelete: Edge[]) => void;
  onNodesDelete: (nodesToDelete: Node[]) => Promise<void>;
  onNodeClick: (_: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onAbrirModalReglaRapida: () => void;
  onIrABaseConocimiento: () => void;
}

export const EditorLienzo: React.FC<EditorLienzoProps> = ({
  nodes,
  edges,
  isCargando,
  sincronizando,
  puedeEditarNodos,
  puedeEliminarNodos,
  puedeCrearConexiones,
  puedeEditarConexiones,
  puedeEliminarConexiones,
  guardandoPosicionesRef,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onEdgesDelete,
  onNodesDelete,
  onNodeClick,
  onPaneClick,
  onAbrirModalReglaRapida,
  onIrABaseConocimiento,
}) => {
  return (
    <div className="flex-1 h-full w-full relative">
      {sincronizando && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-stone-200 px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-xs font-medium text-stone-700">
          <Spinner size="sm" className="text-teal-700" />
          <span>Sincronizando grafo con la Base de Conocimiento...</span>
        </div>
      )}

      {nodes.length === 0 && !isCargando && !sincronizando && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm text-center max-w-sm pointer-events-auto space-y-3">
            <Database className="w-10 h-10 text-stone-400 mx-auto" />
            <h4 className="font-bold text-stone-800 text-sm">Base de Conocimiento Vacía</h4>
            <p className="text-xs text-stone-500">
              Agrega hechos, variables y reglas en la Base de Conocimiento o utiliza el botón{' '}
              <strong>+ Regla Rápida</strong> para diseñar el sistema.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={onAbrirModalReglaRapida}>
                + Crear Primera Regla
              </Button>
              <Permiso permisos={[Permisos.BASE_CONOCIMIENTO_VER]}>
                <Button variant="outline" size="sm" onClick={onIrABaseConocimiento}>
                  Ir a Base de C.
                </Button>
              </Permiso>
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) =>
          onNodesChange(
            changes.filter(
              (change) =>
                (change.type !== 'position' || puedeEditarNodos) &&
                (change.type !== 'remove' || puedeEliminarNodos)
            )
          )
        }
        onEdgesChange={(changes) =>
          onEdgesChange(changes.filter((change) => change.type !== 'remove' || puedeEliminarConexiones))
        }
        nodesDraggable={puedeEditarNodos}
        nodesConnectable={puedeCrearConexiones}
        onBeforeDelete={async ({ nodes: deletingNodes, edges: deletingEdges }) =>
          !guardandoPosicionesRef.current &&
          (!deletingNodes.length || puedeEliminarNodos) &&
          (!deletingEdges.length || puedeEliminarConexiones)
        }
        onConnect={onConnect}
        onReconnect={onReconnect}
        edgesReconnectable={puedeEditarConexiones}
        reconnectRadius={25}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'draggable',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  );
};

export default EditorLienzo;

