import { z } from 'zod';
import type {
  OperadorComparacion,
  TipoDato,
} from '@/features/base-conocimiento/types/types';
import type { ExplicacionConclusion } from '@/features/inferencia/types/types';
import { useIALocalStore } from '../store/useIALocalStore';
import type {
  BorradorReglasIA,
  CasoPruebaGeneradoIA,
} from '../types/iaLocal.types';
import {
  construirPromptExplicarRegla,
  construirPromptExplicarSistemaExperto,
  construirPromptExplicarTrazaInferencia,
  construirPromptGenerarCasosPrueba,
  construirPromptGenerarReglas,
  type ContextoBCInput,
} from '../prompts/promptsSistemaExperto';

const TIPOS_VALIDOS: TipoDato[] = ['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO', 'OPCION'];
const OPS_VALIDOS: OperadorComparacion[] = ['==', '!=', '>', '<', '>=', '<='];

const normalizarTipo = (raw?: string): TipoDato => {
  const upper = (raw || 'TEXTO').toUpperCase().trim();
  if (upper === 'INT' || upper === 'INTEGER' || upper === 'NUMERO') return 'ENTERO';
  if (upper === 'FLOAT' || upper === 'NUMBER' || upper === 'REAL') return 'DECIMAL';
  if (upper === 'BOOL' || upper === 'BOOLEAN') return 'BOOLEANO';
  if (upper === 'ENUM' || upper === 'SELECT') return 'OPCION';
  return TIPOS_VALIDOS.includes(upper as TipoDato) ? (upper as TipoDato) : 'TEXTO';
};

const normalizarOperador = (raw?: string): OperadorComparacion => {
  const clean = (raw || '==').trim();
  if (clean === '=') return '==';
  if (clean === '<>') return '!=';
  return OPS_VALIDOS.includes(clean as OperadorComparacion)
    ? (clean as OperadorComparacion)
    : '==';
};

const normalizarSintaxisJson = (raw: string): string => {
  let texto = raw
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // Eliminar comentarios /* ... */ y // ... fuera de cadenas
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  // Convertir literales Python/JS fuera de comillas (True, False, None, undefined)
  texto = texto
    .replace(/:\s*True\b/g, ': true')
    .replace(/:\s*False\b/g, ': false')
    .replace(/:\s*(?:None|undefined)\b/g, ': null');

  // Convertir claves sin comillas: { nombre: ... } o , nombre: ...
  texto = texto.replace(/([{,]\s*)([a-zA-Z_áéíóúÁÉÍÓÚñÑ$][a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ$-]*)\s*:/g, '$1"$2":');

  // Convertir cadenas con comillas simples '...' a "..." cuando no contienen comillas dobles sin escapar
  texto = texto.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner: string) => {
    const escaped = inner.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  // Quitar comas finales antes de } o ]
  return texto.replace(/,\s*([}\]])/g, '$1').trim();
};

const balancearCierreJson = (textoInput: string): string => {
  let texto = textoInput.trim();
  const pila: string[] = [];
  let enCadena = false;
  let escapado = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (escapado) {
      escapado = false;
      continue;
    }
    if (ch === '\\') {
      escapado = true;
      continue;
    }
    if (ch === '"') {
      enCadena = !enCadena;
      continue;
    }
    if (enCadena) continue;
    if (ch === '{') pila.push('}');
    else if (ch === '[') pila.push(']');
    else if (ch === '}' || ch === ']') {
      if (pila.length > 0 && pila[pila.length - 1] === ch) {
        pila.pop();
      }
    }
  }

  if (enCadena) texto += '"';
  if (pila.length > 0) {
    // Quitar propiedad o valor incompleto al final (ej: `, "clave":` o `, "clave"`)
    texto = texto
      .replace(/,\s*"[^"]*"\s*:\s*$/, '')
      .replace(/,\s*"[^"]*"\s*$/, '')
      .replace(/,\s*$/, '');
    while (pila.length > 0) {
      texto += pila.pop();
    }
  }
  return texto.replace(/,\s*([}\]])/g, '$1');
};

const repararJson = (fragmento: string): string => {
  const normalizado = normalizarSintaxisJson(fragmento);
  return balancearCierreJson(normalizado);
};

