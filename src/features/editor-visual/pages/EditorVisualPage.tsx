import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useEditorMutations, useEditorVisual } from '../hooks/useEditorVisual';
import baseConocimientoService from '@/features/base-conocimiento/services/baseConocimientoService';
import editorVisualService from '../services/editorVisualService';
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
import type { TipoDato } from '@/features/base-conocimiento/types/types';

// Tipos de aristas personalizados para permitir mover y desviar relaciones con el mouse
const edgeTypes = {
  draggable: DraggableEdge,
};

// Constante inmutable a nivel de módulo para evitar re-renderizados innecesarios
const EMPTY_ARRAY: never[] = [];

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

  const hechos = useMemo(() => {
    return baseConocimiento?.hechos && baseConocimiento.hechos.length > 0
      ? baseConocimiento.hechos
      : fetchedHechos || EMPTY_ARRAY;
  }, [baseConocimiento?.hechos, fetchedHechos]);

  const variables = useMemo(() => {
    return baseConocimiento?.variables && baseConocimiento.variables.length > 0
      ? baseConocimiento.variables
      : fetchedVars || EMPTY_ARRAY;
  }, [baseConocimiento?.variables, fetchedVars]);

  const reglas = useMemo(() => {
    return baseConocimiento?.reglas && baseConocimiento.reglas.length > 0
      ? baseConocimiento.reglas
      : fetchedReglas || EMPTY_ARRAY;
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
  const [sincronizando, setSincronizando] = useState(false);
  const yaInicializadoRef = useRef(false);

  // Sincronización automática de la Base de Conocimiento al entrar a la vista o actualizar datos
  useEffect(() => {
    if (!isCargando) {
      let posicionesGuardadas: Record<string, { x: number; y: number }> = {};
      let savedEdgePoints: Record<string, { x: number; y: number }> = {};

      try {
        const saved =
          localStorage.getItem(`editor_pos_v2_${sistemaId}`) ||
          localStorage.getItem(`editor_pos_${sistemaId}`);
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
        nodosVisuales
      );

      setNodes(nuevosNodos);
      setEdges(nuevasEdges);

      if (!yaInicializadoRef.current) {
        yaInicializadoRef.current = true;
        setTimeout(() => fitViewRef.current({ padding: 0.2 }), 250);
      }
    }
  }, [isCargando, hechos, variables, reglas, nodosVisuales, sistemaId]);

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
    [nodes, setEdges, crearConexion, refetchReglas]
  );

  // Re-conectar extremo de relación arrastrándolo a otro handle con el ratón
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  // Eliminar conexiones y desvincular relaciones del dominio
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
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
    [sistemaId, refetchReglas, setNodes]
  );

  // Eliminar nodos seleccionados del canvas, del editor visual y de la Base de Conocimiento
  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach(async (n) => {
        const fn = n as FlowNode;
        const visualId = fn.data?.nodoVisualId;
        const entidadId = fn.data?.id;
        const tipo = fn.type;

        if (visualId && !String(visualId).startsWith('temp_') && !String(visualId).startsWith('local_')) {
          try {
            await editorVisualService.eliminarNodo(visualId);
          } catch {
            // ignore
          }
        }

        if (entidadId && !String(entidadId).startsWith('temp_') && !String(entidadId).startsWith('local_')) {
          try {
            if (tipo === 'HECHO') {
              await baseConocimientoService.eliminarHecho(entidadId);
              refetchHechos();
            } else if (tipo === 'VARIABLE') {
              await baseConocimientoService.eliminarVariable(entidadId);
              refetchVariables();
            } else if (tipo === 'REGLA') {
              await baseConocimientoService.eliminarRegla(entidadId);
              refetchReglas();
            } else if (tipo === 'CONDICION') {
              await baseConocimientoService.eliminarCondicion(entidadId);
              refetchReglas();
            } else if (tipo === 'CONCLUSION') {
              await baseConocimientoService.eliminarConclusion(entidadId);
              refetchReglas();
            }
          } catch (err) {
            console.error('Error al eliminar elemento de la base de conocimiento:', err);
          }
        }
      });
      cerrarPanel();
    },
    [cerrarPanel, refetchHechos, refetchVariables, refetchReglas]
  );

  // Agregar nuevo nodo individual al lienzo y sincronizarlo con la Base de Conocimiento y el Editor Visual
  const handleAgregarNodo = async (tipo: TipoNodo) => {
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
          valor: 'true',
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
          localStorage.getItem(`editor_pos_v2_${sistemaId}`) ||
          localStorage.getItem(`editor_pos_${sistemaId}`);
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
        resEditor.data?.backendData?.nodos
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

  // Guardar cambios de propiedades de un nodo en el backend
  const handleGuardarPropiedades = async (
    nodoId: string,
    nuevosDatos: Partial<NodoDatosGenerales>
  ) => {
    setGuardando(true);
    try {
      const targetNode = nodes.find((n) => n.id === nodoId);
      const entidadId = targetNode?.data?.id;
      const tipo = targetNode?.type;

      // 1. Actualizar estado local inmediatamente para reactividad fluida
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
      actualizarDatosNodoSeleccionado(nuevosDatos);

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
          await baseConocimientoService.actualizarRegla(entidadId, {
            nombre: nuevosDatos.nombre,
            descripcion: nuevosDatos.descripcion,
            prioridad: nuevosDatos.prioridad,
            factor_certeza: nuevosDatos.factor_certeza !== undefined ? Number(nuevosDatos.factor_certeza) : undefined,
            activa: nuevosDatos.activa,
          });
          refetchReglas();
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
    const visualId = targetNode?.data?.nodoVisualId;
    const entidadId = targetNode?.data?.id;
    const tipo = targetNode?.type;

    setNodes((nds) => nds.filter((n) => n.id !== nodoId));
    setEdges((eds) => eds.filter((e) => e.source !== nodoId && e.target !== nodoId));
    cerrarPanel();

    try {
      if (visualId && !String(visualId).startsWith('temp_') && !String(visualId).startsWith('local_')) {
        await editorVisualService.eliminarNodo(visualId);
      }
      if (entidadId && !String(entidadId).startsWith('temp_') && !String(entidadId).startsWith('local_')) {
        if (tipo === 'HECHO') {
          await baseConocimientoService.eliminarHecho(entidadId);
          refetchHechos();
        } else if (tipo === 'VARIABLE') {
          await baseConocimientoService.eliminarVariable(entidadId);
          refetchVariables();
        } else if (tipo === 'REGLA') {
          await baseConocimientoService.eliminarRegla(entidadId);
          refetchReglas();
        } else if (tipo === 'CONDICION') {
          await baseConocimientoService.eliminarCondicion(entidadId);
          refetchReglas();
        } else if (tipo === 'CONCLUSION') {
          await baseConocimientoService.eliminarConclusion(entidadId);
          refetchReglas();
        }
      }
    } catch (err) {
      console.error('Error al eliminar elemento:', err);
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
            node.data.nodoVisualId = visualCreado.id;
          } catch {
            // ignore
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
  if (isCargando) {
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
          {nodes.length === 0 && !isCargando && !sincronizando && (
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
          variables={variables}
          hechos={hechos}
          reglas={reglas}
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
