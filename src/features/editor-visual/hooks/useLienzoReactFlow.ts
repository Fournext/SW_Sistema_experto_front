import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  addEdge,
  reconnectEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import baseConocimientoService from '@/features/base-conocimiento/services/baseConocimientoService';
import type { Hecho, Regla, Variable } from '@/features/base-conocimiento/types/types';
import editorVisualService from '../services/editorVisualService';
import type { FlowEdge, FlowNode, TipoNodo } from '../types/types';
import { construirGrafoBaseConocimiento, type ModoVistaLienzo } from '../utils/grafoBaseConocimiento';
import type { EstadoInferenciaRegla } from './useSimuladorWorkflowFWC';

interface UseLienzoReactFlowParams {
  sistemaId: string;
  isCargando: boolean;
  hechos: Hecho[];
  variables: Variable[];
  reglas: Regla[];
  nodosVisuales: any[];
  nodes: FlowNode[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  edges: FlowEdge[];
  setEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>;
  estadosInferencia: Record<string, EstadoInferenciaRegla>;
  puedeEditarNodos: boolean;
  puedeEliminarNodos: boolean;
  puedeCrearConexiones: boolean;
  puedeEditarConexiones: boolean;
  puedeEliminarConexiones: boolean;
  crearConexion: { mutateAsync: (payload: any) => Promise<any> };
  seleccionarNodo: (node: FlowNode) => void;
  cerrarPanel: () => void;
  refetchBase: () => Promise<any>;
  refetchHechos: () => Promise<any>;
  refetchVariables: () => Promise<any>;
  refetchReglas: () => Promise<any>;
  refetchEditorVisual: () => Promise<any>;
  setGuardando: React.Dispatch<React.SetStateAction<boolean>>;
  fitView: (options?: any) => void;
  fitViewRef: React.MutableRefObject<any>;
}

export function useLienzoReactFlow({
  sistemaId,
  isCargando,
  hechos,
  variables,
  reglas,
  nodosVisuales,
  nodes,
  setNodes,
  edges,
  setEdges,
  estadosInferencia,
  puedeEditarNodos,
  puedeEliminarNodos,
  puedeCrearConexiones,
  puedeEditarConexiones,
  puedeEliminarConexiones,
  crearConexion,
  seleccionarNodo,
  cerrarPanel,
  refetchBase,
  refetchHechos,
  refetchVariables,
  refetchReglas,
  refetchEditorVisual,
  setGuardando,
  fitView,
  fitViewRef,
}: UseLienzoReactFlowParams) {
  const [eliminando, setEliminando] = useState(false);
  const nodosEliminandoRef = useRef(new Set<string>());
  const guardandoPosicionesRef = useRef(false);
  const [sincronizando, setSincronizando] = useState(false);
  const yaInicializadoRef = useRef(false);
  const [vistaModo, setVistaModo] = useState<ModoVistaLienzo>('SIMPLIFICADA');

  const handleCambiarVistaModo = useCallback(
    (nuevoModo: ModoVistaLienzo) => {
      setVistaModo(nuevoModo);
      setTimeout(() => fitViewRef.current({ padding: 0.2 }), 250);
    },
    [fitViewRef]
  );

  // Sincronización automática de la Base de Conocimiento al entrar a la vista o actualizar datos
  useEffect(() => {
    if (!isCargando) {
      let posicionesGuardadas: Record<string, { x: number; y: number }> = {};
      let savedEdgePoints: Record<string, { x: number; y: number }> = {};

      try {
        const saved =
          localStorage.getItem(`editor_pos_v2_${sistemaId}_${vistaModo}`) ||
          localStorage.getItem(`editor_pos_${sistemaId}_${vistaModo}`);
        if (saved) {
          const parsed = JSON.parse(saved);
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
        savedEdgePoints,
        nodosVisuales,
        vistaModo
      );

      setNodes((actuales) => {
        const visualIds = new Map(actuales.map((n) => [n.id, n.data.nodoVisualId]));
        return nuevosNodos
          .filter((n) => !nodosEliminandoRef.current.has(n.id))
          .map((n) => {
            const ruleId = n.type === 'REGLA' ? String(n.data.id) : undefined;
            const estadoInf = ruleId ? estadosInferencia[ruleId] : undefined;
            return {
              ...n,
              data: {
                ...n.data,
                nodoVisualId: visualIds.get(n.id) ?? n.data.nodoVisualId,
                estadoInferencia: estadoInf ?? n.data.estadoInferencia,
              },
            };
          });
      });
      setEdges(
        nuevasEdges.filter(
          (e) => !nodosEliminandoRef.current.has(e.source) && !nodosEliminandoRef.current.has(e.target)
        )
      );

      if (!yaInicializadoRef.current) {
        yaInicializadoRef.current = true;
        setTimeout(() => fitViewRef.current({ padding: 0.2 }), 250);
      }
    }
  }, [
    isCargando,
    hechos,
    variables,
    reglas,
    nodosVisuales,
    sistemaId,
    eliminando,
    estadosInferencia,
    vistaModo,
    setNodes,
    setEdges,
    fitViewRef,
  ]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      seleccionarNodo(node as FlowNode);
    },
    [seleccionarNodo]
  );

  const onPaneClick = useCallback(() => {
    cerrarPanel();
  }, [cerrarPanel]);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!puedeCrearConexiones) return;
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

