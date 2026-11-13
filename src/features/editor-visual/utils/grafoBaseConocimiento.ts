import type { FlowNode, FlowEdge, NodoVisualBackend } from '../types/types';
import type { Hecho, Variable, Regla } from '@/features/base-conocimiento/types/types';
import { extraerAtomosDeExpresion } from './evaluadorLogicaPremisas';

export interface GrafoResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const safeStr = (val: unknown, fallback = ''): string => {
  if (val === undefined || val === null) return fallback;
  return String(val).trim();
};

/**
 * Transforma los hechos, variables y reglas de la Base de Conocimiento en el grafo pedagógico del Editor Visual:
 *
 * Muestra las Reglas como Tarjetas Todo-en-Uno (IF-THEN dentro) y los Hechos independientes.
 * Conexión directa entre reglas: R1 -[ENCADENA]-> R2 cuando la conclusión de R1 produce una variable que R2 evalúa.
 * Conexión de Hechos: Hecho -[EVALÚA]-> Regla cuando una regla evalúa el hecho inicial.
 */
export const construirGrafoBaseConocimiento = (
  hechos: Hecho[] = [],
  variables: Variable[] = [],
  reglas: Regla[] = [],
  posicionesGuardadas?: Record<string, { x: number; y: number }>,
  puntosControlAristas?: Record<string, { x: number; y: number }>,
  nodosVisuales?: NodoVisualBackend[]
): GrafoResult => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const edgeSet = new Set<string>();

  const visualMap = new Map<string, NodoVisualBackend>();
  if (Array.isArray(nodosVisuales)) {
    for (const nv of nodosVisuales) {
      if (nv?.referencia_id) {
        visualMap.set(String(nv.referencia_id), nv);
      }
    }
  }

  const addEdgeSafe = (edge: FlowEdge) => {
    const key = `${edge.source}_${edge.target}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      const edgeWithProps: FlowEdge = {
        ...edge,
        type: 'draggable',
        data: {
          ...(edge.data || {}),
          ...(puntosControlAristas?.[edge.id] ? { controlPoint: puntosControlAristas[edge.id] } : {}),
        },
      };
      edges.push(edgeWithProps);
    }
  };

  const listaHechos = Array.isArray(hechos) ? hechos : [];
  const listaVariables = Array.isArray(variables) ? variables : [];
  const listaReglas = Array.isArray(reglas) ? reglas : [];

  if (listaHechos.length === 0 && listaVariables.length === 0 && listaReglas.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Mapas por ID (UUID o numérico) y por Nombre para Hechos y Variables
  const hechoIdMap = new Map<string, { nodeId: string; nombre: string }>();
  const variableIdMap = new Map<string, { nodeId: string; nombre: string }>();

  const hechoNombreMap = new Map<string, string>(); // nombreLower -> nodeId
  const variableNombreMap = new Map<string, string>(); // nombreLower -> nodeId

  for (const hecho of listaHechos) {
    if (!hecho) continue;
    const rawHechoId = hecho.id !== undefined && hecho.id !== null ? String(hecho.id) : '';
    const safeHechoId = rawHechoId || `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `hecho_${safeHechoId}`;
    const nombreHecho = safeStr(hecho.nombre, `Hecho_${safeHechoId}`);
    const key = nombreHecho.toLowerCase();
    if (rawHechoId) hechoIdMap.set(rawHechoId, { nodeId, nombre: nombreHecho });
    if (key) hechoNombreMap.set(key, nodeId);
  }

  for (const variable of listaVariables) {
    if (!variable) continue;
    const rawVarId = variable.id !== undefined && variable.id !== null ? String(variable.id) : '';
    const safeVarId = rawVarId || `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `variable_${safeVarId}`;
    const nombreVar = safeStr(variable.nombre, `Var_${safeVarId}`);
    const key = nombreVar.toLowerCase();
    if (rawVarId) variableIdMap.set(rawVarId, { nodeId, nombre: nombreVar });
    if (key) variableNombreMap.set(key, nodeId);
  }

  // 1. Reglas en cuadrícula ordenada sin superposición
  const reglasOrdenadas = [...listaReglas].sort((a, b) => {
    const pA = a.prioridad ?? 0;
    const pB = b.prioridad ?? 0;
    if (pB !== pA) return pB - pA;
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });

  const reglaOrdenMap = new Map<string, number>();
  reglasOrdenadas.forEach((r, idx) => {
    if (r.id !== undefined && r.id !== null) {
      reglaOrdenMap.set(String(r.id), idx + 1);
    }
  });

  const reglaConclusionesVar = new Map<string, Set<string>>();
  const reglaCondicionesVar = new Map<string, Set<string>>();

  reglasOrdenadas.forEach((regla, idx) => {
    const reglaId = regla.id !== undefined && regla.id !== null ? String(regla.id) : `r_${idx}`;
    const reglaNodeId = `regla_${reglaId}`;
    const visual = regla.id !== undefined && regla.id !== null ? visualMap.get(String(regla.id)) : undefined;

    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const defaultGridX = 60 + col * 360;
    const defaultGridY = 80 + row * 340;

    const hasValidVisual =
      visual &&
      visual.posicion_x !== undefined &&
      visual.posicion_y !== undefined &&
      !(Number(visual.posicion_x) === 280 && Number(visual.posicion_y) === 100 && idx > 0);

    const fallbackPos = hasValidVisual
      ? { x: Number(visual!.posicion_x), y: Number(visual!.posicion_y) }
      : { x: defaultGridX, y: defaultGridY };

    const reglaPos = posicionesGuardadas?.[reglaNodeId] || fallbackPos;
    const reglaNombre = safeStr(regla.nombre, `Regla_${reglaId}`);

    const condicionesRaw = Array.isArray(regla.condiciones) ? regla.condiciones : [];
    const conclusionesRaw = Array.isArray(regla.conclusiones) ? regla.conclusiones : [];

    const condVars = new Set<string>();
    const condicionesLista = condicionesRaw.map((c) => {
      let sujeto = c.variable_nombre || c.referencia || '';
      if (!sujeto) {
        if (c.variable_id && variableIdMap.has(String(c.variable_id))) {
          sujeto = variableIdMap.get(String(c.variable_id))!.nombre;
        } else if (c.hecho_id && hechoIdMap.has(String(c.hecho_id))) {
          sujeto = hechoIdMap.get(String(c.hecho_id))!.nombre;
        }
      }
      const sujetoFinal = sujeto || 'Dato';
      condVars.add(sujetoFinal.toLowerCase());
      return {
        sujeto: sujetoFinal,
        operador: safeStr(c.operador, '='),
        valor: safeStr(c.valor_esperado, ''),
      };
    });
    // Extraer también variables de la expresión lógica compleja si está presente
    if (regla.expresion_logica && regla.expresion_logica.trim()) {
      const atomosExpr = extraerAtomosDeExpresion(regla.expresion_logica);
      for (const at of atomosExpr) {
        if (at.variable_nombre) {
          condVars.add(at.variable_nombre.toLowerCase());
        }
      }
    }

    reglaCondicionesVar.set(reglaId, condVars);

    const conclVars = new Set<string>();
    const conclusionesLista = conclusionesRaw.map((c) => {
      let destino = c.variable_nombre || c.destino || '';
      if (!destino) {
        if (c.variable_resultante_id && variableIdMap.has(String(c.variable_resultante_id))) {
          destino = variableIdMap.get(String(c.variable_resultante_id))!.nombre;
        } else if (c.hecho_resultante_id && hechoIdMap.has(String(c.hecho_resultante_id))) {
          destino = hechoIdMap.get(String(c.hecho_resultante_id))!.nombre;
        }
      }
      const destinoFinal = destino || 'Meta';
      conclVars.add(destinoFinal.toLowerCase());
      return {
        destino: destinoFinal,
        valor: safeStr(c.valor_resultante, ''),
      };
    });
    reglaConclusionesVar.set(reglaId, conclVars);

    nodes.push({
      id: reglaNodeId,
      type: 'REGLA',
      position: reglaPos,
      data: {
        id: regla.id,
        nodoVisualId: visual?.id,
        nombre: reglaNombre,
        descripcion: safeStr(regla.descripcion),
        prioridad: regla.prioridad ?? 10,
        ordenNumero: regla.id !== undefined && regla.id !== null ? reglaOrdenMap.get(String(regla.id)) : undefined,
        factor_certeza: regla.factor_certeza ?? 1.0,
        activa: regla.activa !== false,
        expresion_logica: regla.expresion_logica || undefined,
        condicionesLista,
        conclusionesLista,
      },
    });
  });

  // 2. Variables independientes (mostradas si no hay reglas, o si no pertenecen a ninguna regla)
  const todasLasVarsEnReglas = new Set<string>();
  reglaCondicionesVar.forEach((s) => s.forEach((v) => todasLasVarsEnReglas.add(v)));
  reglaConclusionesVar.forEach((s) => s.forEach((v) => todasLasVarsEnReglas.add(v)));

  let varY = 60;
  listaVariables.forEach((variable) => {
    const vNombre = safeStr(variable.nombre).toLowerCase();
    // Si hay reglas y esta variable ya forma parte de una regla, se visualiza dentro de la tarjeta
    if (reglasOrdenadas.length > 0 && todasLasVarsEnReglas.has(vNombre)) {
      return;
    }

    const rawVarId = variable.id !== undefined && variable.id !== null ? String(variable.id) : '';
    const safeVarId = rawVarId || `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `variable_${safeVarId}`;
    const visual = rawVarId ? visualMap.get(rawVarId) : undefined;
    const fallbackPos =
      visual && visual.posicion_x !== undefined && visual.posicion_y !== undefined
        ? { x: Number(visual.posicion_x), y: Number(visual.posicion_y) }
        : { x: 60, y: varY };
    const pos = posicionesGuardadas?.[nodeId] || fallbackPos;

    nodes.push({
      id: nodeId,
      type: 'VARIABLE',
      position: pos,
      data: {
        id: variable.id,
        nodoVisualId: visual?.id,
        nombre: safeStr(variable.nombre, `Var_${safeVarId}`),
        tipo: safeStr(variable.tipo || variable.tipo_dato, 'TEXTO'),
        valor_por_defecto: safeStr(variable.valor_por_defecto ?? variable.valor_defecto),
        descripcion: safeStr(variable.descripcion),
      },
    });

    if (!posicionesGuardadas?.[nodeId]) {
      varY += 140;
    }
  });

  // 3. Hechos independientes en el lienzo
  listaHechos.forEach((hecho, hIdx) => {
    const rawHechoId = hecho.id !== undefined && hecho.id !== null ? String(hecho.id) : '';
    const safeHechoId = rawHechoId || `h_${hIdx}`;
    const nodeId = `hecho_${safeHechoId}`;
    const visual = rawHechoId ? visualMap.get(rawHechoId) : undefined;
    const rowOffset = Math.ceil(reglasOrdenadas.length / 3);
    const fallbackPos =
      visual && visual.posicion_x !== undefined && visual.posicion_y !== undefined
        ? { x: Number(visual.posicion_x), y: Number(visual.posicion_y) }
        : { x: 60 + (hIdx % 4) * 220, y: 80 + rowOffset * 340 + 20 };
    const pos = posicionesGuardadas?.[nodeId] || fallbackPos;
    const nombreHecho = safeStr(hecho.nombre, `Hecho_${safeHechoId}`);

    nodes.push({
      id: nodeId,
      type: 'HECHO',
      position: pos,
      data: {
        id: hecho.id,
        nodoVisualId: visual?.id,
        nombre: nombreHecho,
        valor: safeStr(hecho.valor),
        tipo_dato: safeStr(hecho.tipo_dato, 'TEXTO'),
        es_inicial: Boolean(hecho.es_inicial),
      },
    });

    // Si este hecho es evaluado por alguna regla, arista EVALÚA
    const hechoKey = nombreHecho.toLowerCase();
    reglasOrdenadas.forEach((regla) => {
      const rId = String(regla.id);
      const condsDeRegla = reglaCondicionesVar.get(rId);
      if (condsDeRegla && condsDeRegla.has(hechoKey)) {
        addEdgeSafe({
          id: `e_eval_${nodeId}_regla_${rId}`,
          source: nodeId,
          target: `regla_${rId}`,
          sourceHandle: 'right-out',
          targetHandle: 'left-in',
          label: 'EVALÚA',
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 1.5 },
          labelStyle: { fill: '#334155', fontWeight: 700, fontSize: 8, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, rx: 3, ry: 3 },
          labelBgPadding: [4, 1],
        });
      }
    });
  });

  // 4. Encadenamiento directo entre Reglas (R1 -> R2 si R1 concluye variable que R2 evalúa)
  for (const reglaA of reglasOrdenadas) {
    const idA = String(reglaA.id);
    const conclA = reglaConclusionesVar.get(idA);
    if (!conclA || conclA.size === 0) continue;

    for (const reglaB of reglasOrdenadas) {
      const idB = String(reglaB.id);
      if (idA === idB) continue;
      const condB = reglaCondicionesVar.get(idB);
      if (!condB || condB.size === 0) continue;

      let coincide = false;
      for (const varName of conclA) {
        if (condB.has(varName)) {
          coincide = true;
          break;
        }
      }

      if (coincide) {
        addEdgeSafe({
          id: `e_chain_regla_${idA}_regla_${idB}`,
          source: `regla_${idA}`,
          target: `regla_${idB}`,
          sourceHandle: 'right-out',
          targetHandle: 'left-in',
          label: 'ENCADENA',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' },
          labelStyle: { fill: '#4338ca', fontWeight: 700, fontSize: 8 },
          labelBgStyle: { fill: '#e0e7ff', stroke: '#6366f1', strokeWidth: 1, rx: 4, ry: 4 },
          labelBgPadding: [4, 1],
        });
      }
    }
  }

  return { nodes, edges };
};

export default construirGrafoBaseConocimiento;
