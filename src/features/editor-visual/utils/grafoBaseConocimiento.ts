import type { FlowNode, FlowEdge } from '../types/types';
import type { Hecho, Variable, Regla } from '@/features/base-conocimiento/types/types';

export interface GrafoResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const safeStr = (val: unknown, fallback = ''): string => {
  if (val === undefined || val === null) return fallback;
  return String(val).trim();
};

/**
 * Transforma los hechos, variables y reglas de la Base de Conocimiento en un grafo pedagógico:
 *
 * Flujo Jerárquico Principal:
 *   Nivel 1 (Y = 60):  REGLA (Elemento principal que gobierna la inferencia)
 *            |
 *           [IF]
 *            v
 *   Nivel 2 (Y = 250): CONDICIÓN (Premisas evaluadas por la regla)
 *            |
 *          [THEN]
 *            v
 *   Nivel 3 (Y = 440): CONCLUSIÓN (Deducciones resultantes de la regla)
 *
 * Elementos de Soporte:
 *   Columna Izquierda (X = 60): Hechos Iniciales y Variables del Dominio
 *   -> Hecho / Variable  -[EVALÚA]-> Condición
 *   -> Conclusión        -[ACTUALIZA/ASIGNA]-> Hecho / Variable
 *   -> Conclusión (R1)   -[ENCADENA]-> Condición (R2)
 */
export const construirGrafoBaseConocimiento = (
  hechos: Hecho[] = [],
  variables: Variable[] = [],
  reglas: Regla[] = [],
  posicionesGuardadas?: Record<string, { x: number; y: number }>,
  puntosControlAristas?: Record<string, { x: number; y: number }>
): GrafoResult => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const edgeSet = new Set<string>();

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

  // 1. Colocar Hechos Iniciales y Variables en la Columna Izquierda (X = 60)
  let hvY = 60;

  for (const hecho of listaHechos) {
    if (!hecho) continue;
    const rawHechoId = hecho.id !== undefined && hecho.id !== null ? String(hecho.id) : '';
    const safeHechoId = rawHechoId || `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `hecho_${safeHechoId}`;
    const pos = posicionesGuardadas?.[nodeId] || { x: 60, y: hvY };
    const nombreHecho = safeStr(hecho.nombre, `Hecho_${safeHechoId}`);
    const key = nombreHecho.toLowerCase();

    nodes.push({
      id: nodeId,
      type: 'HECHO',
      position: pos,
      data: {
        id: hecho.id,
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

    const pos = posicionesGuardadas?.[nodeId] || { x: 60, y: hvY };

    nodes.push({
      id: nodeId,
      type: 'VARIABLE',
      position: pos,
      data: {
        id: variable.id,
        nombre: nombreVar,
        tipo: safeStr(variable.tipo, 'TEXTO'),
        valor_por_defecto: safeStr(variable.valor_por_defecto),
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
  // Iniciamos a la derecha de la columna de hechos (X = 320)
  const tieneElementosIzquierda = listaHechos.length > 0 || listaVariables.length > 0;
  let currentX = tieneElementosIzquierda ? 320 : 60;

  const Y_REGLA = 60;
  const Y_CONDICIONES = 250;
  const Y_CONCLUSIONES = 440;

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
    const anchoBloque = Math.max(maxItems * 240, 260);

    const condXList: number[] = [];
    for (let i = 0; i < cantCond; i++) {
      condXList.push(currentX + i * 240);
    }

    const conclXList: number[] = [];
    for (let j = 0; j < cantConcl; j++) {
      conclXList.push(currentX + j * 240);
    }

    const reglaX = currentX + (anchoBloque - 220) / 2;

    reglaLayouts.push({
      regla,
      reglaX: Math.max(reglaX, currentX),
      condXList,
      conclXList,
    });

    currentX += anchoBloque + 80;
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
    const reglaPos = posicionesGuardadas?.[reglaNodeId] || { x: reglaX, y: Y_REGLA };
    const reglaNombre = safeStr(regla.nombre, `Regla_${reglaId}`);

    // Nivel 1: NODO REGLA (Principal)
    nodes.push({
      id: reglaNodeId,
      type: 'REGLA',
      position: reglaPos,
      data: {
        id: regla.id,
        nombre: reglaNombre,
        descripcion: safeStr(regla.descripcion),
        prioridad: regla.prioridad ?? 10,
        factor_certeza: regla.factor_certeza ?? 1.0,
        activa: regla.activa !== false,
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

      const defaultX = condXList[i] ?? reglaX + i * 240;
      const condPos = posicionesGuardadas?.[condNodeId] || { x: defaultX, y: Y_CONDICIONES };

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
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        labelStyle: { fill: '#78350f', fontWeight: 700, fontSize: 9 },
        labelBgStyle: { fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1, rx: 4, ry: 4 },
        labelBgPadding: [5, 1],
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
          animated: true,
          style: { stroke: esHecho ? '#10b981' : '#0284c7', strokeWidth: 2 },
          labelStyle: { fill: esHecho ? '#064e3b' : '#075985', fontWeight: 700, fontSize: 8 },
          labelBgStyle: {
            fill: esHecho ? '#d1fae5' : '#e0f2fe',
            stroke: esHecho ? '#10b981' : '#0284c7',
            strokeWidth: 1,
            rx: 4,
            ry: 4,
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
      const defaultX = conclXList[j] ?? reglaX + j * 240;
      const conclPos = posicionesGuardadas?.[conclNodeId] || { x: defaultX, y: Y_CONCLUSIONES };

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
            style: { stroke: '#a855f7', strokeWidth: 2 },
            labelStyle: { fill: '#581c87', fontWeight: 700, fontSize: 9 },
            labelBgStyle: { fill: '#f3e8ff', stroke: '#a855f7', strokeWidth: 1, rx: 4, ry: 4 },
            labelBgPadding: [5, 1],
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
          style: { stroke: '#a855f7', strokeWidth: 2 },
          labelStyle: { fill: '#581c87', fontWeight: 700, fontSize: 9 },
          labelBgStyle: { fill: '#f3e8ff', stroke: '#a855f7', strokeWidth: 1, rx: 4, ry: 4 },
          labelBgPadding: [5, 1],
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
          animated: true,
          style: { stroke: esDestinoHecho ? '#059669' : '#ec4899', strokeWidth: 2 },
          labelStyle: { fill: esDestinoHecho ? '#065f46' : '#9d174d', fontWeight: 700, fontSize: 8 },
          labelBgStyle: {
            fill: esDestinoHecho ? '#ecfdf5' : '#fce7f3',
            stroke: esDestinoHecho ? '#059669' : '#ec4899',
            strokeWidth: 1,
            rx: 4,
            ry: 4,
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
