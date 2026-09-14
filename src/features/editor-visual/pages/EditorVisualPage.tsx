import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArrowLeft, Network, Database, PlayCircle } from 'lucide-react';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import {
  useBaseConocimiento,
  useHechos,
  useVariables,
  useReglas,
} from '@/features/base-conocimiento/hooks/useBaseConocimiento';
import { useEditorMutations } from '../hooks/useEditorVisual';
import useEditorStore from '../store/editorStore';
import nodeTypes from '../nodes/nodeTypes';
import DraggableEdge from '../edges/DraggableEdge';
import EditorToolbar from '../components/EditorToolbar';
import PanelPropiedades from '../components/PanelPropiedades';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import Button from '@/components/ui/Button';
import { construirGrafoBaseConocimiento } from '../utils/grafoBaseConocimiento';
import type { TipoNodo, FlowNode, FlowEdge, NodoDatosGenerales } from '../types/types';

// Tipos de aristas personalizados para permitir mover y desviar relaciones con el mouse
const edgeTypes = {
  draggable: DraggableEdge,
};

// Componente interno con acceso al contexto de useReactFlow()
const EditorCanvasContent: React.FC<{ sistemaId: string }> = ({ sistemaId }) => {
  const navigate = useNavigate();
  const { data: sistema } = useSistemaExperto(sistemaId);

  // Consultar la Base de Conocimiento directamente para sincronización total
  const {
    data: baseConocimiento,
    isLoading: isBaseLoading,
    isError: isBaseError,
    error: baseError,
    refetch: refetchBase,
  } = useBaseConocimiento(sistemaId);

  const effectiveBaseId = baseConocimiento?.id;

  const {
    data: fetchedHechos,
    isLoading: isHechosLoading,
    refetch: refetchHechos,
  } = useHechos(effectiveBaseId);

  const {
    data: fetchedVars,
    isLoading: isVarsLoading,
    refetch: refetchVariables,
  } = useVariables(effectiveBaseId);

  const {
    data: fetchedReglas,
    isLoading: isReglasLoading,
    refetch: refetchReglas,
  } = useReglas(effectiveBaseId);

  const hechos =
    baseConocimiento?.hechos && baseConocimiento.hechos.length > 0
      ? baseConocimiento.hechos
      : fetchedHechos || [];

  const variables =
    baseConocimiento?.variables && baseConocimiento.variables.length > 0
      ? baseConocimiento.variables
      : fetchedVars || [];

  const reglas =
    baseConocimiento?.reglas && baseConocimiento.reglas.length > 0
      ? baseConocimiento.reglas
      : fetchedReglas || [];

  const isCargandoBase =
    isBaseLoading || (effectiveBaseId ? isHechosLoading || isVarsLoading || isReglasLoading : false);

  const { crearNodo, actualizarNodo, eliminarNodo, crearConexion, eliminarConexion } =
    useEditorMutations(sistemaId);

  const { fitView } = useReactFlow();
  const { seleccionarNodo, cerrarPanel } = useEditorStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [guardando, setGuardando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Sincronización automática de la Base de Conocimiento al entrar a la vista o actualizar datos
  useEffect(() => {
    if (!isCargandoBase) {
      let posicionesGuardadas: Record<string, { x: number; y: number }> = {};
      let savedEdgePoints: Record<string, { x: number; y: number }> = {};

      try {
        const saved =
          localStorage.getItem(`editor_pos_v2_${sistemaId}`) ||
          localStorage.getItem(`editor_pos_${sistemaId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validar que las posiciones guarden la jerarquía pedagógica correcta (Regla arriba de Condición)
          // Si una regla tiene Y >= a su condición, es un diseño antiguo invertido que debe descartarse
          let tieneInversion = false;
          for (const regla of reglas) {
            const reglaKey = `regla_${regla.id}`;
            const reglaPos = parsed[reglaKey];
            if (reglaPos && Array.isArray(regla.condiciones)) {
              for (const cond of regla.condiciones) {
                const condKey = `cond_${regla.id}_${cond.id}`;
                const condPos = parsed[condKey];
                if (condPos && condPos.y <= reglaPos.y) {
                  tieneInversion = true;
                  break;
                }
              }
            }
            if (tieneInversion) break;
          }

          if (!tieneInversion) {
            posicionesGuardadas = parsed;
          } else {
            // Limpiar posiciones antiguas invertidas
            localStorage.removeItem(`editor_pos_${sistemaId}`);
          }
        }

        const savedEdges = localStorage.getItem(`editor_edges_v2_${sistemaId}`);
        if (savedEdges) savedEdgePoints = JSON.parse(savedEdges);
      } catch {
        // ignore
      }

      const { nodes: nuevosNodos, edges: nuevasEdges } = construirGrafoBaseConocimiento(
        hechos,
        variables,
        reglas,
        posicionesGuardadas,
        savedEdgePoints
      );

      setNodes(nuevosNodos);
      setEdges(nuevasEdges);
      setTimeout(() => fitView({ padding: 0.2 }), 250);
    }
  }, [isCargandoBase, hechos, variables, reglas, sistemaId, setNodes, setEdges, fitView]);

  // Manejar click en nodo -> abrir panel de propiedades
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      seleccionarNodo(node as FlowNode);
    },
    [seleccionarNodo]
  );

  // Manejar click en el canvas vacío -> cerrar panel
  const onPaneClick = useCallback(() => {
    cerrarPanel();
  }, [cerrarPanel]);

  // Conectar nodos manualmente arrastrando handles (source -> target) con detección de tipo de relación
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      const srcType = sourceNode?.type;
      const tgtType = targetNode?.type;

      let label = 'RELACIÓN';
      let stroke = '#6366f1';
      let fill = '#4338ca';
      let bgFill = '#e0e7ff';
      let strokeDasharray: string | undefined = undefined;

      if (srcType === 'REGLA' && tgtType === 'CONDICION') {
        label = 'IF';
        stroke = '#f59e0b';
        fill = '#78350f';
        bgFill = '#fef3c7';
      } else if (srcType === 'CONDICION' && tgtType === 'CONCLUSION') {
        label = 'THEN';
        stroke = '#a855f7';
        fill = '#581c87';
        bgFill = '#f3e8ff';
      } else if (srcType === 'CONDICION' && tgtType === 'REGLA') {
        label = 'IF';
        stroke = '#f59e0b';
        fill = '#78350f';
        bgFill = '#fef3c7';
      } else if (srcType === 'REGLA' && tgtType === 'CONCLUSION') {
        label = 'THEN';
        stroke = '#a855f7';
        fill = '#581c87';
        bgFill = '#f3e8ff';
      } else if ((srcType === 'HECHO' || srcType === 'VARIABLE') && tgtType === 'CONDICION') {
        label = 'EVALÚA';
        stroke = srcType === 'HECHO' ? '#10b981' : '#0284c7';
        fill = srcType === 'HECHO' ? '#064e3b' : '#075985';
        bgFill = srcType === 'HECHO' ? '#d1fae5' : '#e0f2fe';
      } else if (srcType === 'CONCLUSION' && tgtType === 'CONDICION') {
        label = 'ENCADENA';
        stroke = '#6366f1';
        fill = '#4338ca';
        bgFill = '#e0e7ff';
        strokeDasharray = '4 4';
      } else if (srcType === 'CONCLUSION' && (tgtType === 'HECHO' || tgtType === 'VARIABLE')) {
        label = tgtType === 'HECHO' ? 'ACTUALIZA' : 'ASIGNA';
        stroke = tgtType === 'HECHO' ? '#059669' : '#ec4899';
        fill = tgtType === 'HECHO' ? '#065f46' : '#9d174d';
        bgFill = tgtType === 'HECHO' ? '#ecfdf5' : '#fce7f3';
      } else if (srcType === 'REGLA' && tgtType === 'REGLA') {
        label = 'ACTIVA';
        stroke = '#3b82f6';
        fill = '#1d4ed8';
        bgFill = '#dbeafe';
      } else if (srcType === 'VARIABLE' && tgtType === 'HECHO') {
        label = 'INSTANCIA';
        stroke = '#64748b';
        fill = '#334155';
        bgFill = '#f1f5f9';
        strokeDasharray = '3 3';
      }

      const newEdge: Edge = {
        ...connection,
        id: `e_${connection.source}_${connection.target}_${Date.now()}`,
        type: 'draggable',
        label,
        animated: true,
        style: { stroke, strokeWidth: 2, strokeDasharray },
        labelStyle: { fill, fontWeight: 700, fontSize: 9 },
        labelBgStyle: { fill: bgFill, stroke, strokeWidth: 1, rx: 4, ry: 4 },
        labelBgPadding: [5, 1],
      } as Edge;

      setEdges((eds) => addEdge(newEdge, eds));

      try {
        await crearConexion.mutateAsync({
          nodo_origen: connection.source,
          nodo_destino: connection.target,
        });
      } catch {
        // Conexión creada reactivamente en UI
      }
    },
    [nodes, setEdges, crearConexion]
  );

  // Re-conectar extremo de relación arrastrándolo a otro handle con el ratón
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  // Eliminar conexiones
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((e) => {
        eliminarConexion.mutate(e.id);
      });
    },
    [eliminarConexion]
  );

  // Eliminar nodos
  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach((n) => {
        eliminarNodo.mutate(n.id);
      });
      cerrarPanel();
    },
    [eliminarNodo, cerrarPanel]
  );

  // Helper para persistir o crear nodos auxiliares
  const spawnNode = useCallback(
    async (
      tipo: TipoNodo,
      pos: { x: number; y: number },
      datos: NodoDatosGenerales
    ): Promise<FlowNode> => {
      try {
        const res = await crearNodo.mutateAsync({
          tipo,
          posicion_x: Math.round(pos.x),
          posicion_y: Math.round(pos.y),
          datos,
        });
        return {
          id: String(res.id),
          type: tipo,
          position: pos,
          data: { ...datos, ...res.datos },
        };
      } catch {
        return {
          id: `local_${tipo.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: tipo,
          position: pos,
          data: datos,
        };
      }
    },
    [crearNodo]
  );

  // Agregar nuevo nodo individual al lienzo
  const handleAgregarNodo = async (tipo: TipoNodo) => {
    const defaultDataMap: Record<TipoNodo, NodoDatosGenerales> = {
      HECHO: {
        nombre: 'Nuevo_Hecho',
        valor: 'valor',
        tipo_dato: 'TEXTO',
        es_inicial: true,
      },
      VARIABLE: {
        nombre: 'nueva_variable',
        tipo: 'TEXTO',
        valor_por_defecto: '',
        descripcion: 'Variable del dominio',
      },
      CONDICION: {
        referencia: 'variable',
        operador: '==',
        valor_esperado: 'true',
        orden: 1,
      },
      REGLA: {
        nombre: `R_${nodes.length + 1}`,
        descripcion: 'Regla explicativa',
        prioridad: 10,
        factor_certeza: 1.0,
        activa: true,
      },
      CONCLUSION: {
        destino: 'resultado',
        valor_resultante: 'deducción',
      },
    };

    const posX = 150 + (nodes.length % 5) * 60;
    const posY = 150 + (nodes.length % 5) * 50;
    const datos = defaultDataMap[tipo];

    const newNode = await spawnNode(tipo, { x: posX, y: posY }, datos);
    setNodes((nds) => [...nds, newNode]);
    seleccionarNodo(newNode);
  };

  // Re-sincronizar manualmente todo el grafo desde la Base de Conocimiento
  const handleSincronizarManual = async () => {
    setSincronizando(true);
    try {
      const resBase = await refetchBase();
      const bId = resBase.data?.id;

      let h = resBase.data?.hechos || [];
      let v = resBase.data?.variables || [];
      let r = resBase.data?.reglas || [];

      if (bId) {
        const [resH, resV, resR] = await Promise.all([
          refetchHechos(),
          refetchVariables(),
          refetchReglas(),
        ]);
        if (h.length === 0 && resH.data) h = resH.data;
        if (v.length === 0 && resV.data) v = resV.data;
        if (r.length === 0 && resR.data) r = resR.data;
      }

      let posicionesGuardadas: Record<string, { x: number; y: number }> = {};
      try {
        const saved = localStorage.getItem(`editor_pos_${sistemaId}`);
        if (saved) posicionesGuardadas = JSON.parse(saved);
      } catch {
        // ignore
      }

      const { nodes: nuevosNodos, edges: nuevasEdges } = construirGrafoBaseConocimiento(
        h,
        v,
        r,
        posicionesGuardadas
      );

      setNodes(nuevosNodos);
      setEdges(nuevasEdges);
      setTimeout(() => fitView({ padding: 0.2 }), 200);
    } catch (err) {
      console.error('Error al sincronizar base de conocimiento:', err);
    } finally {
      setSincronizando(false);
    }
  };

  // Guardar cambios de propiedades de un nodo
  const handleGuardarPropiedades = async (
    nodoId: string,
    nuevosDatos: Partial<NodoDatosGenerales>
  ) => {
    setGuardando(true);
    try {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodoId) {
            return {
              ...n,
              data: {
                ...n.data,
                ...nuevosDatos,
              },
            };
          }
          return n;
        })
      );

      if (!nodoId.startsWith('temp_') && !nodoId.startsWith('local_')) {
        await actualizarNodo.mutateAsync({
          id: nodoId,
          datos: { datos: nuevosDatos },
        });
      }
    } catch (err) {
      console.error('Error al actualizar propiedades:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar nodo desde el panel lateral
  const handleEliminarNodo = async (nodoId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodoId));
    setEdges((eds) => eds.filter((e) => e.source !== nodoId && e.target !== nodoId));
    if (!nodoId.startsWith('temp_') && !nodoId.startsWith('local_')) {
      await eliminarNodo.mutateAsync(nodoId);
    }
    cerrarPanel();
  };

  // Guardar todas las posiciones actuales de los nodos y relaciones en localStorage y backend
  const handleGuardarPosiciones = async () => {
    setGuardando(true);
    try {
      const posMap: Record<string, { x: number; y: number }> = {};
      for (const node of nodes) {
        posMap[node.id] = {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        };
      }

      // Guardar puntos de control de las curvas de las relaciones
      const edgeControlPoints: Record<string, { x: number; y: number }> = {};
      for (const edge of edges) {
        const cp = (edge.data as { controlPoint?: { x: number; y: number } } | undefined)?.controlPoint;
        if (cp) {
          edgeControlPoints[edge.id] = cp;
        }
      }

      localStorage.setItem(`editor_pos_v2_${sistemaId}`, JSON.stringify(posMap));
      localStorage.setItem(`editor_edges_v2_${sistemaId}`, JSON.stringify(edgeControlPoints));

      for (const node of nodes) {
        if (!node.id.startsWith('temp_') && !node.id.startsWith('local_')) {
          try {
            await actualizarNodo.mutateAsync({
              id: node.id,
              datos: {
                posicion_x: Math.round(node.position.x),
                posicion_y: Math.round(node.position.y),
                datos: node.data,
              },
            });
          } catch {
            // backend opcional
          }
        }
      }
    } catch (err) {
      console.error('Error al guardar posiciones:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Reorganizar automáticamente el grafo al diseño pedagógico (Regla -> IF -> Condición -> THEN -> Conclusión)
  const handleReorganizarGrafo = () => {
    localStorage.removeItem(`editor_pos_v2_${sistemaId}`);
    localStorage.removeItem(`editor_pos_${sistemaId}`);
    localStorage.removeItem(`editor_edges_v2_${sistemaId}`);
    const { nodes: nuevosNodos, edges: nuevasEdges } = construirGrafoBaseConocimiento(
      hechos,
      variables,
      reglas,
      {},
      {}
    );
    setNodes(nuevosNodos);
    setEdges(nuevasEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 200);
  };

  // SPINNER DE CARGA AL ENTRAR A LA VISTA
  if (isCargandoBase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="p-8 bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center max-w-sm text-center space-y-4">
          <Spinner size="lg" className="text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sincronizando con la Base de Conocimiento
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cargando hechos, variables y reglas interconectadas en el lienzo...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isBaseError) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/sistemas/${sistemaId}`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sistemas
        </button>
        <ErrorMessage
          title="Error al cargar la Base de Conocimiento"
          message={
            baseError instanceof Error
              ? baseError.message
              : 'No se pudo cargar la base de conocimiento para diagramar el editor.'
          }
          onRetry={() => refetchBase()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3">
      {/* Barra superior de navegación y título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistemaId}`)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
            title="Volver al detalle"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-600" />
              Editor Visual — {sistema?.nombre || 'Sistema Experto'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Sincronizado automáticamente con la Base de Conocimiento: Hechos, Variables, Condiciones y Reglas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Database className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
          >
            Base C.
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/inferencia`)}
          >
            Inferencia
          </Button>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="shrink-0">
        <EditorToolbar
          onAgregarNodo={handleAgregarNodo}
          onGuardarPosiciones={handleGuardarPosiciones}
          onCentrarVista={() => fitView({ padding: 0.2 })}
          onSincronizar={handleSincronizarManual}
          onReorganizar={handleReorganizarGrafo}
          sincronizando={sincronizando}
          guardando={guardando}
        />
      </div>

      {/* Contenedor del Lienzo React Flow + Panel Lateral */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner relative overflow-hidden flex">
        <div className="flex-1 h-full w-full relative">
          {/* Indicador flotante cuando se sincroniza manualmente */}
          {sincronizando && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-xs border border-indigo-200 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold text-indigo-700 animate-pulse">
              <Spinner size="sm" className="text-indigo-600" />
              <span>Sincronizando grafo con la Base de Conocimiento...</span>
            </div>
          )}

          {/* Estado vacío sugerente si no hay elementos */}
          {nodes.length === 0 && !isCargandoBase && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div className="bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-slate-200 shadow-md text-center max-w-sm pointer-events-auto space-y-3">
                <Database className="w-10 h-10 text-indigo-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">Base de Conocimiento Vacía</h4>
                <p className="text-xs text-slate-500">
                  Agrega hechos, variables y reglas en la Base de Conocimiento o utiliza los botones superiores para diseñar el diagrama.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
                >
                  Ir a Base de Conocimiento
                </Button>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            edgesReconnectable={true}
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

        {/* Panel lateral derecho de propiedades */}
        <PanelPropiedades
          onGuardarPropiedades={handleGuardarPropiedades}
          onEliminarNodo={handleEliminarNodo}
          guardando={guardando}
        />
      </div>
    </div>
  );
};

export const EditorVisualPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorMessage message="Identificador del sistema experto no proporcionado en la ruta." />;
  }

  return (
    <ReactFlowProvider>
      <EditorCanvasContent sistemaId={id} />
    </ReactFlowProvider>
  );
};

export default EditorVisualPage;