      if ((srcType === 'REGLA' && tgtType === 'CONDICION') || (srcType === 'CONDICION' && tgtType === 'REGLA')) {
        label = 'IF';
        stroke = '#f59e0b';
        fill = '#78350f';
        bgFill = '#fef3c7';
      } else if (
        (srcType === 'CONDICION' && tgtType === 'CONCLUSION') ||
        (srcType === 'REGLA' && tgtType === 'CONCLUSION')
      ) {
        label = 'THEN';
        stroke = '#a855f7';
        fill = '#581c87';
        bgFill = '#f3e8ff';
      } else if (srcType === 'CONCLUSION' && tgtType === 'CONDICION') {
        label = 'ENCADENA';
        stroke = '#6366f1';
        fill = '#4338ca';
        bgFill = '#e0e7ff';
        strokeDasharray = '4 4';
      } else if (
        ((srcType === 'HECHO' || srcType === 'VARIABLE') && tgtType === 'CONDICION') ||
        (srcType === 'CONDICION' && (tgtType === 'HECHO' || tgtType === 'VARIABLE'))
      ) {
        const isHecho = srcType === 'HECHO' || tgtType === 'HECHO';
        label = 'EVALÚA';
        stroke = isHecho ? '#10b981' : '#0284c7';
        fill = isHecho ? '#064e3b' : '#075985';
        bgFill = isHecho ? '#d1fae5' : '#e0f2fe';
      } else if (
        (srcType === 'CONCLUSION' && (tgtType === 'HECHO' || tgtType === 'VARIABLE')) ||
        ((srcType === 'HECHO' || srcType === 'VARIABLE') && tgtType === 'CONCLUSION')
      ) {
        const isHecho = srcType === 'HECHO' || tgtType === 'HECHO';
        label = isHecho ? 'ACTUALIZA' : 'ASIGNA';
        stroke = isHecho ? '#059669' : '#ec4899';
        fill = isHecho ? '#065f46' : '#9d174d';
        bgFill = isHecho ? '#ecfdf5' : '#fce7f3';
      } else if (srcType === 'REGLA' && tgtType === 'REGLA') {
        label = 'ACTIVA';
        stroke = '#3b82f6';
        fill = '#1d4ed8';
        bgFill = '#dbeafe';
      } else if (
        (srcType === 'VARIABLE' && tgtType === 'HECHO') ||
        (srcType === 'HECHO' && tgtType === 'VARIABLE')
      ) {
        label = 'INSTANCIA';
        stroke = '#64748b';
        fill = '#334155';
        bgFill = '#f1f5f9';
        strokeDasharray = '3 3';
      }

      const isUUID = (str?: string) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      let conexionVisualId: string | undefined = undefined;
      const srcVisualId = sourceNode?.data?.nodoVisualId;
      const tgtVisualId = targetNode?.data?.nodoVisualId;

      if (isUUID(srcVisualId) && isUUID(tgtVisualId)) {
        try {
          const resConexion = await crearConexion.mutateAsync({
            nodo_origen_id: srcVisualId!,
            nodo_destino_id: tgtVisualId!,
            etiqueta: label,
            tipo: label,
          });
          conexionVisualId = resConexion.id;
        } catch {
          // Conexión creada reactivamente en UI si backend rechaza
        }
      }

