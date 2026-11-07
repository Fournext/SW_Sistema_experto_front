import { Permiso } from '@/shared/components/Permiso';
import { Permisos, usePuede } from '@/config/permisos';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useActividadNavigate } from '@/hooks/useActividadNavigate';
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
import { useEditorMutations, useEditorVisual } from '../hooks/useEditorVisual';
import baseConocimientoService from '@/features/base-conocimiento/services/baseConocimientoService';
import editorVisualService from '../services/editorVisualService';
import useEditorStore from '../store/editorStore';
import nodeTypes from '../nodes/nodeTypes';
import DraggableEdge from '../edges/DraggableEdge';
import EditorToolbar from '../components/EditorToolbar';
import PanelPropiedades from '../components/PanelPropiedades';
import CrearReglaRapidaModal from '../components/CrearReglaRapidaModal';
import EditorPseudocodigoModal from '../components/EditorPseudocodigoModal';
import PanelOrdenReglas from '../components/PanelOrdenReglas';
import PanelWorkflowInferencia, { type PasoWorkflow, type ContradiccionPaso } from '../components/PanelWorkflowInferencia';
import { BarraVectorHechos, type HechoVectorItem } from '@/features/inferencia/components/BarraVectorHechos';
import { inferenciaService } from '@/features/inferencia/services/inferenciaService';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import Button from '@/components/ui/Button';
import { construirGrafoBaseConocimiento, type ModoVistaLienzo } from '../utils/grafoBaseConocimiento';
import type { TipoNodo, FlowNode, FlowEdge, NodoDatosGenerales } from '../types/types';
import type { TipoDato, CondicionItemInput, ConclusionItemInput } from '@/features/base-conocimiento/types/types';

// Tipos de aristas personalizados para permitir mover y desviar relaciones con el mouse
const edgeTypes = {
  draggable: DraggableEdge,
};

// Constante inmutable a nivel de módulo para evitar re-renderizados innecesarios
const EMPTY_ARRAY: never[] = [];

