import type { FlowNode, FlowEdge, NodoVisualBackend } from '../types/types';
import type { Hecho, Variable, Regla } from '@/features/base-conocimiento/types/types';

export interface GrafoResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export type ModoVistaLienzo = 'SIMPLIFICADA' | 'COMPLETA';

const safeStr = (val: unknown, fallback = ''): string => {
  if (val === undefined || val === null) return fallback;
  return String(val).trim();
};

/**
 * Transforma los hechos, variables y reglas de la Base de Conocimiento en un grafo pedagógico:
 *
 * Modo 'SIMPLIFICADA' (por defecto en el editor):
 *   Muestra las Reglas como Tarjetas Todo-en-Uno (IF-THEN dentro) y los Hechos independientes.
 *   Conexión directa entre reglas: R1 -[ENCADENA]-> R2. Máxima limpieza sin nodos satélites.
 *
 * Modo 'COMPLETA' (vista desglosada):
 *   Desglosa cada regla jerárquicamente:
 *   Nivel 1 (Y = 60):  REGLA
 *            |
 *           [IF]
 *            v
 *   Nivel 2 (Y = 250): CONDICIÓN
 *            |
 *          [THEN]
 *            v
 *   Nivel 3 (Y = 440): CONCLUSIÓN
 */
export const construirGrafoBaseConocimiento = (
  hechos: Hecho[] = [],
  variables: Variable[] = [],
  reglas: Regla[] = [],
  posicionesGuardadas?: Record<string, { x: number; y: number }>,
  puntosControlAristas?: Record<string, { x: number; y: number }>,
  nodosVisuales?: NodoVisualBackend[],
  vistaModo: ModoVistaLienzo = 'COMPLETA'
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

  // ==========================================
  // VISTA SIMPLIFICADA (SOLO REGLAS Y HECHOS)
  // ==========================================
  if (vistaModo === 'SIMPLIFICADA') {
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

    // 3. Encadenamiento directo entre Reglas (R1 -> R2 si R1 concluye variable que R2 evalúa)
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
  }

  // 1. Colocar Hechos Iniciales y Variables en la Columna Izquierda (X = 60)
  let hvY = 60;

  for (const hecho of listaHechos) {
    if (!hecho) continue;
    const rawHechoId = hecho.id !== undefined && hecho.id !== null ? String(hecho.id) : '';
    const safeHechoId = rawHechoId || `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `hecho_${safeHechoId}`;
    const visual = rawHechoId ? visualMap.get(rawHechoId) : undefined;
    const fallbackPos =
      visual && visual.posicion_x !== undefined && visual.posicion_y !== undefined
        ? { x: Number(visual.posicion_x), y: Number(visual.posicion_y) }
        : { x: 60, y: hvY };
    const pos = posicionesGuardadas?.[nodeId] || fallbackPos;
    const nombreHecho = safeStr(hecho.nombre, `Hecho_${safeHechoId}`);
    const key = nombreHecho.toLowerCase();

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

    if (rawHechoId) {
      hechoIdMap.set(rawHechoId, { nodeId, nombre: nombreHecho });
    }
    if (key) {
      hechoNombreMap.set(key, nodeId);
    }

    if (!posicionesGuardadas?.[nodeId]) {
      hvY += 140;
    }
  }

  for (const variable of listaVariables) {
    if (!variable) continue;
    const rawVarId = variable.id !== undefined && variable.id !== null ? String(variable.id) : '';
    const safeVarId = rawVarId || `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `variable_${safeVarId}`;
    const nombreVar = safeStr(variable.nombre, `Var_${safeVarId}`);
    const key = nombreVar.toLowerCase();
    const visual = rawVarId ? visualMap.get(rawVarId) : undefined;
    const fallbackPos =
      visual && visual.posicion_x !== undefined && visual.posicion_y !== undefined
        ? { x: Number(visual.posicion_x), y: Number(visual.posicion_y) }
        : { x: 60, y: hvY };
    const pos = posicionesGuardadas?.[nodeId] || fallbackPos;

    nodes.push({
      id: nodeId,
      type: 'VARIABLE',
      position: pos,
      data: {
        id: variable.id,
        nodoVisualId: visual?.id,
        nombre: nombreVar,
        tipo: safeStr(variable.tipo || variable.tipo_dato, 'TEXTO'),
        valor_por_defecto: safeStr(variable.valor_por_defecto ?? variable.valor_defecto),
        descripcion: safeStr(variable.descripcion),
      },
    });

    if (rawVarId) {
      variableIdMap.set(rawVarId, { nodeId, nombre: nombreVar });
    }
    if (key) {
      variableNombreMap.set(key, nodeId);
    }

    if (!posicionesGuardadas?.[nodeId]) {
      hvY += 140;
    }

    // Relación Variable -> Hecho si comparten nombre
    if (hechoNombreMap.has(key)) {
      const hechoNodeId = hechoNombreMap.get(key)!;
      addEdgeSafe({
        id: `e_${nodeId}_${hechoNodeId}`,
        source: nodeId,
        target: hechoNodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        label: 'INSTANCIA',
        style: { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '3 3' },
        labelStyle: { fill: '#334155', fontWeight: 600, fontSize: 8 },
        labelBgStyle: { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, rx: 4, ry: 4 },
        labelBgPadding: [4, 1],
      });
    }
  }

  // 2. Calcular posicionamiento de Reglas (Nivel 1), Condiciones (Nivel 2) y Conclusiones (Nivel 3)
  // Ordenar reglas por prioridad y nombre para determinar orden secuencial de evaluación (#1, #2...)
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

  // Iniciamos a la derecha de la columna de hechos/variables (X >= 380) para evitar cualquier solapamiento
  const tieneElementosIzquierda = listaHechos.length > 0 || listaVariables.length > 0;
  const minReglaX = tieneElementosIzquierda ? 380 : 60;
  let currentX = minReglaX;

  // Espaciado vertical ampliado para acomodar la altura de la tarjeta Todo-en-Uno (~250px)
  const Y_REGLA = 60;
  const Y_CONDICIONES = 380;
  const Y_CONCLUSIONES = 580;

  const reglaLayouts: {
    regla: Regla;
    reglaX: number;
    condXList: number[];
    conclXList: number[];
  }[] = [];

  for (const regla of listaReglas) {
    if (!regla) continue;
    const condiciones = Array.isArray(regla.condiciones) ? regla.condiciones : [];
    const conclusiones = Array.isArray(regla.conclusiones) ? regla.conclusiones : [];

    const cantCond = condiciones.length;
    const cantConcl = conclusiones.length;
    const maxItems = Math.max(cantCond, cantConcl, 1);
    const anchoBloque = Math.max(maxItems * 250, 270);

    const condXList: number[] = [];
    for (let i = 0; i < cantCond; i++) {
      condXList.push(currentX + i * 250);
    }

    const conclXList: number[] = [];
    for (let j = 0; j < cantConcl; j++) {
      conclXList.push(currentX + j * 250);
    }

    const reglaX = currentX + (anchoBloque - 240) / 2;

    reglaLayouts.push({
      regla,
      reglaX: Math.max(reglaX, currentX),
      condXList,
      conclXList,
    });

    currentX += anchoBloque + 100;
  }

  // 3. Generar Nodos y Relaciones según el modelo pedagógico:
  //    REGLA --[IF]--> CONDICIÓN --[THEN]--> CONCLUSIÓN
  const todasLasCondiciones: {
    condNodeId: string;
    referencia: string;
    reglaId: string;
    hechoId: string | null;
    variableId: string | null;
  }[] = [];

  const todasLasConclusiones: {
    conclNodeId: string;
    destino: string;
    reglaId: string;
    hechoResultanteId: string | null;
    variableResultanteId: string | null;
  }[] = [];

  for (const layout of reglaLayouts) {
    const { regla, reglaX, condXList, conclXList } = layout;
    const reglaId = regla.id !== undefined && regla.id !== null ? String(regla.id) : `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reglaNodeId = `regla_${reglaId}`;
    const visual = regla.id !== undefined && regla.id !== null ? visualMap.get(String(regla.id)) : undefined;

    // En modo COMPLETA, la posición jerárquica 'reglaX' sitúa cada regla centrada directamente
    // sobre su correspondiente columna de condiciones y conclusiones. No debemos usar coordenadas
    // de cuadrícula de visualMap porque provienen de otro modo y provocarían solapamiento entre reglas.
    const fallbackPos = { x: reglaX, y: Y_REGLA };

    let reglaPos = fallbackPos;
    if (posicionesGuardadas?.[reglaNodeId]) {
      const p = posicionesGuardadas[reglaNodeId];
      if (!tieneElementosIzquierda || p.x >= minReglaX - 40) {
        reglaPos = p;
      }
    }
    const reglaNombre = safeStr(regla.nombre, `Regla_${reglaId}`);

    // Extraer lista resumida de premisas (IF) y conclusiones (THEN) para la tarjeta Todo-en-Uno
    const condicionesRaw = Array.isArray(regla.condiciones) ? regla.condiciones : [];
    const conclusionesRaw = Array.isArray(regla.conclusiones) ? regla.conclusiones : [];

    const condicionesLista = condicionesRaw.map((c) => {
      let sujeto = c.variable_nombre || c.referencia || '';
      if (!sujeto) {
        if (c.variable_id && variableIdMap.has(String(c.variable_id))) {
          sujeto = variableIdMap.get(String(c.variable_id))!.nombre;
        } else if (c.hecho_id && hechoIdMap.has(String(c.hecho_id))) {
          sujeto = hechoIdMap.get(String(c.hecho_id))!.nombre;
        }
      }
      return {
        sujeto: sujeto || 'Dato',
        operador: safeStr(c.operador, '='),
        valor: safeStr(c.valor_esperado, ''),
      };
    });

    const conclusionesLista = conclusionesRaw.map((c) => {
      let destino = c.variable_nombre || c.destino || '';
      if (!destino) {
        if (c.variable_resultante_id && variableIdMap.has(String(c.variable_resultante_id))) {
          destino = variableIdMap.get(String(c.variable_resultante_id))!.nombre;
        } else if (c.hecho_resultante_id && hechoIdMap.has(String(c.hecho_resultante_id))) {
          destino = hechoIdMap.get(String(c.hecho_resultante_id))!.nombre;
        }
      }
      return {
        destino: destino || 'Meta',
        valor: safeStr(c.valor_resultante, ''),
      };
    });

    // Nivel 1: NODO REGLA (Principal - Tarjeta Todo-en-Uno)
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
        condicionesLista,
        conclusionesLista,
      },
    });

    // Nivel 2: NODOS CONDICIONES (IF)
    const condiciones = Array.isArray(regla.condiciones) ? regla.condiciones : [];
    const condNodeIdsDeEstaRegla: string[] = [];

    for (let i = 0; i < condiciones.length; i++) {
      const cond = condiciones[i];
      if (!cond) continue;

      const condId = cond.id !== undefined && cond.id !== null ? String(cond.id) : `${reglaId}_c${i + 1}`;
      const condNodeId = `cond_${reglaId}_${condId}`;
      condNodeIdsDeEstaRegla.push(condNodeId);

      const visual = cond.id !== undefined && cond.id !== null ? visualMap.get(String(cond.id)) : undefined;
      const defaultX = condXList[i] ?? reglaX + i * 250;
      const fallbackPos = { x: defaultX, y: Y_CONDICIONES };

      let condPos = fallbackPos;
      if (posicionesGuardadas?.[condNodeId]) {
        const p = posicionesGuardadas[condNodeId];
        if ((!tieneElementosIzquierda || p.x >= minReglaX - 50) && p.y >= Y_CONDICIONES - 50) {
          condPos = p;
        }
      }

      const condRaw = cond as unknown as Record<string, unknown>;

      // 1. Identificar si hace referencia a Hecho o Variable por ID (Django REST API)
      const hechoRefId = cond.hecho_id ?? condRaw.hecho_id ?? condRaw.hecho;
      const varRefId = cond.variable_id ?? condRaw.variable_id ?? condRaw.variable;

      let sourceNodeId: string | null = null;
      let referenciaNombre = '';
      let esHecho = false;

      if (hechoRefId && hechoIdMap.has(String(hechoRefId))) {
        const hInfo = hechoIdMap.get(String(hechoRefId))!;
        sourceNodeId = hInfo.nodeId;
        referenciaNombre = hInfo.nombre;
        esHecho = true;
      } else if (varRefId && variableIdMap.has(String(varRefId))) {
        const vInfo = variableIdMap.get(String(varRefId))!;
        sourceNodeId = vInfo.nodeId;
        referenciaNombre = vInfo.nombre;
        esHecho = false;
      }

      // 2. Si no se encontró por ID, buscar por referencia textual o nombre
      const refTexto = safeStr(
        cond.referencia ??
        condRaw.variable_nombre ??
        condRaw.hecho_nombre ??
        condRaw.campo ??
        condRaw.nombre
      );

      if (!sourceNodeId && refTexto) {
        const refKey = refTexto.toLowerCase();
        if (hechoNombreMap.has(refKey)) {
          sourceNodeId = hechoNombreMap.get(refKey)!;
          referenciaNombre = refTexto;
          esHecho = true;
        } else if (variableNombreMap.has(refKey)) {
          sourceNodeId = variableNombreMap.get(refKey)!;
          referenciaNombre = refTexto;
          esHecho = false;
        }
      }

      const referenciaFinal = referenciaNombre || refTexto || 'variable';
      const rawOperador = cond.operador ?? condRaw.operador;
      const operador = safeStr(rawOperador, '==');
      const valorEsperado = safeStr(
        cond.valor_esperado ?? condRaw.valor ?? condRaw.valor_esperado_str,
        'true'
      );

      nodes.push({
        id: condNodeId,
        type: 'CONDICION',
        position: condPos,
        data: {
          id: cond.id,
          nodoVisualId: visual?.id,
          reglaId: String(reglaId),
          referencia: referenciaFinal,
          operador,
          valor_esperado: valorEsperado,
          orden: cond.orden ?? i + 1,
        },
      });

      todasLasCondiciones.push({
        condNodeId,
        referencia: referenciaFinal.toLowerCase(),
        reglaId: String(reglaId),
        hechoId: hechoRefId ? String(hechoRefId) : null,
        variableId: varRefId ? String(varRefId) : null,
      });

      // DE LA REGLA SALE EL IF A LA CONDICIÓN: REGLA -> CONDICIÓN [IF]
      addEdgeSafe({
        id: `e_${reglaNodeId}_${condNodeId}`,
        source: reglaNodeId,
        target: condNodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        label: 'IF',
        animated: true,
        data: {
          tipoRelacion: 'IF',
          reglaId: String(reglaId),
          condId: cond.id !== undefined && cond.id !== null ? String(cond.id) : undefined,
        },
        style: { stroke: '#059669', strokeWidth: 1.5 },
        labelStyle: { fill: '#065f46', fontWeight: 700, fontSize: 8, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#f0fdf4', stroke: '#86efac', strokeWidth: 1, rx: 3, ry: 3 },
        labelBgPadding: [4, 1],
      });

      // Relación Hecho/Variable -> Condición (EVALÚA)
      if (sourceNodeId) {
        addEdgeSafe({
          id: `e_${sourceNodeId}_${condNodeId}`,
          source: sourceNodeId,
          target: condNodeId,
          sourceHandle: 'right-out',
          targetHandle: 'left-in',
          label: 'EVALÚA',
          animated: false,
          data: {
            tipoRelacion: 'EVALUA',
            condId: cond.id !== undefined && cond.id !== null ? String(cond.id) : undefined,
            hechoId: hechoRefId ? String(hechoRefId) : undefined,
            variableId: varRefId ? String(varRefId) : undefined,
            esHecho,
          },
          style: { stroke: '#64748b', strokeWidth: 1.5 },
          labelStyle: { fill: '#334155', fontWeight: 700, fontSize: 8, fontFamily: 'monospace' },
          labelBgStyle: {
            fill: '#f8fafc',
            stroke: '#cbd5e1',
            strokeWidth: 1,
            rx: 3,
            ry: 3,
          },
          labelBgPadding: [4, 1],
        });
      }
    }

    // Nivel 3: NODOS CONCLUSIONES (THEN)
    const conclusiones = Array.isArray(regla.conclusiones) ? regla.conclusiones : [];

    for (let j = 0; j < conclusiones.length; j++) {
      const concl = conclusiones[j];
      if (!concl) continue;

      const conclId = concl.id !== undefined && concl.id !== null ? String(concl.id) : `${reglaId}_cl${j + 1}`;
      const conclNodeId = `concl_${reglaId}_${conclId}`;
      const visual = concl.id !== undefined && concl.id !== null ? visualMap.get(String(concl.id)) : undefined;
      const defaultX = conclXList[j] ?? reglaX + j * 250;
      const fallbackPos = { x: defaultX, y: Y_CONCLUSIONES };

      let conclPos = fallbackPos;
      if (posicionesGuardadas?.[conclNodeId]) {
        const p = posicionesGuardadas[conclNodeId];
        if ((!tieneElementosIzquierda || p.x >= minReglaX - 50) && p.y >= Y_CONCLUSIONES - 50) {
          conclPos = p;
        }
      }

      const conclRaw = concl as unknown as Record<string, unknown>;

      // 1. Identificar si el destino es Hecho o Variable por ID (Django REST API)
      const hechoDestId = concl.hecho_resultante_id ?? conclRaw.hecho_resultante_id ?? conclRaw.hecho_resultante ?? conclRaw.hecho_id;
      const varDestId = concl.variable_resultante_id ?? conclRaw.variable_resultante_id ?? conclRaw.variable_resultante ?? conclRaw.variable_id;

      let targetNodeId: string | null = null;
      let destinoNombre = '';
      let esDestinoHecho = false;

      if (hechoDestId && hechoIdMap.has(String(hechoDestId))) {
        const hInfo = hechoIdMap.get(String(hechoDestId))!;
        targetNodeId = hInfo.nodeId;
        destinoNombre = hInfo.nombre;
        esDestinoHecho = true;
      } else if (varDestId && variableIdMap.has(String(varDestId))) {
        const vInfo = variableIdMap.get(String(varDestId))!;
        targetNodeId = vInfo.nodeId;
        destinoNombre = vInfo.nombre;
        esDestinoHecho = false;
      }

      // 2. Si no se encontró por ID, buscar por nombre o texto
      const destTexto = safeStr(
        concl.destino ??
        conclRaw.variable_destino ??
        conclRaw.variable_nombre ??
        conclRaw.hecho_nombre ??
        conclRaw.nombre
      );

      if (!targetNodeId && destTexto) {
        const destKey = destTexto.toLowerCase();
        if (hechoNombreMap.has(destKey)) {
          targetNodeId = hechoNombreMap.get(destKey)!;
          destinoNombre = destTexto;
          esDestinoHecho = true;
        } else if (variableNombreMap.has(destKey)) {
          targetNodeId = variableNombreMap.get(destKey)!;
          destinoNombre = destTexto;
          esDestinoHecho = false;
        }
      }

      const destinoFinal = destinoNombre || destTexto || 'resultado';
      const valorResultante = safeStr(
        concl.valor_resultante ?? conclRaw.valor ?? conclRaw.valor_resultado,
        'deducción'
      );

      nodes.push({
        id: conclNodeId,
        type: 'CONCLUSION',
        position: conclPos,
        data: {
          id: concl.id,
          nodoVisualId: visual?.id,
          reglaId: String(reglaId),
          destino: destinoFinal,
          valor_resultante: valorResultante,
        },
      });

      todasLasConclusiones.push({
        conclNodeId,
        destino: destinoFinal.toLowerCase(),
        reglaId: String(reglaId),
        hechoResultanteId: hechoDestId ? String(hechoDestId) : null,
        variableResultanteId: varDestId ? String(varDestId) : null,
      });

      // DE LA CONDICIÓN SALE EL THEN A LA CONCLUSIÓN: CONDICIÓN -> CONCLUSIÓN [THEN]
      if (condNodeIdsDeEstaRegla.length > 0) {
        for (const cNodeId of condNodeIdsDeEstaRegla) {
          addEdgeSafe({
            id: `e_${cNodeId}_${conclNodeId}`,
            source: cNodeId,
            target: conclNodeId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            label: 'THEN',
            animated: true,
            data: {
              tipoRelacion: 'THEN',
              reglaId: String(reglaId),
              conclusionId: concl.id !== undefined && concl.id !== null ? String(concl.id) : undefined,
            },
            style: { stroke: '#4f46e5', strokeWidth: 1.5 },
            labelStyle: { fill: '#3730a3', fontWeight: 700, fontSize: 8, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#eef2ff', stroke: '#a5b4fc', strokeWidth: 1, rx: 3, ry: 3 },
            labelBgPadding: [4, 1],
          });
        }
      } else {
        // Si la regla no tiene condiciones, la conclusión sale directamente de la regla
        addEdgeSafe({
          id: `e_${reglaNodeId}_${conclNodeId}`,
          source: reglaNodeId,
          target: conclNodeId,
          sourceHandle: 'bottom',
          targetHandle: 'top',
          label: 'THEN',
          animated: true,
          data: {
            tipoRelacion: 'THEN',
            reglaId: String(reglaId),
            conclusionId: concl.id !== undefined && concl.id !== null ? String(concl.id) : undefined,
          },
          style: { stroke: '#4f46e5', strokeWidth: 1.5 },
          labelStyle: { fill: '#3730a3', fontWeight: 700, fontSize: 8, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#eef2ff', stroke: '#a5b4fc', strokeWidth: 1, rx: 3, ry: 3 },
          labelBgPadding: [4, 1],
        });
      }

      // Relación Conclusión -> Hecho o Variable existente (ACTUALIZA / ASIGNA)
      if (targetNodeId) {
        addEdgeSafe({
          id: `e_${conclNodeId}_${targetNodeId}`,
          source: conclNodeId,
          target: targetNodeId,
          sourceHandle: 'left-out',
          targetHandle: 'right-in',
          label: esDestinoHecho ? 'ACTUALIZA' : 'ASIGNA',
          animated: false,
          data: {
            tipoRelacion: esDestinoHecho ? 'ACTUALIZA' : 'ASIGNA',
            conclusionId: concl.id !== undefined && concl.id !== null ? String(concl.id) : undefined,
            hechoId: hechoDestId ? String(hechoDestId) : undefined,
            variableId: varDestId ? String(varDestId) : undefined,
          },
          style: { stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '2 2' },
          labelStyle: { fill: '#1e293b', fontWeight: 700, fontSize: 8, fontFamily: 'monospace' },
          labelBgStyle: {
            fill: '#f1f5f9',
            stroke: '#cbd5e1',
            strokeWidth: 1,
            rx: 3,
            ry: 3,
          },
          labelBgPadding: [4, 1],
        });
      }
    }
  }

  // 4. Encadenamiento hacia adelante (Forward Chaining): Conclusión (R1) -> Condición (R2)
  for (const cConcl of todasLasConclusiones) {
    for (const cCond of todasLasCondiciones) {
      if (cConcl.reglaId === cCond.reglaId) continue;

      // Coincidencia por ID de variable o hecho
      const coincidePorVarId =
        Boolean(cConcl.variableResultanteId && cCond.variableId && cConcl.variableResultanteId === cCond.variableId);

      const coincidePorHechoId =
        Boolean(cConcl.hechoResultanteId && cCond.hechoId && cConcl.hechoResultanteId === cCond.hechoId);

      // O coincidencia por nombre de variable/hecho
      const coincidePorNombre =
        Boolean(cConcl.destino && cCond.referencia && cConcl.destino !== 'resultado' && cConcl.destino === cCond.referencia);

      if (coincidePorVarId || coincidePorHechoId || coincidePorNombre) {
        addEdgeSafe({
          id: `e_chain_${cConcl.conclNodeId}_${cCond.condNodeId}`,
          source: cConcl.conclNodeId,
          target: cCond.condNodeId,
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