const intentarParsearConRecorteFinal = (fragmento: string): unknown | null => {
  const reparado = repararJson(fragmento);
  try {
    return JSON.parse(reparado);
  } catch {
    // Si falló por un token truncado a mitad de propiedad, recortar hasta la última coma o llave válida
    const normalizado = normalizarSintaxisJson(fragmento);
    let pos = normalizado.length;
    for (let intentos = 0; intentos < 8; intentos++) {
      const ultimaComa = normalizado.lastIndexOf(',', pos - 1);
      const ultimaLlave = normalizado.lastIndexOf('}', pos - 1);
      const ultimoCorchete = normalizado.lastIndexOf(']', pos - 1);
      const corte = Math.max(ultimaComa, ultimaLlave, ultimoCorchete);
      if (corte <= 0) break;
      const sub = normalizado.slice(0, corte + (corte === ultimaComa ? 0 : 1));
      try {
        return JSON.parse(balancearCierreJson(sub));
      } catch {
        pos = corte;
      }
    }
    return null;
  }
};

const extraerObjetosJsonParciales = (texto: string): unknown[] => {
  const objetos: unknown[] = [];
  let depth = 0;
  let start = -1;
  let enCadena = false;
  let escapado = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (escapado) {
      escapado = false;
      continue;
    }
    if (ch === '\\') {
      escapado = true;
      continue;
    }
    if (ch === '"') {
      enCadena = !enCadena;
      continue;
    }
    if (enCadena) continue;
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const bloque = texto.slice(start, i + 1);
        const parsed = intentarParsearConRecorteFinal(bloque);
        if (parsed && typeof parsed === 'object') {
          objetos.push(parsed);
        }
        start = -1;
      }
    }
  }
  return objetos;
};

const parsearReglasDesdeTextoPlano = (texto: string): Record<string, unknown> | null => {
  const reglas: Array<Record<string, unknown>> = [];
  // Buscar bloques tipo: IF <condiciones> THEN <conclusiones> (o SI ... ENTONCES ...)
  const regexBloques = /(?:^|\n)\s*(?:[-*•]|\d+[.)]|Regla\s*\d*[:.-]?)?\s*(?:IF|SI)\s+([^\n]+?)\s+(?:THEN|ENTONCES)\s+([^\n]+)/gi;
  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = regexBloques.exec(texto)) !== null) {
    const parteIf = match[1].trim();
    const parteThen = match[2].trim();

    const condiciones = parteIf
      .split(/\s+(?:AND|Y|&&)\s+/i)
      .map((c) => parsearCondicionCadena(c.replace(/[()]/g, '').trim()))
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const conclusiones = parteThen
      .split(/\s+(?:AND|Y|&&|,)\s+/i)
      .map((cl) => parsearConclusionCadena(cl.replace(/[()]/g, '').trim()))
      .filter((cl): cl is NonNullable<typeof cl> => cl !== null);

    if (condiciones.length > 0 && conclusiones.length > 0) {
      reglas.push({
        nombre: `R${idx}_Generada`,
        descripcion: `Regla extraída: IF ${parteIf} THEN ${parteThen}`,
        prioridad: 10,
        factor_certeza: 0.9,
        condiciones,
        conclusiones,
      });
      idx++;
    }
  }

  if (reglas.length === 0) return null;
  return {
    resumen: 'Reglas extraídas desde la respuesta del modelo local.',
    variables: [],
    hechos: [],
    reglas,
  };
};

const extraerJsonDeRespuesta = (texto: string, permitirTextoPlano = false): unknown => {
  const limpio = texto.trim();
  const matchFence = limpio.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidato = matchFence ? matchFence[1].trim() : limpio;

  const primerLlave = candidato.indexOf('{');
  const primerCorchete = candidato.indexOf('[');
  let inicio = -1;
  let fin = -1;

  if (primerCorchete !== -1 && (primerLlave === -1 || primerCorchete < primerLlave)) {
    inicio = primerCorchete;
    fin = candidato.lastIndexOf(']');
    if (fin <= inicio) fin = candidato.length - 1;
  } else if (primerLlave !== -1) {
    inicio = primerLlave;
    fin = candidato.lastIndexOf('}');
    if (fin <= inicio) fin = candidato.length - 1;
  }

  if (inicio !== -1 && fin >= inicio) {
    const fragmento = candidato.slice(inicio, fin + 1);
    try {
      return JSON.parse(fragmento);
    } catch {
      const rescatado = intentarParsearConRecorteFinal(fragmento);
      if (rescatado !== null) return rescatado;
    }

    const objetos = extraerObjetosJsonParciales(candidato);
    if (objetos.length > 0) {
      return objetos.length === 1 ? objetos[0] : objetos;
    }
  }

  if (permitirTextoPlano) {
    const desdeTexto = parsearReglasDesdeTextoPlano(limpio);
    if (desdeTexto) return desdeTexto;
  }

  console.warn('[IA Local] No se pudo extraer JSON válido. Respuesta cruda:', texto);
  throw new Error('El modelo local devolvió una respuesta ilegible. Intenta pulsar "Generar Borrador" nuevamente.');
};