// Componente interno con acceso al contexto de useReactFlow()
const EditorCanvasContent: React.FC<{ sistemaId: string }> = ({ sistemaId }) => {
  const navigate = useActividadNavigate();
  const puedeCrearNodos = usePuede(Permisos.EDITOR_NODOS_CREAR);
  const puedeEditarNodos = usePuede(Permisos.EDITOR_NODOS_EDITAR);
  const puedeEliminarNodos = usePuede(Permisos.EDITOR_NODOS_ELIMINAR);
  const puedeCrearConexiones = usePuede(Permisos.EDITOR_CONEXIONES_CREAR);
  const puedeEditarConexiones = usePuede(Permisos.EDITOR_CONEXIONES_EDITAR);
  const puedeEliminarConexiones = usePuede(Permisos.EDITOR_CONEXIONES_ELIMINAR);
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

  const hechos = useMemo(() => {
    return fetchedHechos ?? baseConocimiento?.hechos ?? EMPTY_ARRAY;
  }, [baseConocimiento?.hechos, fetchedHechos]);

  const variables = useMemo(() => {
    return fetchedVars ?? baseConocimiento?.variables ?? EMPTY_ARRAY;
  }, [baseConocimiento?.variables, fetchedVars]);

  const reglas = useMemo(() => {
    return fetchedReglas ?? baseConocimiento?.reglas ?? EMPTY_ARRAY;
  }, [baseConocimiento?.reglas, fetchedReglas]);

  const {
    data: editorVisualData,
    isLoading: isEditorVisualLoading,
    refetch: refetchEditorVisual,
  } = useEditorVisual(sistemaId);

  const nodosVisuales = useMemo(() => {
    return editorVisualData?.backendData?.nodos || EMPTY_ARRAY;
  }, [editorVisualData?.backendData?.nodos]);

  const isCargando =
    isBaseLoading || isEditorVisualLoading || (effectiveBaseId ? isHechosLoading || isVarsLoading || isReglasLoading : false);

  const { crearConexion } = useEditorMutations(sistemaId);

  const { fitView } = useReactFlow();
  const fitViewRef = useRef(fitView);
  fitViewRef.current = fitView;

  const {
    nodoSeleccionado,
    seleccionarNodo,
    cerrarPanel,
    actualizarDatosNodoSeleccionado,
  } = useEditorStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const nodosEliminandoRef = useRef(new Set<string>());
  const guardandoPosicionesRef = useRef(false);
  const [sincronizando, setSincronizando] = useState(false);
  const yaInicializadoRef = useRef(false);

  // Modo del editor: Diseño vs Simulación Workflow FWC
  const [modoEditor, setModoEditor] = useState<'DISENO' | 'SIMULACION'>('DISENO');

  // Modo de visualización del lienzo: Simplificada (Solo Reglas y Hechos) vs Completa (Desglosada)
  const [vistaModo, setVistaModo] = useState<ModoVistaLienzo>('SIMPLIFICADA');

  const handleCambiarVistaModo = (nuevoModo: ModoVistaLienzo) => {
    setVistaModo(nuevoModo);
    setTimeout(() => fitViewRef.current({ padding: 0.2 }), 250);
  };

  // Cálculo semiautomático del siguiente correlativo de regla (R1, R2, ...)
  const siguienteNumeroRegla = useMemo(() => {
    if (!reglas || reglas.length === 0) return 1;
    const numeros = reglas
      .map((r) => {
        const match = r.nombre?.match(/^R(\d+)$/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);
    return numeros.length > 0 ? Math.max(...numeros) + 1 : reglas.length + 1;
  }, [reglas]);

  // Estados para panel de orden de reglas y simulación FWC
  const [modalReglaRapidaAbierto, setModalReglaRapidaAbierto] = useState(false);
  const [modalPseudocodigoAbierto, setModalPseudocodigoAbierto] = useState(false);
  const [mostrarPanelOrden, setMostrarPanelOrden] = useState(false);
  const [mostrarVectorHechos, setMostrarVectorHechos] = useState(true);
  const [vectorHechos, setVectorHechos] = useState<HechoVectorItem[]>([]);
  const vectorHechosInicializadoRef = useRef(false);
  const [ejecutandoInferencia, setEjecutandoInferencia] = useState(false);
  const [estadosInferencia, setEstadosInferencia] = useState<Record<string, 'ACTIVADA' | 'EJECUTADA' | 'RECHAZADA' | 'ANALIZANDO'>>({});

  // Estados específicos para el modo Workflow / Simulación paso a paso
  const [pasosWorkflow, setPasosWorkflow] = useState<PasoWorkflow[]>([]);
  const [pasoActualWorkflowIndex, setPasoActualWorkflowIndex] = useState(0);
  const [modoEjecucionWorkflow, setModoEjecucionWorkflow] = useState<'DIRECTO' | 'PASO_A_PASO'>('PASO_A_PASO');
  const [conclusionFinalWorkflow, setConclusionFinalWorkflow] = useState<string | null>(null);

  // Inicializar vector de hechos una sola vez al cargar hechos de la BC
  useEffect(() => {
    if (hechos.length > 0 && !vectorHechosInicializadoRef.current) {
      vectorHechosInicializadoRef.current = true;
      setVectorHechos(
        hechos.map((h) => ({
          nombre: h.nombre,
          valor: String(h.valor ?? ''),
        }))
      );
    }
  }, [hechos]);

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
          // Validar que las posiciones guarden la jerarquía pedagógica correcta (Regla arriba de Condición)
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
        savedEdgePoints,
        nodosVisuales,
        vistaModo
      );

      // Conservar IDs visuales creados en esta sesión y preservar el estado de inferencia de reglas
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
      setEdges(nuevasEdges.filter((e) =>
        !nodosEliminandoRef.current.has(e.source) && !nodosEliminandoRef.current.has(e.target)
      ));

      if (!yaInicializadoRef.current) {
        yaInicializadoRef.current = true;
        setTimeout(() => fitViewRef.current({ padding: 0.2 }), 250);
      }
    }
  }, [isCargando, hechos, variables, reglas, nodosVisuales, sistemaId, eliminando, estadosInferencia, vistaModo]);

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

      // Sincronización semántica bidireccional con la Base de Conocimiento
      const condNode = srcType === 'CONDICION' ? sourceNode : tgtType === 'CONDICION' ? targetNode : null;
      const hvNode =
        srcType === 'HECHO' || srcType === 'VARIABLE'
          ? sourceNode
          : tgtType === 'HECHO' || tgtType === 'VARIABLE'
          ? targetNode
          : null;
      const conclNode = srcType === 'CONCLUSION' ? sourceNode : tgtType === 'CONCLUSION' ? targetNode : null;

      // 1. Relación Condición <-> Hecho / Variable (EVALÚA)
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

      // 2. Relación Conclusión <-> Hecho / Variable (ACTUALIZA / ASIGNA)
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

  // Re-conectar extremo de relación arrastrándolo a otro handle con el ratón
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!puedeEditarConexiones) return;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges, puedeEditarConexiones]
  );

  // Eliminar conexiones y desvincular relaciones del dominio
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      if (!puedeEliminarConexiones) return;
      // 1. Limpiar puntos de control guardados en localStorage
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

        // 2. Si es una conexión visual en backend (UUID)
        const conexionId = edgeData?.conexionVisualId || e.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conexionId);
        if (isUUID) {
          try {
            await editorVisualService.eliminarConexion(conexionId);
          } catch {
            // ignore
          }
        }

        // 3. Si es una relación EVALÚA (Hecho/Variable <-> Condición)
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

        // 4. Si es una relación ACTUALIZA / ASIGNA (Conclusión <-> Hecho/Variable)
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

        // 5. Si es una relación IF (Regla <-> Condición)
        if (edgeData?.tipoRelacion === 'IF' && edgeData.condId) {
          try {
            await baseConocimientoService.eliminarCondicion(edgeData.condId);
            setNodes((nds) => nds.filter((n) => n.id !== e.target && n.id !== e.source));
            refetchReglas();
          } catch (err) {
            console.error('Error al eliminar condición:', err);
          }
        }

        // 6. Si es una relación THEN (Condición / Regla <-> Conclusión)
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

  // Eliminar nodos seleccionados del canvas, del editor visual y de la Base de Conocimiento
  const onNodesDelete = useCallback(
    async (nodesToDelete: Node[]) => {
      if (!puedeEliminarNodos || guardandoPosicionesRef.current) return;
      const pendientes = nodesToDelete.filter((n) => !nodosEliminandoRef.current.has(n.id));
      if (!pendientes.length) return;
      pendientes.forEach((n) => nodosEliminandoRef.current.add(n.id));
      setEliminando(true);
      setNodes((nds) => nds.filter((n) => !nodosEliminandoRef.current.has(n.id)));
      setEdges((eds) => eds.filter((e) =>
        !nodosEliminandoRef.current.has(e.source) && !nodosEliminandoRef.current.has(e.target)
      ));
      cerrarPanel();
      try {
        await Promise.all(pendientes.map(async (n) => {
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
        }));
      } finally {
        // Esperar a que ambas consultas reflejen el borrado antes de permitir guardar.
        await Promise.all([refetchHechos(), refetchVariables(), refetchReglas(), refetchEditorVisual(), refetchBase()]);
        pendientes.forEach((n) => nodosEliminandoRef.current.delete(n.id));
        setEliminando(nodosEliminandoRef.current.size > 0);
      }
    },
    [cerrarPanel, refetchHechos, refetchVariables, refetchReglas, refetchEditorVisual, refetchBase, puedeEliminarNodos, setNodes, setEdges]
  );

  // Agregar nuevo nodo individual al lienzo y sincronizarlo con la Base de Conocimiento y el Editor Visual
  const handleAgregarNodo = async (tipo: TipoNodo) => {
    if (!puedeCrearNodos) return;
    if (!effectiveBaseId) {
      console.warn('No hay base de conocimiento disponible aún');
      return;
    }

    const posX = 150 + (nodes.length % 5) * 60;
    const posY = 150 + (nodes.length % 5) * 50;

    try {
      if (tipo === 'HECHO') {
        const nombreDefault = `Hecho_${nodes.filter((n) => n.type === 'HECHO').length + 1}`;
        const nuevoHecho = await baseConocimientoService.crearHecho(effectiveBaseId, {
          nombre: nombreDefault,
          valor: '',
          tipo_dato: 'TEXTO',
          es_inicial: true,
        });

        let visualId: string | undefined;
        try {
          const visual = await editorVisualService.crearNodo(sistemaId, {
            tipo: 'HECHO',
            referencia_id: String(nuevoHecho.id),
            posicion_x: posX,
            posicion_y: posY,
          });
          visualId = visual.id;
        } catch (vErr) {
          console.warn('No se pudo registrar nodo visual en backend:', vErr);
        }

        const newNode: FlowNode = {
          id: `hecho_${nuevoHecho.id}`,
          type: 'HECHO',
          position: { x: posX, y: posY },
          data: {
            id: nuevoHecho.id,
            nodoVisualId: visualId,
            nombre: nuevoHecho.nombre,
            valor: nuevoHecho.valor || '',
            tipo_dato: nuevoHecho.tipo_dato || 'TEXTO',
            es_inicial: Boolean(nuevoHecho.es_inicial),
          },
        };

        setNodes((nds) => [...nds, newNode]);
        seleccionarNodo(newNode);
        refetchHechos();
      } else if (tipo === 'VARIABLE') {
        const nombreDefault = `var_${nodes.filter((n) => n.type === 'VARIABLE').length + 1}`;
        const nuevaVar = await baseConocimientoService.crearVariable(effectiveBaseId, {
          nombre: nombreDefault,
          tipo: 'TEXTO',
          valor_por_defecto: '',
          descripcion: 'Variable del dominio',
        });

        let visualId: string | undefined;
        try {
          const visual = await editorVisualService.crearNodo(sistemaId, {
            tipo: 'VARIABLE',
            referencia_id: String(nuevaVar.id),
            posicion_x: posX,
            posicion_y: posY,
          });
          visualId = visual.id;
        } catch (vErr) {
          console.warn('No se pudo registrar nodo visual en backend:', vErr);
        }

        const newNode: FlowNode = {
          id: `variable_${nuevaVar.id}`,
          type: 'VARIABLE',
          position: { x: posX, y: posY },
          data: {
            id: nuevaVar.id,
            nodoVisualId: visualId,
            nombre: nuevaVar.nombre,
            tipo: nuevaVar.tipo || 'TEXTO',
            valor_por_defecto: nuevaVar.valor_por_defecto || '',
            descripcion: nuevaVar.descripcion || '',
          },
        };

        setNodes((nds) => [...nds, newNode]);
        seleccionarNodo(newNode);
        refetchVariables();
      } else if (tipo === 'REGLA') {
        const nombreDefault = `R_${reglas.length + 1}`;
        const nuevaRegla = await baseConocimientoService.crearRegla(effectiveBaseId, {
          nombre: nombreDefault,
          descripcion: 'Regla del sistema',
          prioridad: 10,
          factor_certeza: 1.0,
          activa: true,
        });

        let visualId: string | undefined;
        try {
          const visual = await editorVisualService.crearNodo(sistemaId, {
            tipo: 'REGLA',
            referencia_id: String(nuevaRegla.id),
            posicion_x: posX,
            posicion_y: posY,
          });
          visualId = visual.id;
        } catch (vErr) {
          console.warn('No se pudo registrar nodo visual en backend:', vErr);
        }

        const newNode: FlowNode = {
          id: `regla_${nuevaRegla.id}`,
          type: 'REGLA',
          position: { x: posX, y: posY },
          data: {
            id: nuevaRegla.id,
            nodoVisualId: visualId,
            nombre: nuevaRegla.nombre,
            descripcion: nuevaRegla.descripcion || '',
            prioridad: nuevaRegla.prioridad ?? 10,
            factor_certeza: Number(nuevaRegla.factor_certeza ?? 1.0),
            activa: nuevaRegla.activa !== false,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        seleccionarNodo(newNode);
        refetchReglas();
      } else if (tipo === 'CONDICION') {
        const targetRegla =
          nodoSeleccionado?.type === 'REGLA'
            ? reglas.find((r) => String(r.id) === String(nodoSeleccionado.data.id))
            : reglas[0];

        let targetReglaId = targetRegla ? String(targetRegla.id) : '';
        if (!targetRegla) {
          const nuevaRegla = await baseConocimientoService.crearRegla(effectiveBaseId, {
            nombre: `R_${reglas.length + 1}`,
            descripcion: 'Regla creada para condición',
            prioridad: 10,
            factor_certeza: 1.0,
            activa: true,
          });
          targetReglaId = String(nuevaRegla.id);
          refetchReglas();
        }

        const localId = `local_${Date.now()}`;
        const newNodeId = `cond_${targetReglaId || 'nueva'}_${localId}`;
        const ordenEstimado = (targetRegla?.condiciones?.length ?? 0) + 1;

        const newNode: FlowNode = {
          id: newNodeId,
          type: 'CONDICION',
          position: { x: posX, y: posY },
          data: {
            id: localId,
            isLocal: true,
            reglaId: targetReglaId,
            referencia: '',
            operador: '==',
            valor_esperado: '',
            orden: ordenEstimado,
          },
        };

        const newEdges: FlowEdge[] = [];
        if (targetReglaId) {
          newEdges.push({
            id: `e_if_${targetReglaId}_${newNode.id}`,
            source: `regla_${targetReglaId}`,
            sourceHandle: 'bottom',
            target: newNode.id,
            targetHandle: 'top',
            type: 'draggable',
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 2.5 },
            label: 'IF',
            labelStyle: { fill: '#b45309', fontWeight: 700, fontSize: 11 },
            labelBgStyle: { fill: '#fef3c7', rx: 6, ry: 6 },
          });
        }

        setNodes((nds) => [...nds, newNode]);
        if (newEdges.length > 0) {
          setEdges((eds) => [...eds, ...newEdges]);
        }
        seleccionarNodo(newNode);
      } else if (tipo === 'CONCLUSION') {
        const targetRegla =
          nodoSeleccionado?.type === 'REGLA'
            ? reglas.find((r) => String(r.id) === String(nodoSeleccionado.data.id))
            : reglas[0];

        let targetReglaId = targetRegla ? String(targetRegla.id) : '';
        if (!targetRegla) {
          const nuevaRegla = await baseConocimientoService.crearRegla(effectiveBaseId, {
            nombre: `R_${reglas.length + 1}`,
            descripcion: 'Regla creada para conclusión',
            prioridad: 10,
            factor_certeza: 1.0,
            activa: true,
          });
          targetReglaId = String(nuevaRegla.id);
          refetchReglas();
        }

        const localId = `local_${Date.now()}`;
        const newNodeId = `concl_${targetReglaId || 'nueva'}_${localId}`;

        const newNode: FlowNode = {
          id: newNodeId,
          type: 'CONCLUSION',
          position: { x: posX, y: posY },
          data: {
            id: localId,
            isLocal: true,
            reglaId: targetReglaId,
            destino: '',
            valor_resultante: '',
          },
        };

        const newEdges: FlowEdge[] = [];
        if (targetReglaId) {
          newEdges.push({
            id: `e_then_${targetReglaId}_${newNode.id}`,
            source: `regla_${targetReglaId}`,
            sourceHandle: 'bottom',
            target: newNode.id,
            targetHandle: 'top',
            type: 'draggable',
            animated: true,
            style: { stroke: '#9333ea', strokeWidth: 2.5 },
            label: 'THEN',
            labelStyle: { fill: '#7e22ce', fontWeight: 700, fontSize: 11 },
            labelBgStyle: { fill: '#f3e8ff', rx: 6, ry: 6 },
          });
        }

        setNodes((nds) => [...nds, newNode]);
        if (newEdges.length > 0) {
          setEdges((eds) => [...eds, ...newEdges]);
        }
        seleccionarNodo(newNode);
      }
    } catch (err) {
      console.error('Error al agregar nodo:', err);
    }
  };

  // Re-sincronizar manualmente todo el grafo desde la Base de Conocimiento y el Editor Visual
  const handleSincronizarManual = async () => {
    setSincronizando(true);
    try {
      const [resBase, resEditor] = await Promise.all([
        refetchBase(),
        refetchEditorVisual(),
      ]);
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
  };

  // Manejar creación rápida de regla completa (IF-THEN)
  const handleReglaRapidaCreada = useCallback(
    async (_reglaCreada: unknown) => {
      setModalReglaRapidaAbierto(false);
      await Promise.all([
        refetchBase(),
        refetchReglas(),
        refetchVariables(),
        refetchHechos(),
        refetchEditorVisual(),
      ]);
      setTimeout(() => fitViewRef.current({ padding: 0.2 }), 300);
    },
    [refetchBase, refetchReglas, refetchVariables, refetchHechos, refetchEditorVisual]
  );

  // Manejar actualización de prioridad desde el panel de orden
  const handleActualizarPrioridad = useCallback(
    async (reglaId: string | number, nuevaPrioridad: number) => {
      try {
        await baseConocimientoService.actualizarRegla(reglaId, {
          prioridad: nuevaPrioridad,
        });
        await refetchReglas();
      } catch (err) {
        console.error('Error al actualizar prioridad de regla:', err);
      }
    },
    [refetchReglas]
  );

  // Seleccionar y enfocar una regla en el lienzo desde el panel de orden
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
    [nodes, seleccionarNodo]
  );

  // Construir los pasos estructurados de trazabilidad FWC por Pasadas Pedagógicas
  const construirPasosWorkflow = useCallback(
    (
      _ejecucion: any,
      vectorIni: HechoVectorItem[],
      todasLasReglas: typeof reglas
    ): PasoWorkflow[] => {
      const pasos: PasoWorkflow[] = [];

      // Mapa auxiliar para resolver nombres de variables y hechos por ID
      const idToName = new Map<string, string>();
      (variables || []).forEach((v) => {
        if (v?.id && v?.nombre) idToName.set(String(v.id), String(v.nombre).trim());
      });
      (hechos || []).forEach((h) => {
        if (h?.id && h?.nombre) idToName.set(String(h.id), String(h.nombre).trim());
      });
      (nodes || []).forEach((n) => {
        if (n.data?.id && n.data?.nombre) {
          idToName.set(String(n.data.id), String(n.data.nombre).trim());
        }
      });

      // Ordenar las reglas por prioridad (descendente) o mantener orden de definición
      const reglasOrdenadas = [...todasLasReglas].sort(
        (a, b) => (b.prioridad ?? 10) - (a.prioridad ?? 10)
      );

      // Base de Hechos inicial
      let bhActual: HechoVectorItem[] = vectorIni.map((h) => ({
        nombre: String(h.nombre).trim(),
        valor: String(h.valor).trim(),
      }));

      const origenPorHecho = new Map<string, string>();
      bhActual.forEach((h) => {
        if (h.nombre) origenPorHecho.set(h.nombre.toLowerCase(), 'Vector BH Inicial (Cliente)');
      });

      const reglasMarcadas = new Set<string>(); // IDs de reglas que ya dispararon
      const reglasMarcadasNombres: string[] = []; // Nombres de reglas para el hito

      let pasadaNumero = 1;
      let pasoContador = 1;
      let contradiccionGlobal: ContradiccionPaso | undefined = undefined;

      const MAX_PASADAS = 25; // Límite de seguridad pedagógico

      while (pasadaNumero <= MAX_PASADAS && !contradiccionGlobal) {
        // La Base de Hechos con la que se evalúa toda la pasada está CONGELADA al inicio de la pasada
        const bhInicioPasada = [...bhActual];
        let huboDisparoEnPasada = false;
        const nuevosHechosDeEstaPasada: Array<{ nombre: string; valor: string; reglaNombre: string }> = [];

        // Evaluar en orden cada una de las reglas
        for (const reglaObj of reglasOrdenadas) {
          const rId = String(reglaObj.id);
          const rNombre = reglaObj.nombre || `Regla ${rId}`;
          const prioridad = reglaObj.prioridad ?? 10;

          // 1. Si la regla ya disparó en una pasada anterior, queda marcada y deshabilitada
          if (reglasMarcadas.has(rId)) {
            pasos.push({
              pasoNumero: pasoContador++,
              vueltaNumero: pasadaNumero,
              pasadaNumero,
              tipoPaso: 'EVALUACION_REGLA',
              reglaId: rId,
              reglaNombre: rNombre,
              prioridad,
              estado: 'DESHABILITADA',
              motivoDescarte: `Regla ya disparada en una pasada anterior. Queda deshabilitada para la Pasada #${pasadaNumero}.`,
              condicionesEvaluadas: [],
              reglasMarcadas: [...reglasMarcadasNombres],
              bhInicioPasada: [...bhInicioPasada],
              memoriaTrabajoSnapshot: [...bhActual],
            });
            continue;
          }

          // 2. Evaluar condiciones contra la Base de Hechos viva (actualizada inmediatamente con deducciones previas)
          const conds = (reglaObj.condiciones || []).map((c: any) => {
            let sujeto = String(c.variable_nombre || c.referencia || c.sujeto || '').trim();
            if (!sujeto && c.variable_id) sujeto = idToName.get(String(c.variable_id)) || '';
            if (!sujeto && c.hecho_id) sujeto = idToName.get(String(c.hecho_id)) || '';
            if (!sujeto && typeof c.variable === 'object' && c.variable) sujeto = String(c.variable.nombre || '').trim();
            if (!sujeto && (c.variable || c.nombre)) sujeto = String(c.variable || c.nombre).trim();

            const operador = c.operador || '=';
            const valorEsperado = String(c.valor_esperado ?? c.valor ?? '').trim();

            // Buscar en la Base de Hechos viva
            const hechoEnBH = bhActual.find(
              (h) => sujeto && h.nombre.toLowerCase() === sujeto.toLowerCase()
            );
            const valorEnBH = hechoEnBH?.valor;

            let cumple = false;
            if (valorEnBH !== undefined) {
              if (operador === '=') cumple = String(valorEnBH).toLowerCase() === valorEsperado.toLowerCase();
              else if (operador === '!=') cumple = String(valorEnBH).toLowerCase() !== valorEsperado.toLowerCase();
              else if (operador === '>') cumple = Number(valorEnBH) > Number(valorEsperado);
              else if (operador === '<') cumple = Number(valorEnBH) < Number(valorEsperado);
              else if (operador === '>=') cumple = Number(valorEnBH) >= Number(valorEsperado);
              else if (operador === '<=') cumple = Number(valorEnBH) <= Number(valorEsperado);
            }

            return {
              sujeto,
              operador,
              valorEsperado,
              valorEnBH,
              cumple,
            };
          });

          const todasCumplen = conds.length > 0 && conds.every((c) => c.cumple);

          if (todasCumplen) {
            // La regla dispara y queda marcada
            huboDisparoEnPasada = true;
            reglasMarcadas.add(rId);
            reglasMarcadasNombres.push(rNombre);

            // Obtener consecuencia deducida
            let hechoProducido: { nombre: string; valor: string } | undefined = undefined;
            if (reglaObj.conclusiones && reglaObj.conclusiones.length > 0) {
              const c0 = reglaObj.conclusiones[0] as any;
              let nombreVar = String(c0.variable_nombre || c0.destino || c0.nombre || '').trim();
              if (!nombreVar && c0.variable_resultante_id) nombreVar = idToName.get(String(c0.variable_resultante_id)) || '';
              if (!nombreVar && c0.hecho_resultante_id) nombreVar = idToName.get(String(c0.hecho_resultante_id)) || '';
              if (!nombreVar && typeof c0.variable === 'object' && c0.variable) nombreVar = String(c0.variable.nombre || '').trim();

              hechoProducido = {
                nombre: nombreVar || 'Deducción',
                valor: String(c0.valor_resultante ?? c0.valor ?? '').trim(),
              };
            }

            let pasoContradiccion: ContradiccionPaso | undefined = undefined;

            if (hechoProducido && hechoProducido.nombre) {
              nuevosHechosDeEstaPasada.push({
                nombre: hechoProducido.nombre,
                valor: hechoProducido.valor,
                reglaNombre: rNombre,
              });

              // Contrastar e incorporar INMEDIATAMENTE a la Base de Hechos viva
              const clave = hechoProducido.nombre.toLowerCase();
              const existenteIdx = bhActual.findIndex((h) => h.nombre.toLowerCase() === clave);

              if (existenteIdx >= 0) {
                const existente = bhActual[existenteIdx];
                if (String(existente.valor).trim().toLowerCase() !== hechoProducido.valor.toLowerCase()) {
                  const origen = origenPorHecho.get(clave) || 'Entrada Inicial';
                  const esCliente = origen.toLowerCase().includes('cliente') || origen.toLowerCase().includes('inicial');
                  pasoContradiccion = {
                    tipo: esCliente ? 'CLIENTE_REGLA' : 'REGLA_REGLA',
                    variable: hechoProducido.nombre,
                    valorAnterior: existente.valor,
                    valorNuevo: hechoProducido.valor,
                    origenAnterior: origen,
                  };
                  contradiccionGlobal = pasoContradiccion;
                }
                // Actualizar de inmediato en BH
                bhActual[existenteIdx] = { nombre: hechoProducido.nombre, valor: hechoProducido.valor };
              } else {
                // Adicionar de inmediato a BH
                bhActual.push({ nombre: hechoProducido.nombre, valor: hechoProducido.valor });
              }
              origenPorHecho.set(clave, `Regla ${rNombre}`);
            }

            pasos.push({
              pasoNumero: pasoContador++,
              vueltaNumero: pasadaNumero,
              pasadaNumero,
              tipoPaso: 'EVALUACION_REGLA',
              reglaId: rId,
              reglaNombre: rNombre,
              prioridad,
              estado: 'EJECUTADA',
              condicionesEvaluadas: conds,
              hechoProducido,
              reglasMarcadas: [...reglasMarcadasNombres],
              bhInicioPasada: [...bhInicioPasada],
              memoriaTrabajoSnapshot: [...bhActual],
              contradiccion: pasoContradiccion,
            });

            // Si se detecta contradicción, detenemos la evaluación de la pasada
            if (pasoContradiccion) {
              break;
            }
          } else {
            // Regla no satisface premisas con la BH actual
            pasos.push({
              pasoNumero: pasoContador++,
              vueltaNumero: pasadaNumero,
              pasadaNumero,
              tipoPaso: 'EVALUACION_REGLA',
              reglaId: rId,
              reglaNombre: rNombre,
              prioridad,
              estado: 'RECHAZADA',
              motivoDescarte: 'Premisas no satisfechas con la Base de Hechos actual.',
              condicionesEvaluadas: conds,
              reglasMarcadas: [...reglasMarcadasNombres],
              bhInicioPasada: [...bhInicioPasada],
              memoriaTrabajoSnapshot: [...bhActual],
            });
          }
        }

        // HITO: Consolidación y Cierre de la Pasada
        pasos.push({
          pasoNumero: pasoContador++,
          vueltaNumero: pasadaNumero,
          pasadaNumero,
          tipoPaso: 'CIERRE_PASADA',
          reglaId: '',
          reglaNombre: `Base de Hechos Resultante (Fin de ${pasadaNumero}ª Pasada)`,
          prioridad: 0,
          estado: 'CIERRE_PASADA',
          condicionesEvaluadas: [],
          nuevosHechosPasada: [...nuevosHechosDeEstaPasada],
          reglasMarcadas: [...reglasMarcadasNombres],
          bhInicioPasada: [...bhInicioPasada],
          memoriaTrabajoSnapshot: [...bhActual],
          contradiccion: contradiccionGlobal,
        });

        if (contradiccionGlobal) {
          // Si hubo contradicción, la inferencia se detiene
          break;
        }

        if (!huboDisparoEnPasada) {
          // No hubo más reglas que dispararan (quiescencia)
          break;
        }

        pasadaNumero++;
      }

      return pasos;
    },
    [variables, hechos, nodes]
  );

  // Aplicar visualmente un paso de la simulación en el lienzo
  const aplicarPasoEnGrafo = useCallback(
    (pasoIdx: number, listaPasos: PasoWorkflow[]) => {
      if (listaPasos.length === 0 || pasoIdx < 0 || pasoIdx >= listaPasos.length) return;
      const paso = listaPasos[pasoIdx];

      const nuevosEstados: Record<string, any> = {};
      for (let i = 0; i < pasoIdx; i++) {
        const p = listaPasos[i];
        if (p.reglaId) {
          nuevosEstados[p.reglaId] = p.estado === 'CIERRE_PASADA' ? 'EJECUTADA' : p.estado;
        }
      }
      if (paso.reglaId) {
        nuevosEstados[paso.reglaId] = 'ANALIZANDO';
      }

      setEstadosInferencia(nuevosEstados);

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.type === 'REGLA') {
            const ruleId = String(n.data.id);
            return {
              ...n,
              data: {
                ...n.data,
                estadoInferencia: nuevosEstados[ruleId] || undefined,
              },
            };
          }
          return n;
        })
      );

      // Centrar cámara suavemente en la regla evaluada (si es un paso de regla)
      if (paso.reglaId) {
        const targetNode = nodes.find(
          (n) => n.id === `regla_${paso.reglaId}` || (n.type === 'REGLA' && String(n.data?.id) === paso.reglaId)
        );
        if (targetNode) {
          fitViewRef.current({ nodes: [targetNode], duration: 400, padding: 0.6 });
        }
      }
    },
    [nodes, setNodes]
  );

  // Ejecución directa estándar de Forward Chaining
  const handleEjecutarInferenciaDirecta = useCallback(async () => {
    if (!sistemaId) return;
    setEjecutandoInferencia(true);
    try {
      const payloadHechos = vectorHechos.map((h) => ({
        nombre: h.nombre,
        valor: h.valor,
      }));

      const ejecucion = await inferenciaService.ejecutar(sistemaId, {
        hechos_iniciales: payloadHechos,
      });

      const pasosConstruidos = construirPasosWorkflow(ejecucion, vectorHechos, reglas);
      setPasosWorkflow(pasosConstruidos);
      setConclusionFinalWorkflow(ejecucion.conclusion_final || null);

      if (pasosConstruidos.length > 0) {
        setPasoActualWorkflowIndex(pasosConstruidos.length - 1);
        const nuevosEstados: Record<string, any> = {};
        pasosConstruidos.forEach((p) => {
          if (p.reglaId) {
            nuevosEstados[p.reglaId] = p.estado;
          }
        });
        setEstadosInferencia(nuevosEstados);

        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            if (n.type === 'REGLA') {
              const ruleId = String(n.data.id);
              return {
                ...n,
                data: {
                  ...n.data,
                  estadoInferencia: nuevosEstados[ruleId] || undefined,
                },
              };
            }
            return n;
          })
        );
      }
    } catch (err) {
      console.error('Error al ejecutar inferencia FWC:', err);
    } finally {
      setEjecutandoInferencia(false);
    }
  }, [sistemaId, vectorHechos, reglas, construirPasosWorkflow, setNodes]);

  // Iniciar la simulación paso a paso interactiva
  const handleIniciarSimulacionPasoAPaso = useCallback(async () => {
    if (!sistemaId) return;
    setEjecutandoInferencia(true);
    try {
      const payloadHechos = vectorHechos.map((h) => ({
        nombre: h.nombre,
        valor: h.valor,
      }));

      const ejecucion = await inferenciaService.ejecutar(sistemaId, {
        hechos_iniciales: payloadHechos,
      });

      const pasosConstruidos = construirPasosWorkflow(ejecucion, vectorHechos, reglas);
      setPasosWorkflow(pasosConstruidos);
      setConclusionFinalWorkflow(ejecucion.conclusion_final || null);

      if (pasosConstruidos.length > 0) {
        setPasoActualWorkflowIndex(0);
        aplicarPasoEnGrafo(0, pasosConstruidos);
      }
    } catch (err) {
      console.error('Error al iniciar simulación FWC:', err);
    } finally {
      setEjecutandoInferencia(false);
    }
  }, [sistemaId, vectorHechos, reglas, construirPasosWorkflow, aplicarPasoEnGrafo]);

  // Cambiar manualmente al paso deseado en el workflow
  const handleCambiarPasoWorkflow = useCallback(
    (nuevoIdx: number) => {
      setPasoActualWorkflowIndex(nuevoIdx);
      aplicarPasoEnGrafo(nuevoIdx, pasosWorkflow);
    },
    [pasosWorkflow, aplicarPasoEnGrafo]
  );

  // Reiniciar la simulación y limpiar estados visuales
  const handleReiniciarSimulacion = useCallback(() => {
    setPasosWorkflow([]);
    setPasoActualWorkflowIndex(0);
    setConclusionFinalWorkflow(null);
    setEstadosInferencia({});
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.type === 'REGLA') {
          return {
            ...n,
            data: {
              ...n.data,
              estadoInferencia: undefined,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Guardar cambios de propiedades de un nodo en el backend
  const handleGuardarPropiedades = async (
    nodoId: string,
    nuevosDatos: Partial<NodoDatosGenerales>
  ) => {
    if (!puedeEditarNodos) return;
    setGuardando(true);
    try {
      const targetNode = nodes.find((n) => n.id === nodoId);
      const entidadId = targetNode?.data?.id;
      const tipo = targetNode?.type;

      // Si vienen condiciones y conclusiones (desde PanelPropiedadesRegla), mapearlas a la tarjeta Todo-en-Uno
      const rawConds = (nuevosDatos as Record<string, unknown>).condiciones as CondicionItemInput[] | undefined;
      const rawConcls = (nuevosDatos as Record<string, unknown>).conclusiones as ConclusionItemInput[] | undefined;

      const condsLista = Array.isArray(rawConds)
        ? rawConds.map((c) => ({
            sujeto: c.variable_nombre || 'Dato',
            operador: c.operador,
            valor: c.valor_esperado,
          }))
        : undefined;

      const conclsLista = Array.isArray(rawConcls)
        ? rawConcls.map((c) => ({
            destino: c.variable_nombre || 'Meta',
            valor: c.valor_resultante,
          }))
        : undefined;

      // 1. Actualizar estado local inmediatamente para reactividad fluida
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodoId) {
            return {
              ...n,
              data: {
                ...n.data,
                ...nuevosDatos,
                ...(condsLista ? { condicionesLista: condsLista } : {}),
                ...(conclsLista ? { conclusionesLista: conclsLista } : {}),
              },
            };
          }
          return n;
        })
      );
      actualizarDatosNodoSeleccionado({
        ...nuevosDatos,
        ...(condsLista ? { condicionesLista: condsLista } : {}),
        ...(conclsLista ? { conclusionesLista: conclsLista } : {}),
      });

      // 2. Persistir en backend según el tipo de entidad
      const isLocal = Boolean(targetNode?.data?.isLocal || String(entidadId).startsWith('local_'));

      if (isLocal) {
        if (tipo === 'CONDICION') {
          const targetReglaId = String(nuevosDatos.reglaId || targetNode?.data?.reglaId || (reglas[0]?.id ?? ''));
          if (!targetReglaId) {
            console.warn('No hay regla asociada para la condición');
            return;
          }

          const nuevaCond = await baseConocimientoService.agregarCondicion(targetReglaId, {
            operador: nuevosDatos.operador || '==',
            valor_esperado: String(nuevosDatos.valor_esperado ?? ''),
            orden: Number(nuevosDatos.orden ?? 1),
            variable_id: nuevosDatos.variable_id ?? null,
            hecho_id: nuevosDatos.hecho_id ?? null,
            referencia: nuevosDatos.referencia,
          });

          let visualId: string | undefined;
          try {
            const visual = await editorVisualService.crearNodo(sistemaId, {
              tipo: 'CONDICION',
              referencia_id: String(nuevaCond.id),
              posicion_x: targetNode?.position.x ?? 150,
              posicion_y: targetNode?.position.y ?? 250,
            });
            visualId = visual.id;
          } catch (vErr) {
            console.warn('No se pudo registrar nodo visual en backend:', vErr);
          }

          const newId = `cond_${targetReglaId}_${nuevaCond.id}`;

          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === nodoId) {
                return {
                  ...n,
                  id: newId,
                  data: {
                    ...n.data,
                    ...nuevosDatos,
                    id: nuevaCond.id,
                    isLocal: false,
                    nodoVisualId: visualId,
                    reglaId: targetReglaId,
                    referencia: nuevosDatos.referencia || nuevaCond.referencia || 'condición',
                    operador: nuevaCond.operador || nuevosDatos.operador || '==',
                    valor_esperado: String(nuevaCond.valor_esperado ?? nuevosDatos.valor_esperado ?? ''),
                    orden: nuevaCond.orden ?? nuevosDatos.orden ?? 1,
                    variable_id: nuevaCond.variable_id ?? nuevosDatos.variable_id,
                    hecho_id: nuevaCond.hecho_id ?? nuevosDatos.hecho_id,
                  },
                };
              }
              return n;
            })
          );

          setEdges((eds) => {
            let hasRuleEdge = false;
            const updated = eds.map((e) => {
              const edge = { ...e };
              if (edge.target === nodoId) edge.target = newId;
              if (edge.source === nodoId) edge.source = newId;
              if (edge.source === `regla_${targetReglaId}` && edge.target === newId) {
                hasRuleEdge = true;
              }
              return edge;
            });

            if (!hasRuleEdge) {
              updated.push({
                id: `e_if_${targetReglaId}_${newId}`,
                source: `regla_${targetReglaId}`,
                sourceHandle: 'bottom',
                target: newId,
                targetHandle: 'top',
                type: 'draggable',
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2.5 },
                label: 'IF',
                labelStyle: { fill: '#b45309', fontWeight: 700, fontSize: 11 },
                labelBgStyle: { fill: '#fef3c7', rx: 6, ry: 6 },
              });
            }

            const relNodeId = nuevosDatos.variable_id
              ? `variable_${nuevosDatos.variable_id}`
              : nuevosDatos.hecho_id
              ? `hecho_${nuevosDatos.hecho_id}`
              : null;

            if (relNodeId && !updated.some((e) => (e.source === relNodeId && e.target === newId) || (e.source === newId && e.target === relNodeId))) {
              updated.push({
                id: `e_${relNodeId}_${newId}`,
                source: relNodeId,
                target: newId,
                sourceHandle: 'right-out',
                targetHandle: 'left-in',
                label: 'EVALÚA',
                animated: true,
                type: 'draggable',
                style: { stroke: nuevosDatos.hecho_id ? '#10b981' : '#0284c7', strokeWidth: 2 },
                labelStyle: { fill: nuevosDatos.hecho_id ? '#064e3b' : '#075985', fontWeight: 700, fontSize: 8 },
                labelBgStyle: {
                  fill: nuevosDatos.hecho_id ? '#d1fae5' : '#e0f2fe',
                  stroke: nuevosDatos.hecho_id ? '#10b981' : '#0284c7',
                  strokeWidth: 1,
                  rx: 4,
                  ry: 4,
                },
              });
            }

            return updated;
          });

          seleccionarNodo({
            id: newId,
            type: 'CONDICION',
            position: targetNode?.position ?? { x: 150, y: 250 },
            data: {
              ...targetNode?.data,
              ...nuevosDatos,
              id: nuevaCond.id,
              isLocal: false,
              nodoVisualId: visualId,
              reglaId: targetReglaId,
            },
          });

          refetchReglas();
        } else if (tipo === 'CONCLUSION') {
          const targetReglaId = String(nuevosDatos.reglaId || targetNode?.data?.reglaId || (reglas[0]?.id ?? ''));
          if (!targetReglaId) {
            console.warn('No hay regla asociada para la conclusión');
            return;
          }

          const nuevaConcl = await baseConocimientoService.agregarConclusion(targetReglaId, {
            valor_resultante: String(nuevosDatos.valor_resultante ?? ''),
            variable_resultante_id: nuevosDatos.variable_resultante_id ?? null,
            hecho_resultante_id: nuevosDatos.hecho_resultante_id ?? null,
            destino: nuevosDatos.destino,
          });

          let visualId: string | undefined;
          try {
            const visual = await editorVisualService.crearNodo(sistemaId, {
              tipo: 'CONCLUSION',
              referencia_id: String(nuevaConcl.id),
              posicion_x: targetNode?.position.x ?? 150,
              posicion_y: targetNode?.position.y ?? 440,
            });
            visualId = visual.id;
          } catch (vErr) {
            console.warn('No se pudo registrar nodo visual en backend:', vErr);
          }

          const newId = `concl_${targetReglaId}_${nuevaConcl.id}`;

          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === nodoId) {
                return {
                  ...n,
                  id: newId,
                  data: {
                    ...n.data,
                    ...nuevosDatos,
                    id: nuevaConcl.id,
                    isLocal: false,
                    nodoVisualId: visualId,
                    reglaId: targetReglaId,
                    destino: nuevosDatos.destino || nuevaConcl.destino || 'conclusión',
                    valor_resultante: String(nuevaConcl.valor_resultante ?? nuevosDatos.valor_resultante ?? ''),
                    variable_resultante_id: nuevaConcl.variable_resultante_id ?? nuevosDatos.variable_resultante_id,
                    hecho_resultante_id: nuevaConcl.hecho_resultante_id ?? nuevosDatos.hecho_resultante_id,
                  },
                };
              }
              return n;
            })
          );

          setEdges((eds) => {
            let hasRuleEdge = false;
            const updated = eds.map((e) => {
              const edge = { ...e };
              if (edge.target === nodoId) edge.target = newId;
              if (edge.source === nodoId) edge.source = newId;
              if (edge.source === `regla_${targetReglaId}` && edge.target === newId) {
                hasRuleEdge = true;
              }
              return edge;
            });

            if (!hasRuleEdge) {
              updated.push({
                id: `e_then_${targetReglaId}_${newId}`,
                source: `regla_${targetReglaId}`,
                sourceHandle: 'bottom',
                target: newId,
                targetHandle: 'top',
                type: 'draggable',
                animated: true,
                style: { stroke: '#9333ea', strokeWidth: 2.5 },
                label: 'THEN',
                labelStyle: { fill: '#7e22ce', fontWeight: 700, fontSize: 11 },
                labelBgStyle: { fill: '#f3e8ff', rx: 6, ry: 6 },
              });
            }

            const targetRelId = nuevosDatos.variable_resultante_id
              ? `variable_${nuevosDatos.variable_resultante_id}`
              : nuevosDatos.hecho_resultante_id
              ? `hecho_${nuevosDatos.hecho_resultante_id}`
              : null;

            if (targetRelId && !updated.some((e) => (e.source === newId && e.target === targetRelId) || (e.source === targetRelId && e.target === newId))) {
              updated.push({
                id: `e_${newId}_${targetRelId}`,
                source: newId,
                target: targetRelId,
                sourceHandle: 'bottom',
                targetHandle: 'top',
                label: 'ACTUALIZA',
                animated: true,
                type: 'draggable',
                style: { stroke: '#9333ea', strokeWidth: 2, strokeDasharray: '4 4' },
                labelStyle: { fill: '#581c87', fontWeight: 700, fontSize: 8 },
                labelBgStyle: {
                  fill: '#f3e8ff',
                  stroke: '#9333ea',
                  strokeWidth: 1,
                  rx: 4,
                  ry: 4,
                },
              });
            }

            return updated;
          });

          seleccionarNodo({
            id: newId,
            type: 'CONCLUSION',
            position: targetNode?.position ?? { x: 150, y: 440 },
            data: {
              ...targetNode?.data,
              ...nuevosDatos,
              id: nuevaConcl.id,
              isLocal: false,
              nodoVisualId: visualId,
              reglaId: targetReglaId,
            },
          });

          refetchReglas();
        }
      } else if (entidadId && !String(entidadId).startsWith('temp_') && !String(entidadId).startsWith('local_')) {
        if (tipo === 'HECHO') {
          await baseConocimientoService.actualizarHecho(entidadId, {
            nombre: nuevosDatos.nombre,
            valor: nuevosDatos.valor,
            tipo_dato: nuevosDatos.tipo_dato as TipoDato,
            es_inicial: nuevosDatos.es_inicial,
          });
          refetchHechos();
        } else if (tipo === 'VARIABLE') {
          await baseConocimientoService.actualizarVariable(entidadId, {
            nombre: nuevosDatos.nombre,
            tipo: nuevosDatos.tipo as TipoDato,
            valor_por_defecto: nuevosDatos.valor_por_defecto,
            descripcion: nuevosDatos.descripcion,
          });
          refetchVariables();
        } else if (tipo === 'REGLA') {
          if (rawConds !== undefined || rawConcls !== undefined) {
            await baseConocimientoService.actualizarReglaCompleta(entidadId, {
              nombre: nuevosDatos.nombre || 'Regla',
              descripcion: nuevosDatos.descripcion,
              prioridad: nuevosDatos.prioridad ?? 10,
              factor_certeza: nuevosDatos.factor_certeza !== undefined ? Number(nuevosDatos.factor_certeza) : undefined,
              activa: nuevosDatos.activa !== false,
              condiciones: rawConds || [],
              conclusiones: rawConcls || [],
            });
          } else {
            await baseConocimientoService.actualizarRegla(entidadId, {
              nombre: nuevosDatos.nombre,
              descripcion: nuevosDatos.descripcion,
              prioridad: nuevosDatos.prioridad,
              factor_certeza: nuevosDatos.factor_certeza !== undefined ? Number(nuevosDatos.factor_certeza) : undefined,
              activa: nuevosDatos.activa,
            });
          }
          refetchReglas();
          refetchVariables();
        } else if (tipo === 'CONDICION') {
          await baseConocimientoService.actualizarCondicion(entidadId, {
            operador: nuevosDatos.operador,
            valor_esperado: nuevosDatos.valor_esperado,
            orden: nuevosDatos.orden,
            hecho_id: nuevosDatos.hecho_id,
            variable_id: nuevosDatos.variable_id,
          });
          refetchReglas();
        } else if (tipo === 'CONCLUSION') {
          await baseConocimientoService.actualizarConclusion(entidadId, {
            valor_resultante: nuevosDatos.valor_resultante,
            hecho_resultante_id: nuevosDatos.hecho_resultante_id,
            variable_resultante_id: nuevosDatos.variable_resultante_id,
          });
          refetchReglas();
        }
      }
    } catch (err) {
      console.error('Error al actualizar propiedades:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar nodo desde el panel lateral
  const handleEliminarNodo = async (nodoId: string) => {
    const targetNode = nodes.find((n) => n.id === nodoId);
    if (targetNode) await onNodesDelete([targetNode]);
  };

  // Guardar todas las posiciones actuales de los nodos y relaciones en localStorage y backend
  const handleGuardarPosiciones = async () => {
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

      // Guardar puntos de control de las curvas de las relaciones
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

      // Sincronizar coordenadas en el backend Django
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
            setNodes((nds) => nds.map((n) => n.id === node.id
              ? { ...n, data: { ...n.data, nodoVisualId: visualCreado.id } }
              : n
            ));
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
  };

  // Reorganizar automáticamente el grafo al diseño pedagógico (Regla -> IF -> Condición -> THEN -> Conclusión)
  const handleReorganizarGrafo = () => {
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
  };

  // SPINNER DE CARGA AL ENTRAR A LA VISTA
  if (isCargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400">
        <div className="p-8 bg-white rounded-xl shadow-xs border border-stone-200 flex flex-col items-center max-w-sm text-center space-y-4">
          <Spinner size="lg" className="text-teal-700" />
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Sincronizando con la Base de Conocimiento
            </h3>
            <p className="text-xs text-stone-500 mt-1">
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
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
            className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-white transition-colors cursor-pointer"
            title="Volver al detalle"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-teal-700" />
              Editor Visual — {sistema?.nombre || 'Sistema Experto'}
            </h2>
            <p className="text-[11px] text-stone-500">
              Sincronizado automáticamente con la Base de Conocimiento: Hechos, Variables, Condiciones y Reglas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Permiso permisos={[Permisos.BASE_CONOCIMIENTO_VER]}><Button
            variant="outline"
            size="sm"
            icon={<Database className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
          >
            Base C.
          </Button></Permiso>
          <Permiso permisos={[Permisos.INFERENCIA_EJECUTAR]}><Button
            variant="outline"
            size="sm"
            icon={<PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/inferencia`)}
          >
            Inferencia
          </Button></Permiso>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="shrink-0 space-y-2">
        <EditorToolbar
          modoEditor={modoEditor}
          onChangeModoEditor={setModoEditor}
          vistaModo={vistaModo}
          onChangeVistaModo={handleCambiarVistaModo}
          onAgregarNodo={handleAgregarNodo}
          onGuardarPosiciones={handleGuardarPosiciones}
          onCentrarVista={() => fitView({ padding: 0.2 })}
          onSincronizar={handleSincronizarManual}
          onReorganizar={handleReorganizarGrafo}
          sincronizando={sincronizando}
          guardando={guardando || eliminando}
          onAbrirModalReglaRapida={() => setModalReglaRapidaAbierto(true)}
          onAbrirModalPseudocodigo={() => setModalPseudocodigoAbierto(true)}
          mostrarPanelOrden={mostrarPanelOrden}
          onTogglePanelOrden={() => setMostrarPanelOrden((prev) => !prev)}
          mostrarVectorHechos={mostrarVectorHechos}
          onToggleVectorHechos={() => setMostrarVectorHechos((prev) => !prev)}
        />

        {/* En Modo Simulación: Barra Vector BH y Panel de Workflow HUD */}
        {modoEditor === 'SIMULACION' && (
          <div className="space-y-2">
            {mostrarVectorHechos && (
              <BarraVectorHechos
                hechos={vectorHechos}
                onActualizarHechos={setVectorHechos}
                onEjecutarInferencia={handleEjecutarInferenciaDirecta}
                ejecutando={ejecutandoInferencia}
                sugerenciasVariables={variables.map((v) => v.nombre)}
                totalReglas={reglas.length}
              />
            )}

            <PanelWorkflowInferencia
              pasos={pasosWorkflow}
              pasoActualIndex={pasoActualWorkflowIndex}
              onCambiarPaso={handleCambiarPasoWorkflow}
              onEjecutarDirecto={handleEjecutarInferenciaDirecta}
              onIniciarPasoAPaso={handleIniciarSimulacionPasoAPaso}
              onReiniciar={handleReiniciarSimulacion}
              onEnfocarRegla={(rId) => handleSeleccionarRegla(rId)}
              ejecutando={ejecutandoInferencia}
              conclusionFinal={conclusionFinalWorkflow}
              modoEjecucion={modoEjecucionWorkflow}
              onCambiarModoEjecucion={setModoEjecucionWorkflow}
            />
          </div>
        )}

        {/* En Modo Diseño: Barra Vector BH si está activado el toggle */}
        {modoEditor === 'DISENO' && mostrarVectorHechos && (
          <BarraVectorHechos
            hechos={vectorHechos}
            onActualizarHechos={setVectorHechos}
            onEjecutarInferencia={handleEjecutarInferenciaDirecta}
            ejecutando={ejecutandoInferencia}
            sugerenciasVariables={variables.map((v) => v.nombre)}
            totalReglas={reglas.length}
          />
        )}
      </div>

      {/* Contenedor del Lienzo React Flow + Panel Lateral */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner relative overflow-hidden flex">
        {/* Panel lateral retráctil de orden de evaluación de reglas */}
        <PanelOrdenReglas
          reglas={reglas}
          isOpen={mostrarPanelOrden}
          onClose={() => setMostrarPanelOrden(false)}
          onSeleccionarRegla={handleSeleccionarRegla}
          onActualizarPrioridad={handleActualizarPrioridad}
        />

        <div className="flex-1 h-full w-full relative">
          {/* Indicador flotante cuando se sincroniza manualmente */}
          {sincronizando && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-stone-200 px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-xs font-medium text-stone-700">
              <Spinner size="sm" className="text-teal-700" />
              <span>Sincronizando grafo con la Base de Conocimiento...</span>
            </div>
          )}

          {/* Estado vacío sugerente si no hay elementos */}
          {nodes.length === 0 && !isCargando && !sincronizando && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm text-center max-w-sm pointer-events-auto space-y-3">
                <Database className="w-10 h-10 text-stone-400 mx-auto" />
                <h4 className="font-bold text-stone-800 text-sm">Base de Conocimiento Vacía</h4>
                <p className="text-xs text-stone-500">
                  Agrega hechos, variables y reglas en la Base de Conocimiento o utiliza el botón <strong>+ Regla Rápida</strong> para diseñar el sistema.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalReglaRapidaAbierto(true)}
                  >
                    + Crear Primera Regla
                  </Button>
                  <Permiso permisos={[Permisos.BASE_CONOCIMIENTO_VER]}><Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
                  >
                    Ir a Base de C.
                  </Button></Permiso>
                </div>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => onNodesChange(changes.filter(change =>
              (change.type !== 'position' || puedeEditarNodos) && (change.type !== 'remove' || puedeEliminarNodos)
            ))}
            onEdgesChange={(changes) => onEdgesChange(changes.filter(change => change.type !== 'remove' || puedeEliminarConexiones))}
            nodesDraggable={puedeEditarNodos}
            nodesConnectable={puedeCrearConexiones}
            onBeforeDelete={async ({ nodes: deletingNodes, edges: deletingEdges }) =>
              !guardandoPosicionesRef.current &&
              (!deletingNodes.length || puedeEliminarNodos) && (!deletingEdges.length || puedeEliminarConexiones)
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

        {/* Panel lateral derecho de propiedades */}
        <PanelPropiedades
          onGuardarPropiedades={handleGuardarPropiedades}
          onEliminarNodo={handleEliminarNodo}
          guardando={guardando}
          variables={variables}
          hechos={hechos}
          reglas={reglas}
        />
      </div>

      {/* Modal de Creación Rápida de Reglas IF-THEN con correlativo semiautomático */}
      {effectiveBaseId && (
        <CrearReglaRapidaModal
          isOpen={modalReglaRapidaAbierto}
          onClose={() => setModalReglaRapidaAbierto(false)}
          baseConocimientoId={effectiveBaseId}
          onReglaCreada={handleReglaRapidaCreada}
          variablesExistentes={variables}
          hechosExistentes={hechos}
          siguienteNumeroRegla={siguienteNumeroRegla}
        />
      )}

      {/* Modal de Edición de Reglas por Pseudocódigo / DSL */}
      {effectiveBaseId && (
        <EditorPseudocodigoModal
          isOpen={modalPseudocodigoAbierto}
          onClose={() => setModalPseudocodigoAbierto(false)}
          baseConocimientoId={effectiveBaseId}
          reglasActuales={reglas}
          variablesExistentes={variables}
          onReglasActualizadas={async () => {
            await Promise.all([refetchReglas(), refetchVariables(), refetchHechos()]);
          }}
        />
      )}
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
