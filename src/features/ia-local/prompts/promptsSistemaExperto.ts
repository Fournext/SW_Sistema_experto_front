import type {
  Hecho,
  Regla,
  Variable,
} from '@/features/base-conocimiento/types/types';
import type { SistemaExperto } from '@/features/sistemas-expertos/types/types';
import type { ExplicacionConclusion } from '@/features/inferencia/types/types';

export interface ContextoBCInput {
  sistema?: Pick<SistemaExperto, 'nombre' | 'descripcion'> | null;
  variables: Variable[];
  hechos: Hecho[];
  reglas: Regla[];
}

const serializarVariables = (variables: Variable[]): string => {
  if (!variables.length) return 'Ninguna variable registrada aún.';
  return variables
    .map((v) => {
      const tipo = v.tipo || v.tipo_dato || 'TEXTO';
      const opciones = v.opciones?.length ? ` [opciones: ${v.opciones.join(', ')}]` : '';
      const inicial = v.es_inicial ? ' (inicial/preguntable)' : '';
      return `- ${v.nombre} : ${tipo}${opciones}${inicial}`;
    })
    .join('\n');
};

const serializarHechos = (hechos: Hecho[]): string => {
  if (!hechos.length) return 'Ningún hecho registrado aún.';
  return hechos
    .map((h) => {
      const tipo = h.tipo_dato || 'TEXTO';
      const val = h.valor != null && String(h.valor).trim() !== '' ? String(h.valor) : '(sin valor fijo)';
      return `- ${h.nombre} = ${val} [${tipo}]`;
    })
    .join('\n');
};

const resolverNombreVarOHecho = (
  idVar: unknown,
  idHecho: unknown,
  fallback: unknown,
  variables: Variable[],
  hechos: Hecho[]
): string => {
  if (idVar != null) {
    const v = variables.find((item) => String(item.id) === String(idVar));
    if (v) return v.nombre;
  }
  if (idHecho != null) {
    const h = hechos.find((item) => String(item.id) === String(idHecho));
    if (h) return h.nombre;
  }
  return fallback ? String(fallback) : 'elemento';
};

export const serializarReglasLegibles = (
  reglas: Regla[],
  variables: Variable[],
  hechos: Hecho[]
): string => {
  if (!reglas.length) return 'Ninguna regla registrada aún.';
  return reglas
    .map((r) => {
      const conds = (r.condiciones || [])
        .map((c) => {
          const raw = c as unknown as Record<string, unknown>;
          const nombre = resolverNombreVarOHecho(
            c.variable_id ?? raw.variable,
            c.hecho_id ?? raw.hecho,
            c.referencia ?? raw.variable_nombre ?? raw.hecho_nombre,
            variables,
            hechos
          );
          const op = c.operador === '=' ? '==' : c.operador || '==';
          return `${nombre} ${op} ${c.valor_esperado}`;
        })
        .join(' AND ');

      const concls = (r.conclusiones || [])
        .map((cl) => {
          const raw = cl as unknown as Record<string, unknown>;
          const destino = resolverNombreVarOHecho(
            cl.variable_resultante_id ?? raw.variable_resultante,
            cl.hecho_resultante_id ?? raw.hecho_resultante,
            cl.destino ?? raw.variable_nombre ?? raw.hecho_nombre,
            variables,
            hechos
          );
          return `${destino} = ${cl.valor_resultante}`;
        })
        .join(' AND ');

      return `[${r.nombre}] (P:${r.prioridad}, FC:${r.factor_certeza}) IF ${conds || '(sin condiciones)'} THEN ${concls || '(sin conclusiones)'}${r.descripcion ? ` // ${r.descripcion}` : ''}`;
    })
    .join('\n');
};