const normalizarSlug = (texto: unknown, fallback: string): string => {
  const raw = String(texto ?? '').trim();
  if (!raw) return fallback;
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '') || fallback;
};

const parsearCondicionCadena = (texto: string) => {
  const m = texto.match(/^\s*([a-zA-Z0-9_\sáéíóúÁÉÍÓÚñÑ-]+?)\s*(==|!=|>=|<=|>|<|=)\s*(.+?)\s*$/);
  if (!m) return null;
  return {
    referencia: normalizarSlug(m[1], 'variable'),
    operador: m[2] === '=' ? '==' : m[2],
    valor_esperado: m[3].replace(/^["']|["']$/g, '').trim(),
  };
};

const parsearConclusionCadena = (texto: string) => {
  const m = texto.match(/^\s*([a-zA-Z0-9_\sáéíóúÁÉÍÓÚñÑ-]+?)\s*(?:==|=|:|->)\s*(.+?)\s*$/);
  if (!m) return null;
  return {
    destino: normalizarSlug(m[1], 'diagnostico'),
    valor_resultante: m[2].replace(/^["']|["']$/g, '').trim(),
  };
};

const normalizarVariableRaw = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw === 'string' && raw.trim()) {
    return { nombre: normalizarSlug(raw, 'variable'), tipo: 'TEXTO', es_inicial: true };
  }
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const nombre = String(v.nombre ?? v.name ?? v.variable ?? v.campo ?? '').trim();
  if (!nombre) return null;
  return {
    nombre: normalizarSlug(nombre, 'variable'),
    tipo: v.tipo ?? v.type ?? v.tipo_dato ?? 'TEXTO',
    valor_por_defecto: v.valor_por_defecto ?? v.default ?? v.valor ?? '',
    descripcion: v.descripcion ?? v.description ?? '',
    es_inicial: typeof v.es_inicial === 'boolean' ? v.es_inicial : true,
    pregunta: v.pregunta ?? v.question ?? '',
    opciones: Array.isArray(v.opciones)
      ? v.opciones
      : Array.isArray(v.options)
      ? v.options
      : undefined,
  };
};

const normalizarHechoRaw = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== 'object') return null;
  const h = raw as Record<string, unknown>;
  const nombre = String(h.nombre ?? h.name ?? h.hecho ?? '').trim();
  const valor = h.valor ?? h.value;
  if (!nombre || valor === undefined || valor === null || String(valor).trim() === '') return null;
  return {
    nombre: normalizarSlug(nombre, 'hecho'),
    valor,
    tipo_dato: h.tipo_dato ?? h.tipo ?? h.type ?? 'TEXTO',
    descripcion: h.descripcion ?? h.description ?? '',
    es_inicial: typeof h.es_inicial === 'boolean' ? h.es_inicial : false,
    pregunta: h.pregunta ?? h.question ?? '',
  };
};

const inferirTipoValor = (val: unknown): string => {
  const s = String(val ?? '').trim().toLowerCase();
  if (s === 'true' || s === 'false' || s === 'si' || s === 'no') return 'BOOLEANO';
  if (/^-?\d+$/.test(s)) return 'ENTERO';
  if (/^-?\d+[.,]\d+$/.test(s)) return 'DECIMAL';
  return 'TEXTO';
};

