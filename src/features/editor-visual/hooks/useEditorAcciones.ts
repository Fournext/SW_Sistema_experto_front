import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import baseConocimientoService from '@/features/base-conocimiento/services/baseConocimientoService';
import type {
  ConclusionItemInput,
  CondicionItemInput,
  Regla,
  TipoDato,
} from '@/features/base-conocimiento/types/types';
import editorVisualService from '../services/editorVisualService';
import type { FlowEdge, FlowNode, NodoDatosGenerales, TipoNodo } from '../types/types';

interface UseEditorAccionesParams {
  sistemaId: string;
  effectiveBaseId?: string | number;
  reglas: Regla[];
  nodes: FlowNode[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>;
  nodoSeleccionado: FlowNode | null;
  seleccionarNodo: (node: FlowNode) => void;
  actualizarDatosNodoSeleccionado: (datos: Partial<NodoDatosGenerales>) => void;
  puedeCrearNodos: boolean;
  puedeEditarNodos: boolean;
  setGuardando: React.Dispatch<React.SetStateAction<boolean>>;
  onNodesDelete: (nodesToDelete: Node[]) => Promise<void>;
  refetchBase: () => Promise<any>;
  refetchHechos: () => Promise<any>;
  refetchVariables: () => Promise<any>;
  refetchReglas: () => Promise<any>;
  refetchEditorVisual: () => Promise<any>;
  fitViewRef: React.MutableRefObject<any>;
  setModalReglaRapidaAbierto: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useEditorAcciones({
  sistemaId,
  effectiveBaseId,
  reglas,
  nodes,
  setNodes,
  setEdges,
  nodoSeleccionado,
  seleccionarNodo,
  actualizarDatosNodoSeleccionado,
  puedeCrearNodos,
  puedeEditarNodos,
  setGuardando,
  onNodesDelete,
  refetchBase,
  refetchHechos,
  refetchVariables,
  refetchReglas,
  refetchEditorVisual,
  fitViewRef,
  setModalReglaRapidaAbierto,
}: UseEditorAccionesParams) {
  const handleAgregarNodo = useCallback(
    async (tipo: TipoNodo) => {
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
    },
    [
      puedeCrearNodos,
      effectiveBaseId,
      nodes,
      sistemaId,
      reglas,
      nodoSeleccionado,
      setNodes,
      setEdges,
      seleccionarNodo,
      refetchHechos,
      refetchVariables,
      refetchReglas,
    ]
  );

  const handleGuardarPropiedades = useCallback(
    async (nodoId: string, nuevosDatos: Partial<NodoDatosGenerales>) => {
      if (!puedeEditarNodos) return;
      setGuardando(true);
      try {
        const targetNode = nodes.find((n) => n.id === nodoId);
        const entidadId = targetNode?.data?.id;
        const tipo = targetNode?.type;

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

              if (
                relNodeId &&
                !updated.some(
                  (e) =>
                    (e.source === relNodeId && e.target === newId) ||
                    (e.source === newId && e.target === relNodeId)
                )
              ) {
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
                      variable_resultante_id:
                        nuevaConcl.variable_resultante_id ?? nuevosDatos.variable_resultante_id,
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

              if (
                targetRelId &&
                !updated.some(
                  (e) =>
                    (e.source === newId && e.target === targetRelId) ||
                    (e.source === targetRelId && e.target === newId)
                )
              ) {
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
            const rawExprLogica = (nuevosDatos as Record<string, unknown>).expresion_logica as string | null | undefined;
            if (rawConds !== undefined || rawConcls !== undefined) {
              await baseConocimientoService.actualizarReglaCompleta(entidadId, {
                nombre: nuevosDatos.nombre || 'Regla',
                descripcion: nuevosDatos.descripcion,
                prioridad: nuevosDatos.prioridad ?? 10,
                factor_certeza:
                  nuevosDatos.factor_certeza !== undefined ? Number(nuevosDatos.factor_certeza) : undefined,
                activa: nuevosDatos.activa !== false,
                expresion_logica: rawExprLogica !== undefined ? (rawExprLogica || undefined) : undefined,
                condiciones: rawConds || [],
                conclusiones: rawConcls || [],
              });
            } else {
              await baseConocimientoService.actualizarRegla(entidadId, {
                nombre: nuevosDatos.nombre,
                descripcion: nuevosDatos.descripcion,
                prioridad: nuevosDatos.prioridad,
                factor_certeza:
                  nuevosDatos.factor_certeza !== undefined ? Number(nuevosDatos.factor_certeza) : undefined,
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
    },
    [
      puedeEditarNodos,
      setGuardando,
      nodes,
      setNodes,
      setEdges,
      actualizarDatosNodoSeleccionado,
      reglas,
      sistemaId,
      seleccionarNodo,
      refetchReglas,
      refetchHechos,
      refetchVariables,
    ]
  );

  const handleEliminarNodo = useCallback(
    async (nodoId: string) => {
      const targetNode = nodes.find((n) => n.id === nodoId);
      if (targetNode) await onNodesDelete([targetNode]);
    },
    [nodes, onNodesDelete]
  );

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
    [
      setModalReglaRapidaAbierto,
      refetchBase,
      refetchReglas,
      refetchVariables,
      refetchHechos,
      refetchEditorVisual,
      fitViewRef,
    ]
  );

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

  return {
    handleAgregarNodo,
    handleGuardarPropiedades,
    handleEliminarNodo,
    handleReglaRapidaCreada,
    handleActualizarPrioridad,
  };
}