export function construirPromptGenerarReglas(
  contexto: ContextoBCInput,
  instruccionUsuario: string,
  cantidadReglas: number,
  soloVariablesExistentes: boolean
) {
  const system = `Eres un ingeniero de sistemas expertos.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni bloques markdown.
Reglas técnicas:
- Tipos válidos: "TEXTO", "ENTERO", "DECIMAL", "BOOLEANO", "OPCION".
- Operadores válidos: "==", "!=", ">", "<", ">=", "<=".
- Valores booleanos: "true" o "false".
- Nombres de variables en snake_case sin tildes ni espacios.
- Todas las variables, hechos y reglas deben pertenecer EXCLUSIVAMENTE al dominio solicitado por el usuario.`;

  const seccionesExistentes: string[] = [];
  if (contexto.variables.length > 0) {
    seccionesExistentes.push(`VARIABLES EXISTENTES:\n${serializarVariables(contexto.variables)}`);
  }
  if (contexto.hechos.length > 0) {
    seccionesExistentes.push(`HECHOS EXISTENTES:\n${serializarHechos(contexto.hechos)}`);
  }
  if (contexto.reglas.length > 0) {
    seccionesExistentes.push(
      `REGLAS EXISTENTES:\n${serializarReglasLegibles(contexto.reglas, contexto.variables, contexto.hechos)}`
    );
  }

  const bloqueContexto =
    seccionesExistentes.length > 0
      ? `\n${seccionesExistentes.join('\n\n')}\n`
      : '\nBase de conocimiento vacía: debes proponer todas las variables de entrada y salida necesarias.\n';

  const reglaVariables = soloVariablesExistentes
    ? 'Usa únicamente las variables y hechos existentes.'
    : 'Crea las variables de entrada y de conclusión necesarias para que las reglas funcionen.';

  const user = `Sistema Experto: ${contexto.sistema?.nombre || 'Sistema Experto'}
${bloqueContexto}
Solicitud del usuario: "${instruccionUsuario}"
${reglaVariables}
Genera exactamente ${cantidadReglas} regla(s) reales y específicas sobre: ${instruccionUsuario}.

Devuelve ÚNICAMENTE un objeto JSON válido con estas claves exactas:
- "resumen": texto corto describiendo el dominio solicitado.
- "variables": lista de objetos con "nombre" (identificador real en snake_case del dominio, ej. acorde al tema pedido), "tipo" ("ENTERO" | "DECIMAL" | "BOOLEANO" | "TEXTO" | "OPCION"), "descripcion" (texto), "es_inicial" (true para entradas, false para conclusiones), "pregunta" (pregunta al usuario si es entrada).
- "hechos": [] (lista vacía, salvo que se requiera un hecho inicial con valor concreto).
- "reglas": lista de ${cantidadReglas} objeto(s), cada uno con:
  - "nombre": identificador corto único en PascalCase o snake_case acorde al dominio.
  - "descripcion": qué evalúa la regla.
  - "prioridad": número entero (ej. 10).
  - "factor_certeza": número decimal entre 0 y 1 (ej. 0.95).
  - "condiciones": lista no vacía de objetos { "referencia": nombre de variable de entrada, "operador": "==" | "!=" | ">" | "<" | ">=" | "<=", "valor_esperado": valor umbral o esperado }.
  - "conclusiones": lista no vacía de objetos { "destino": nombre de variable de conclusión, "valor_resultante": resultado }.

No uses nombres genéricos ni de relleno. Responde SOLO con el JSON:`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

export function construirPromptGenerarCasosPrueba(
  contexto: ContextoBCInput,
  cantidadCasos: number,
  enfoque: 'completo' | 'positivos' | 'borde'
) {
  const system = `Eres un especialista en QA y verificación formal de sistemas expertos basados en reglas.
Tu tarea es diseñar casos de prueba completos (vectores de hechos iniciales de entrada + conclusión esperada) para probar el motor de encadenamiento hacia adelante.
Responde ÚNICAMENTE con un objeto JSON válido, sin explicaciones fuera del JSON.`;

  const guiaEnfoque =
    enfoque === 'positivos'
      ? 'Genera casos positivos que activen distintas reglas y cadenas de inferencia.'
      : enfoque === 'borde'
      ? 'Incluye casos límite en los umbrales numéricos (ej. valores exactos de >=, >, <) y al menos un caso negativo donde no se dispare ninguna conclusión.'
      : 'Cubre de forma equilibrada: casos positivos principales, casos límite en umbrales y al menos un caso negativo sin disparo.';

  const user = `Sistema Experto: ${contexto.sistema?.nombre || 'Sin nombre'}

VARIABLES DISPONIBLES:
${serializarVariables(contexto.variables)}

HECHOS EXISTENTES:
${serializarHechos(contexto.hechos)}

REGLAS ACTUALES DEL MOTOR:
${serializarReglasLegibles(contexto.reglas, contexto.variables, contexto.hechos)}

Genera exactamente ${cantidadCasos} casos de prueba completos basados ÚNICAMENTE en las variables y reglas reales listadas arriba. ${guiaEnfoque}
Cada hecho en "hechosEntrada" debe usar el nombre exacto de la variable o hecho evaluado en las condiciones de las reglas reales (NO inventes nombres genéricos).

Devuelve ÚNICAMENTE un objeto JSON válido con la clave "casos" (lista de ${cantidadCasos} objeto(s)), donde cada caso tenga:
- "titulo": título corto del escenario.
- "categoria": "positivo" | "borde" | "negativo".
- "descripcion": qué regla o situación verifica.
- "hechosEntrada": lista de objetos { "nombre": nombre exacto de la variable o hecho real, "valor": valor concreto de prueba }.
- "conclusionEsperada": conclusión esperada (o "Sin conclusión" si es negativo).
- "reglasEsperadas": lista de nombres exactos de las reglas que deberían activarse.`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

export function construirPromptExplicarRegla(
  regla: Regla,
  variables: Variable[],
  hechos: Hecho[]
) {
  const serializada = serializarReglasLegibles([regla], variables, hechos);
  return [
    {
      role: 'system' as const,
      content:
        'Eres un docente de Ingeniería del Conocimiento. Explica reglas de sistemas expertos en español claro, preciso y didáctico, sin inventar condiciones que no estén en la regla.',
    },
    {
      role: 'user' as const,
      content: `Explica detalladamente la siguiente regla de producción:
${serializada}

Estructura tu respuesta en 3 apartados breves con Markdown simple:
1. **Propósito de la regla**: Qué situación detecta o concluye.
2. **Condiciones necesarias (IF)** y **Deducción (THEN)**: Qué valores deben cumplirse y qué nuevo hecho o variable establece.
3. **Peso e inferencia**: Qué implican su prioridad (${regla.prioridad}) y su factor de certeza (${regla.factor_certeza}).`,
    },
  ];
}

export function construirPromptExplicarSistemaExperto(contexto: ContextoBCInput) {
  return [
    {
      role: 'system' as const,
      content:
        'Eres un arquitecto de Sistemas Expertos. Analiza la Base de Conocimiento proporcionada y genera una explicación integral y didáctica en español usando únicamente los elementos reales recibidos.',
    },
    {
      role: 'user' as const,
      content: `Analiza y explica este Sistema Experto completo:
Nombre: ${contexto.sistema?.nombre || 'Sistema Experto'}
Descripción registrada: ${contexto.sistema?.descripcion || 'Sin descripción'}

Variables (${contexto.variables.length}):
${serializarVariables(contexto.variables)}

Hechos (${contexto.hechos.length}):
${serializarHechos(contexto.hechos)}

Reglas (${contexto.reglas.length}):
${serializarReglasLegibles(contexto.reglas, contexto.variables, contexto.hechos)}

Redacta un análisis claro con:
1. **Objetivo y Dominio del Sistema**: Qué problema resuelve.
2. **Entradas y Conocimiento Base**: Cómo participan las variables iniciales y los hechos.
3. **Lógica de Encadenamiento**: Cómo se conectan las reglas entre sí para llegar a las conclusiones finales.
4. **Observaciones o Recomendaciones**: Si notas huecos, reglas aisladas o posibles mejoras en la cobertura.`,
    },
  ];
}

export function construirPromptExplicarTrazaInferencia(
  explicacion: ExplicacionConclusion
) {
  const hechosTxt = (explicacion.hechos_iniciales_relevantes || [])
    .map((h) => `- ${h.nombre} = ${String(h.valor)}`)
    .join('\n');

  const reglasTxt = (explicacion.reglas_disparadas || [])
    .map(
      (r, idx) =>
        `${idx + 1}. ${r.nombre} (P:${r.prioridad ?? '-'}, FC:${r.factor_certeza ?? '-'}): SI [${(r.condiciones_cumplidas || []).join(' Y ')}] ENTONCES ${r.consecuencia}`
    )
    .join('\n');

  const conclusionTxt =
    explicacion.conclusion_nombre != null && explicacion.conclusion_valor != null
      ? `${explicacion.conclusion_nombre} = ${String(explicacion.conclusion_valor)}`
      : explicacion.conclusion || 'Sin conclusión alcanzada';

  return [
    {
      role: 'system' as const,
      content:
        'Eres un asistente explicativo de un motor de inferencia simbólica. Traduce la traza determinista a una explicación clara en español para un usuario o estudiante, respetando fielmente los hechos y reglas ejecutadas.',
    },
    {
      role: 'user' as const,
      content: `Explica en lenguaje natural por qué el motor llegó a esta conclusión:

Conclusión final: ${conclusionTxt} (Factor de certeza: ${explicacion.factor_certeza_final ?? 'N/A'})

Hechos iniciales relevantes:
${hechosTxt || 'Ninguno registrado'}

Secuencia de reglas disparadas:
${reglasTxt || 'Ninguna regla disparada'}

Redacta una explicación fluida en 2 o 3 párrafos cortos que justifique el resultado ante el usuario final.`,
    },
  ];
}