const normalizarBorradorRaw = (raw: unknown): Record<string, unknown> => {
  if (Array.isArray(raw)) {
    const reglas = raw.map(normalizarReglaRaw).filter((r) => Object.keys(r).length > 0);
    return { reglas };
  }
  if (!raw || typeof raw !== 'object') {
    return { reglas: [] };
  }

  let obj = raw as Record<string, unknown>;
  // Desempaquetar si el modelo envolvió la respuesta en { data: ... } o { respuesta: ... }
  for (const wrapper of ['data', 'respuesta', 'result', 'borrador', 'sistema_experto']) {
    if (
      obj[wrapper] &&
      typeof obj[wrapper] === 'object' &&
      !Array.isArray(obj[wrapper]) &&
      !obj.reglas &&
      !obj.rules
    ) {
      obj = obj[wrapper] as Record<string, unknown>;
      break;
    }
  }

  let reglasRaw: unknown[] = [];
  if (Array.isArray(obj.reglas)) {
    reglasRaw = obj.reglas;
  } else if (Array.isArray(obj.rules)) {
    reglasRaw = obj.rules;
  } else if (Array.isArray(obj.reglas_propuestas)) {
    reglasRaw = obj.reglas_propuestas;
  } else if (obj.regla && typeof obj.regla === 'object') {
    reglasRaw = [obj.regla];
  } else if (obj.rule && typeof obj.rule === 'object') {
    reglasRaw = [obj.rule];
  } else if (
    obj.condiciones ||
    obj.conditions ||
    obj.conclusiones ||
    obj.conclusions ||
    obj.if ||
    obj.then
  ) {
    reglasRaw = [obj];
  }

  const variablesCrudas = (Array.isArray(obj.variables) ? obj.variables : [])
    .map(normalizarVariableRaw)
    .filter((v): v is Record<string, unknown> => v !== null);

  const nombresVars = new Set<string>();
  const variables: Array<Record<string, unknown>> = [];
  for (const v of variablesCrudas) {
    const key = String(v.nombre).toLowerCase();
    if (!nombresVars.has(key)) {
      nombresVars.add(key);
      variables.push(v);
    }
  }

  const hechos = (Array.isArray(obj.hechos)
    ? obj.hechos
    : Array.isArray(obj.facts)
    ? obj.facts
    : [])
    .map(normalizarHechoRaw)
    .filter((h): h is Record<string, unknown> => h !== null);

  const reglas = reglasRaw
    .map(normalizarReglaRaw)
    .filter(
      (r) =>
        Array.isArray(r.condiciones) &&
        r.condiciones.length > 0 &&
        Array.isArray(r.conclusiones) &&
        r.conclusiones.length > 0
    );

  // Autocompletar variables usadas en las reglas si el modelo omitió declararlas
  for (const regla of reglas) {
    for (const c of regla.condiciones as Array<Record<string, unknown>>) {
      const ref = String(c.referencia || '').trim();
      if (ref && !nombresVars.has(ref.toLowerCase())) {
        nombresVars.add(ref.toLowerCase());
        variables.push({
          nombre: ref,
          tipo: inferirTipoValor(c.valor_esperado),
          descripcion: `Variable de entrada (${ref})`,
          es_inicial: true,
          pregunta: `¿Cuál es el valor de ${ref.replace(/_/g, ' ')}?`,
        });
      }
    }
    for (const cl of regla.conclusiones as Array<Record<string, unknown>>) {
      const dest = String(cl.destino || '').trim();
      if (dest && !nombresVars.has(dest.toLowerCase())) {
        nombresVars.add(dest.toLowerCase());
        variables.push({
          nombre: dest,
          tipo: inferirTipoValor(cl.valor_resultante),
          descripcion: `Variable de conclusión (${dest})`,
          es_inicial: false,
          pregunta: '',
        });
      }
    }
  }

  return {
    resumen:
      typeof obj.resumen === 'string'
        ? obj.resumen
        : typeof obj.summary === 'string'
        ? obj.summary
        : 'Reglas propuestas por el asistente local.',
    variables,
    hechos,
    reglas,
  };
};