      const condNode = srcType === 'CONDICION' ? sourceNode : tgtType === 'CONDICION' ? targetNode : null;
      const hvNode =
        srcType === 'HECHO' || srcType === 'VARIABLE'
          ? sourceNode
          : tgtType === 'HECHO' || tgtType === 'VARIABLE'
          ? targetNode
          : null;
      const conclNode = srcType === 'CONCLUSION' ? sourceNode : tgtType === 'CONCLUSION' ? targetNode : null;

      if (condNode?.data?.id && hvNode?.data?.id) {
        try {
          await baseConocimientoService.actualizarCondicion(condNode.data.id, {
            hecho_id: hvNode.type === 'HECHO' ? hvNode.data.id : null,
            variable_id: hvNode.type === 'VARIABLE' ? hvNode.data.id : null,
          });
          refetchReglas();
        } catch (err) {
          console.warn('No se pudo vincular la condición en base de conocimiento:', err);
        }
      }

      if (conclNode?.data?.id && hvNode?.data?.id) {
        try {
          await baseConocimientoService.actualizarConclusion(conclNode.data.id, {
            hecho_resultante_id: hvNode.type === 'HECHO' ? hvNode.data.id : null,
            variable_resultante_id: hvNode.type === 'VARIABLE' ? hvNode.data.id : null,
          });
          refetchReglas();
        } catch (err) {
          console.warn('No se pudo vincular la conclusión en base de conocimiento:', err);
        }
      }