const normalizarReglaRaw = (raw: unknown, idx: number): Record<string, unknown> => {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const condsRaw = Array.isArray(r.condiciones)
    ? r.condiciones
    : Array.isArray(r.conditions)
    ? r.conditions
    : Array.isArray(r.if)
    ? r.if
    : r.condicion
    ? [r.condicion]
    : r.condition
    ? [r.condition]
    : typeof r.if === 'string'
    ? [r.if]
    : [];
  const conclsRaw = Array.isArray(r.conclusiones)
    ? r.conclusiones
    : Array.isArray(r.conclusions)
    ? r.conclusions
    : Array.isArray(r.then)
    ? r.then
    : r.conclusion
    ? [r.conclusion]
    : typeof r.then === 'string'
    ? [r.then]
    : [];

  const condiciones = condsRaw
    .map((c) => {
      if (typeof c === 'string') return parsearCondicionCadena(c);
      if (!c || typeof c !== 'object') return null;
      const item = c as Record<string, unknown>;
      const ref = String(
        item.referencia ?? item.variable ?? item.campo ?? item.nombre ?? item.hecho ?? item.lhs ?? item.key ?? ''
      ).trim();
      if (!ref) return null;
      return {
        referencia: normalizarSlug(ref, 'variable'),
        operador: String(item.operador ?? item.operator ?? item.op ?? item.comp ?? '=='),
        valor_esperado: item.valor_esperado ?? item.valor ?? item.value ?? item.rhs ?? item.expected ?? 'true',
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const conclusiones = conclsRaw
    .map((cl) => {
      if (typeof cl === 'string') return parsearConclusionCadena(cl);
      if (!cl || typeof cl !== 'object') return null;
      const item = cl as Record<string, unknown>;
      const dest = String(
        item.destino ?? item.variable ?? item.campo ?? item.nombre ?? item.hecho ?? item.accion ?? item.target ?? ''
      ).trim();
      if (!dest) return null;
      return {
        destino: normalizarSlug(dest, 'diagnostico'),
        valor_resultante:
          item.valor_resultante ?? item.valor ?? item.value ?? item.resultado ?? item.result ?? 'true',
      };
    })
    .filter((cl): cl is NonNullable<typeof cl> => cl !== null);

  let fc = Number(r.factor_certeza ?? r.certainty_factor ?? r.fc ?? 0.95);
  if (Number.isNaN(fc)) fc = 0.95;
  if (fc > 1 && fc <= 100) fc = fc / 100;
  fc = Math.max(0, Math.min(1, fc));

  let prio = Math.round(Number(r.prioridad ?? r.priority ?? 10));
  if (Number.isNaN(prio)) prio = 10;
  prio = Math.max(0, Math.min(1000, prio));

  return {
    nombre: String(r.nombre || r.name || `R${idx + 1}_Generada`).trim(),
    descripcion: String(r.descripcion || r.description || '').trim(),
    prioridad: prio,
    factor_certeza: fc,
    condiciones,
    conclusiones,
  };
};

const VariableIASchema = z.object({
  nombre: z.string().min(1),
  tipo: z.string().optional(),
  valor_por_defecto: z.union([z.string(), z.number(), z.boolean()]).optional(),
  descripcion: z.string().optional(),
  es_inicial: z.boolean().optional(),
  pregunta: z.string().optional(),
  opciones: z.array(z.union([z.string(), z.number()])).optional(),
});

const HechoIASchema = z.object({
  nombre: z.string().min(1),
  valor: z.union([z.string(), z.number(), z.boolean()]).default(''),
  tipo_dato: z.string().optional(),
  descripcion: z.string().optional(),
  es_inicial: z.boolean().optional(),
  pregunta: z.string().optional(),
});

const ReglaIASchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().default(''),
  prioridad: z.coerce.number().int().min(0).max(1000).optional().default(10),
  factor_certeza: z.coerce.number().min(0).max(1).optional().default(1),
  condiciones: z
    .array(
      z.object({
        referencia: z.string().min(1),
        operador: z.string().optional().default('=='),
        valor_esperado: z.union([z.string(), z.number(), z.boolean()]),
      })
    )
    .min(1),
  conclusiones: z
    .array(
      z.object({
        destino: z.string().min(1),
        valor_resultante: z.union([z.string(), z.number(), z.boolean()]),
      })
    )
    .min(1),
});

const BorradorReglasIASchema = z.object({
  resumen: z.string().optional().default('Reglas propuestas por el asistente local.'),
  variables: z.array(VariableIASchema).optional().default([]),
  hechos: z.array(HechoIASchema).optional().default([]),
  reglas: z.array(ReglaIASchema).min(1),
});

const CasosPruebaIASchema = z.object({
  casos: z
    .array(
      z.object({
        titulo: z.string().min(1),
        categoria: z.enum(['positivo', 'borde', 'negativo']).optional().default('positivo'),
        descripcion: z.string().optional().default(''),
        hechosEntrada: z
          .array(
            z.object({
              nombre: z.string().min(1),
              valor: z.union([z.string(), z.number(), z.boolean()]),
            })
          )
          .default([]),
        conclusionEsperada: z.string().optional().default('Sin conclusión'),
        reglasEsperadas: z.array(z.string()).optional().default([]),
      })
    )
    .min(1),
});

async function asegurarMotorListo() {
  const store = useIALocalStore.getState();
  if (store.estado === 'listo' && (store.engine || store.cpuWorker)) {
    return store;
  }
  await store.cargarModelo();
  return useIALocalStore.getState();
}

function esErrorDeGPU(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /device was lost|GPUDeviceLostInfo|DXGI_ERROR_DEVICE_HUNG|out of memory|already been disposed|no available adapters/i.test(
    msg
  );
}

async function ejecutarChatCompleto(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number; onToken?: (acumulado: string) => void }
): Promise<string> {
  const store = await asegurarMotorListo();

  if (store.backendActivo === 'cpu') {
    return store.generarTextoCpu(
      messages,
      {
        temperature: options?.temperature ?? 0.2,
        maxTokens: options?.maxTokens ?? 750,
      },
      options?.onToken
    );
  }

  const engine = store.engine;
  if (!engine) {
    throw new Error('No se pudo inicializar el motor local.');
  }

  store.setGenerando(true);
  try {
    if (options?.onToken) {
      const chunks = await engine.chat.completions.create({
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 1400,
        stream: true,
      });
      let acumulado = '';
      for await (const chunk of chunks) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          acumulado += delta;
          options.onToken(acumulado);
        }
      }
      return acumulado;
    }

    const response = await engine.chat.completions.create({
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 1400,
    });
    return response.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (esErrorDeGPU(err)) {
      if (useIALocalStore.getState().modoEjecucion === 'auto') {
        await useIALocalStore
          .getState()
          .activarRespaldoCPU(
            'GPU insuficiente o bloqueada. Cambiando automáticamente a memoria RAM (CPU)...'
          );
        return useIALocalStore.getState().generarTextoCpu(
          messages,
          {
            temperature: options?.temperature ?? 0.2,
            maxTokens: options?.maxTokens ?? 750,
          },
          options?.onToken
        );
      }
      await useIALocalStore.getState().descargarDeMemoria();
      throw new Error(
        'La GPU se quedó sin memoria (Device lost). Activa el modo "Automático" o "CPU / RAM" en Configurar modelo.'
      );
    }
    throw err instanceof Error ? err : new Error(String(err || 'Error ejecutando el modelo local.'));
  } finally {
    useIALocalStore.getState().setGenerando(false);
  }
}

async function ejecutarChatStream(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onToken: (acumulado: string) => void,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const store = await asegurarMotorListo();

  if (store.backendActivo === 'cpu') {
    return store.generarTextoCpu(
      messages,
      {
        temperature: options?.temperature ?? 0.35,
        maxTokens: options?.maxTokens ?? 900,
      },
      onToken
    );
  }

  const engine = store.engine;
  if (!engine) {
    throw new Error('No se pudo inicializar el motor local.');
  }

  store.setGenerando(true);
  try {
    const chunks = await engine.chat.completions.create({
      messages,
      temperature: options?.temperature ?? 0.35,
      max_tokens: options?.maxTokens ?? 900,
      stream: true,
    });

    let acumulado = '';
    for await (const chunk of chunks) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        acumulado += delta;
        onToken(acumulado);
      }
    }
    return acumulado;
  } catch (err) {
    if (esErrorDeGPU(err)) {
      if (useIALocalStore.getState().modoEjecucion === 'auto') {
        onToken('GPU insuficiente; cambiando automáticamente a memoria RAM (CPU)...\n\n');
        await useIALocalStore
          .getState()
          .activarRespaldoCPU(
            'GPU insuficiente o bloqueada. Cambiando automáticamente a memoria RAM (CPU)...'
          );
        return useIALocalStore.getState().generarTextoCpu(
          messages,
          {
            temperature: options?.temperature ?? 0.35,
            maxTokens: options?.maxTokens ?? 900,
          },
          onToken
        );
      }
      await useIALocalStore.getState().descargarDeMemoria();
      throw new Error(
        'La GPU se quedó sin memoria (Device lost). Activa el modo "Automático" o "CPU / RAM" en Configurar modelo.'
      );
    }
    throw err instanceof Error ? err : new Error(String(err || 'Error ejecutando el modelo local.'));
  } finally {
    useIALocalStore.getState().setGenerando(false);
  }
}