      const newEdge: Edge = {
        ...connection,
        id: `e_${connection.source}_${connection.target}_${Date.now()}`,
        type: 'draggable',
        label,
        animated: true,
        data: {
          tipoRelacion: label,
          condId: condNode?.data?.id,
          conclusionId: conclNode?.data?.id,
          hechoId: hvNode?.type === 'HECHO' ? hvNode.data.id : undefined,
          variableId: hvNode?.type === 'VARIABLE' ? hvNode.data.id : undefined,
          conexionVisualId,
        },
        style: { stroke, strokeWidth: 2, strokeDasharray },
        labelStyle: { fill, fontWeight: 700, fontSize: 9 },
        labelBgStyle: { fill: bgFill, stroke, strokeWidth: 1, rx: 4, ry: 4 },
        labelBgPadding: [5, 1],
      } as Edge;

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges, crearConexion, refetchReglas, puedeCrearConexiones]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!puedeEditarConexiones) return;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges, puedeEditarConexiones]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      if (!puedeEliminarConexiones) return;
      try {
        const savedEdges = localStorage.getItem(`editor_edges_v2_${sistemaId}`);
        if (savedEdges) {
          const parsed = JSON.parse(savedEdges);
          edgesToDelete.forEach((e) => {
            delete parsed[e.id];
          });
          localStorage.setItem(`editor_edges_v2_${sistemaId}`, JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }

      edgesToDelete.forEach(async (e) => {
        const edgeData = e.data as
          | {
              tipoRelacion?: string;
              condId?: string;
              conclusionId?: string;
              reglaId?: string;
              conexionVisualId?: string;
            }
          | undefined;

        const conexionId = edgeData?.conexionVisualId || e.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conexionId);
        if (isUUID) {
          try {
            await editorVisualService.eliminarConexion(conexionId);
          } catch {
            // ignore
          }
        }

        const esEvalua = edgeData?.tipoRelacion === 'EVALUA' || edgeData?.tipoRelacion === 'EVALÚA';
        if (esEvalua && edgeData?.condId) {
          try {
            await baseConocimientoService.actualizarCondicion(edgeData.condId, {
              hecho_id: null,
              variable_id: null,
            });
            refetchReglas();
          } catch (err) {
            console.error('Error al desvincular condición:', err);
          }
        }

        const esActualizaOAsigna =
          edgeData?.tipoRelacion === 'ACTUALIZA' || edgeData?.tipoRelacion === 'ASIGNA';
        if (esActualizaOAsigna && edgeData?.conclusionId) {
          try {
            await baseConocimientoService.actualizarConclusion(edgeData.conclusionId, {
              hecho_resultante_id: null,
              variable_resultante_id: null,
            });
            refetchReglas();
          } catch (err) {
            console.error('Error al desvincular conclusión:', err);
          }
        }

        if (edgeData?.tipoRelacion === 'IF' && edgeData.condId) {
          try {
            await baseConocimientoService.eliminarCondicion(edgeData.condId);
            setNodes((nds) => nds.filter((n) => n.id !== e.target && n.id !== e.source));
            refetchReglas();
          } catch (err) {
            console.error('Error al eliminar condición:', err);
          }
        }

        if (edgeData?.tipoRelacion === 'THEN' && edgeData.conclusionId) {
          try {
            await baseConocimientoService.eliminarConclusion(edgeData.conclusionId);
            setNodes((nds) => nds.filter((n) => n.id !== e.target && n.id !== e.source));
            refetchReglas();
          } catch (err) {
            console.error('Error al eliminar conclusión:', err);
          }
        }
      });
    },
    [sistemaId, refetchReglas, setNodes, puedeEliminarConexiones]
  );

  const onNodesDelete = useCallback(
    async (nodesToDelete: Node[]) => {
      if (!puedeEliminarNodos || guardandoPosicionesRef.current) return;
      const pendientes = nodesToDelete.filter((n) => !nodosEliminandoRef.current.has(n.id));
      if (!pendientes.length) return;
      pendientes.forEach((n) => nodosEliminandoRef.current.add(n.id));
      setEliminando(true);
      setNodes((nds) => nds.filter((n) => !nodosEliminandoRef.current.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !nodosEliminandoRef.current.has(e.source) && !nodosEliminandoRef.current.has(e.target))
      );
      cerrarPanel();
      try {
        await Promise.all(
          pendientes.map(async (n) => {
            const fn = n as FlowNode;
            const visualId = fn.data?.nodoVisualId;
            const entidadId = fn.data?.id;
            const tipo = fn.type;

            if (visualId && !String(visualId).startsWith('temp_') && !String(visualId).startsWith('local_')) {
              try {
                await editorVisualService.eliminarNodo(visualId);
              } catch {
                // La entidad de dominio se elimina aunque el nodo visual ya no exista.
              }
            }

            if (entidadId && !String(entidadId).startsWith('temp_') && !String(entidadId).startsWith('local_')) {
              try {
                if (tipo === 'HECHO') {
                  await baseConocimientoService.eliminarHecho(entidadId);
                } else if (tipo === 'VARIABLE') {
                  await baseConocimientoService.eliminarVariable(entidadId);
                } else if (tipo === 'REGLA') {
                  await baseConocimientoService.eliminarRegla(entidadId);
                } else if (tipo === 'CONDICION') {
                  await baseConocimientoService.eliminarCondicion(entidadId);
                } else if (tipo === 'CONCLUSION') {
                  await baseConocimientoService.eliminarConclusion(entidadId);
                }
              } catch (err) {
                console.error('Error al eliminar elemento de la base de conocimiento:', err);
              }
            }
          })
        );
      } finally {
        await Promise.all([
          refetchHechos(),
          refetchVariables(),
          refetchReglas(),
          refetchEditorVisual(),
          refetchBase(),
        ]);
        pendientes.forEach((n) => nodosEliminandoRef.current.delete(n.id));
        setEliminando(nodosEliminandoRef.current.size > 0);
      }
    },
    [
      cerrarPanel,
      refetchHechos,
      refetchVariables,
      refetchReglas,
      refetchEditorVisual,
      refetchBase,
      puedeEliminarNodos,
      setNodes,
      setEdges,
    ]
  );

  const handleSincronizarManual = useCallback(async () => {
    setSincronizando(true);
    try {
      const [resBase, resEditor] = await Promise.all([refetchBase(), refetchEditorVisual()]);
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
      let savedEdgePoints: Record<string, { x: number; y: number }> = {};
      try {
        const saved =
          localStorage.getItem(`editor_pos_v2_${sistemaId}_${vistaModo}`) ||
          localStorage.getItem(`editor_pos_${sistemaId}_${vistaModo}`);
        if (saved) posicionesGuardadas = JSON.parse(saved);
        const savedEdges = localStorage.getItem(`editor_edges_v2_${sistemaId}`);
        if (savedEdges) savedEdgePoints = JSON.parse(savedEdges);
      } catch {
        // ignore
      }

      const { nodes: nuevosNodos, edges: nuevasEdges } = construirGrafoBaseConocimiento(
        h,
        v,
        r,
        posicionesGuardadas,
        savedEdgePoints,
        resEditor.data?.backendData?.nodos,
        vistaModo
      );

      setNodes(nuevosNodos);
      setEdges(nuevasEdges);
      setTimeout(() => fitView({ padding: 0.2 }), 200);
    } catch (err) {
      console.error('Error al sincronizar base de conocimiento:', err);
    } finally {
      setSincronizando(false);
    }
  }, [
    sistemaId,
    vistaModo,
    refetchBase,
    refetchEditorVisual,
    refetchHechos,
    refetchVariables,
    refetchReglas,
    setNodes,
    setEdges,
    fitView,
  ]);

  const handleGuardarPosiciones = useCallback(async () => {
    if (!puedeEditarNodos || nodosEliminandoRef.current.size > 0 || guardandoPosicionesRef.current) return;
    guardandoPosicionesRef.current = true;
    setGuardando(true);
    try {
      const posMap: Record<string, { x: number; y: number }> = {};
      for (const node of nodes) {
        posMap[node.id] = {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        };
      }

      const edgeControlPoints: Record<string, { x: number; y: number }> = {};
      for (const edge of edges) {
        const cp = (edge.data as { controlPoint?: { x: number; y: number } } | undefined)?.controlPoint;
        if (cp) {
          edgeControlPoints[edge.id] = cp;
        }
      }

      localStorage.setItem(`editor_pos_v2_${sistemaId}_${vistaModo}`, JSON.stringify(posMap));
      localStorage.setItem(`editor_pos_v2_${sistemaId}`, JSON.stringify(posMap));
      localStorage.setItem(`editor_edges_v2_${sistemaId}`, JSON.stringify(edgeControlPoints));

      for (const node of nodes) {
        const x = Math.round(node.position.x);
        const y = Math.round(node.position.y);
        const visualId = node.data?.nodoVisualId;
        const entidadId = node.data?.id;

        if (visualId && !String(visualId).startsWith('temp_') && !String(visualId).startsWith('local_')) {
          try {
            await editorVisualService.moverNodo(visualId, {
              posicion_x: x,
              posicion_y: y,
            });
          } catch {
            // ignore
          }
        } else if (
          entidadId &&
          !String(entidadId).startsWith('temp_') &&
          !String(entidadId).startsWith('local_') &&
          node.type
        ) {
          try {
            const visualCreado = await editorVisualService.crearNodo(sistemaId, {
              tipo: node.type as TipoNodo,
              referencia_id: String(entidadId),
              posicion_x: x,
              posicion_y: y,
            });
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id ? { ...n, data: { ...n.data, nodoVisualId: visualCreado.id } } : n
              )
            );
          } catch {
            // ignore
          }
        }
      }
      await refetchEditorVisual();
    } catch (err) {
      console.error('Error al guardar posiciones:', err);
    } finally {
      guardandoPosicionesRef.current = false;
      setGuardando(false);
    }
  }, [puedeEditarNodos, nodes, edges, sistemaId, vistaModo, setGuardando, setNodes, refetchEditorVisual]);

  const handleReorganizarGrafo = useCallback(() => {
    if (!puedeEditarNodos) return;
    localStorage.removeItem(`editor_pos_v2_${sistemaId}`);
    localStorage.removeItem(`editor_pos_${sistemaId}`);
    localStorage.removeItem(`editor_edges_v2_${sistemaId}`);
    const { nodes: nuevosNodos, edges: nuevasEdges } = construirGrafoBaseConocimiento(
      hechos,
      variables,
      reglas,
      {},
      {},
      undefined,
      vistaModo
    );
    setNodes(nuevosNodos);
    setEdges(nuevasEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 200);
  }, [puedeEditarNodos, sistemaId, hechos, variables, reglas, vistaModo, setNodes, setEdges, fitView]);

  const handleSeleccionarRegla = useCallback(
    (reglaId: string | number) => {
      const targetNode = nodes.find(
        (n) => n.id === `regla_${reglaId}` || (n.type === 'REGLA' && String(n.data?.id) === String(reglaId))
      );
      if (targetNode) {
        fitViewRef.current({ nodes: [targetNode], duration: 500, padding: 0.6 });
        seleccionarNodo(targetNode);
      }
    },
    [nodes, seleccionarNodo, fitViewRef]
  );

  return {
    eliminando,
    sincronizando,
    vistaModo,
    guardandoPosicionesRef,
    handleCambiarVistaModo,
    onNodeClick,
    onPaneClick,
    onConnect,
    onReconnect,
    onEdgesDelete,
    onNodesDelete,
    handleSincronizarManual,
    handleGuardarPosiciones,
    handleReorganizarGrafo,
    handleSeleccionarRegla,
  };
}