export const iaLocalService = {
  async generarBorradorReglas(
    contexto: ContextoBCInput,
    instruccionUsuario: string,
    cantidadReglas = 3,
    soloVariablesExistentes = false,
    onToken?: (acumulado: string) => void
  ): Promise<BorradorReglasIA> {
    const messages = construirPromptGenerarReglas(
      contexto,
      instruccionUsuario,
      cantidadReglas,
      soloVariablesExistentes
    );

    const textoCrudo = await ejecutarChatCompleto(messages, {
      temperature: 0.2,
      maxTokens: 1200,
      onToken,
    });

    let json = normalizarBorradorRaw(extraerJsonDeRespuesta(textoCrudo, true));
    let result = BorradorReglasIASchema.safeParse(json);
    if (!result.success) {
      const respaldoTexto = parsearReglasDesdeTextoPlano(textoCrudo);
      if (respaldoTexto) {
        json = normalizarBorradorRaw(respaldoTexto);
        result = BorradorReglasIASchema.safeParse(json);
      }
    }
    if (!result.success) {
      console.warn('[IA Local] Respuesta del modelo no pasó validación:', {
        issues: result.error.issues,
        textoCrudo,
        jsonNormalizado: json,
      });
      throw new Error(
        'El modelo local no generó una estructura de reglas completa. Intenta describir las condiciones deseadas o vuelve a pulsar "Generar Borrador".'
      );
    }
    const parsed = result.data;

    const nombresVarExistentes = new Set(
      contexto.variables.map((v) => v.nombre.toLowerCase().trim())
    );
    const nombresHechosExistentes = new Set(
      contexto.hechos.map((h) => h.nombre.toLowerCase().trim())
    );

    return {
      resumen: parsed.resumen,
      variables: parsed.variables.map((v) => ({
        nombre: v.nombre.trim(),
        tipo: normalizarTipo(v.tipo),
        valor_por_defecto:
          v.valor_por_defecto !== undefined ? String(v.valor_por_defecto) : '',
        descripcion: v.descripcion || '',
        es_inicial: v.es_inicial ?? true,
        pregunta: v.pregunta || '',
        opciones: v.opciones?.map((o) => String(o)),
        yaExiste: nombresVarExistentes.has(v.nombre.toLowerCase().trim()),
      })),
      hechos: parsed.hechos.map((h) => ({
        nombre: h.nombre.trim(),
        valor: String(h.valor),
        tipo_dato: normalizarTipo(h.tipo_dato),
        descripcion: h.descripcion || '',
        es_inicial: h.es_inicial ?? false,
        pregunta: h.pregunta || '',
        yaExiste: nombresHechosExistentes.has(h.nombre.toLowerCase().trim()),
      })),
      reglas: parsed.reglas.map((r) => ({
        nombre: r.nombre.trim(),
        descripcion: r.descripcion || '',
        prioridad: r.prioridad,
        factor_certeza: Number(r.factor_certeza.toFixed(2)),
        condiciones: r.condiciones.map((c) => ({
          referencia: c.referencia.trim(),
          operador: normalizarOperador(c.operador),
          valor_esperado: String(c.valor_esperado),
        })),
        conclusiones: r.conclusiones.map((cl) => ({
          destino: cl.destino.trim(),
          valor_resultante: String(cl.valor_resultante),
        })),
      })),
    };
  },

  async generarCasosPruebaCompletos(
    contexto: ContextoBCInput,
    cantidadCasos = 4,
    enfoque: 'completo' | 'positivos' | 'borde' = 'completo',
    onToken?: (acumulado: string) => void
  ): Promise<CasoPruebaGeneradoIA[]> {
    const messages = construirPromptGenerarCasosPrueba(contexto, cantidadCasos, enfoque);
    const textoCrudo = await ejecutarChatCompleto(messages, {
      temperature: 0.25,
      maxTokens: 900,
      onToken,
    });

    const rawJson = extraerJsonDeRespuesta(textoCrudo);
    const listaCasosRaw: unknown[] = Array.isArray(rawJson)
      ? rawJson
      : rawJson && typeof rawJson === 'object'
      ? Array.isArray((rawJson as Record<string, unknown>).casos)
        ? ((rawJson as Record<string, unknown>).casos as unknown[])
        : Array.isArray((rawJson as Record<string, unknown>).cases)
        ? ((rawJson as Record<string, unknown>).cases as unknown[])
        : [rawJson]
      : [];

    const jsonNormalizado = {
      casos: listaCasosRaw
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((c, idx) => {
          const catRaw = String(c.categoria ?? c.category ?? 'positivo').toLowerCase();
          const categoria: 'positivo' | 'borde' | 'negativo' = catRaw.includes('bord') || catRaw.includes('lim')
            ? 'borde'
            : catRaw.includes('neg')
            ? 'negativo'
            : 'positivo';

          const entradaRaw = c.hechosEntrada ?? c.hechos ?? c.inputs ?? c.entrada ?? [];
          const hechosEntrada = Array.isArray(entradaRaw)
            ? entradaRaw
                .filter((h): h is Record<string, unknown> => Boolean(h && typeof h === 'object'))
                .map((h) => ({
                  nombre: String(h.nombre ?? h.name ?? h.variable ?? '').trim(),
                  valor: h.valor ?? h.value ?? '',
                }))
                .filter((h) => h.nombre.length > 0)
            : entradaRaw && typeof entradaRaw === 'object'
            ? Object.entries(entradaRaw as Record<string, unknown>).map(([nombre, valor]) => ({
                nombre,
                valor: typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean' ? valor : String(valor ?? ''),
              }))
            : [];

          return {
            titulo: String(c.titulo ?? c.title ?? c.nombre ?? `Caso de prueba ${idx + 1}`).trim(),
            categoria,
            descripcion: String(c.descripcion ?? c.description ?? '').trim(),
            hechosEntrada,
            conclusionEsperada: String(
              c.conclusionEsperada ?? c.conclusion_esperada ?? c.conclusion ?? c.expected ?? 'Sin conclusión'
            ).trim(),
            reglasEsperadas: Array.isArray(c.reglasEsperadas ?? c.reglas ?? c.expected_rules)
              ? ((c.reglasEsperadas ?? c.reglas ?? c.expected_rules) as unknown[]).map((r) => String(r))
              : [],
          };
        }),
    };

    const result = CasosPruebaIASchema.safeParse(jsonNormalizado);
    if (!result.success) {
      console.warn('[IA Local] Casos de prueba no pasaron validación:', {
        issues: result.error.issues,
        textoCrudo,
        jsonNormalizado,
      });
      throw new Error(
        'El modelo local no devolvió casos de prueba en el formato esperado. Intenta generar nuevamente.'
      );
    }
    const parsed = result.data;

    return parsed.casos.map((c, idx) => ({
      id: `caso-ia-${Date.now()}-${idx}`,
      titulo: c.titulo.trim(),
      categoria: c.categoria,
      descripcion: c.descripcion,
      hechosEntrada: c.hechosEntrada.map((h) => ({
        nombre: h.nombre.trim(),
        valor: String(h.valor),
      })),
      conclusionEsperada: c.conclusionEsperada,
      reglasEsperadas: c.reglasEsperadas,
    }));
  },

  async explicarReglaStream(
    regla: ContextoBCInput['reglas'][number],
    variables: ContextoBCInput['variables'],
    hechos: ContextoBCInput['hechos'],
    onToken: (acumulado: string) => void
  ): Promise<string> {
    const messages = construirPromptExplicarRegla(regla, variables, hechos);
    return ejecutarChatStream(messages, onToken, { temperature: 0.3, maxTokens: 700 });
  },

  async explicarSistemaExpertoStream(
    contexto: ContextoBCInput,
    onToken: (acumulado: string) => void
  ): Promise<string> {
    const messages = construirPromptExplicarSistemaExperto(contexto);
    return ejecutarChatStream(messages, onToken, { temperature: 0.35, maxTokens: 1200 });
  },

  async explicarTrazaInferenciaStream(
    explicacion: ExplicacionConclusion,
    onToken: (acumulado: string) => void
  ): Promise<string> {
    const messages = construirPromptExplicarTrazaInferencia(explicacion);
    return ejecutarChatStream(messages, onToken, { temperature: 0.35, maxTokens: 800 });
  },
};

export default iaLocalService;

