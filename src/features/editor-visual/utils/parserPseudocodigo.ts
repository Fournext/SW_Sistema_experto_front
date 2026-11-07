import type { Regla, Variable } from '@/features/base-conocimiento/types/types';

export interface CondicionParseada {
  variable_nombre: string;
  operador: string;
  valor_esperado: string;
}

export interface ConclusionParseada {
  variable_nombre: string;
  valor_resultante: string;
}

export interface ReglaParseada {
  nombre: string;
  prioridad: number;
  descripcion?: string;
  condiciones: CondicionParseada[];
  conclusiones: ConclusionParseada[];
  lineaInicio: number;
}

export interface ErrorParseo {
  linea: number;
  mensaje: string;
}

export interface ResultadoParseo {
  exito: boolean;
  reglas: ReglaParseada[];
  errores: ErrorParseo[];
}

/**
 * Genera una representación en pseudocódigo limpio y legible a partir de las reglas de la BC.
 */
export function generarPseudocodigo(reglas: Regla[], variablesExistentes?: Variable[]): string {
  if (!reglas || reglas.length === 0) {
    return [
      '// Escribe o pega tus reglas en pseudocódigo.',
      '// Formato compatible:',
      '//   R1 [Prioridad: 10]:',
      '//     SI X = 0 Y Z = 0',
      '//     ENTONCES P = a',
      '//',
      '// O en una sola línea:',
      '//   R2: IF H != a THEN X = 20',
      '',
      'R1 [Prioridad: 10]:',
      '  SI X = 0',
      '  ENTONCES P = a',
    ].join('\n');
  }

  // Mapa de variables para resolver IDs si fuera necesario
  const varMap = new Map<string, string>();
  (variablesExistentes || []).forEach((v) => {
    varMap.set(String(v.id), v.nombre);
  });

  const lineas: string[] = [];

  reglas.forEach((r, idx) => {
    const nombre = r.nombre || `R${idx + 1}`;
    const prioridad = r.prioridad !== undefined ? r.prioridad : 10;
    
    // Encabezado de la regla
    lineas.push(`${nombre} [Prioridad: ${prioridad}]:`);

    // Premisas / Condiciones
    if (r.condiciones && r.condiciones.length > 0) {
      const condsStr = r.condiciones
        .map((c) => {
          const varNombre =
            c.variable_nombre ||
            (c.variable_id ? varMap.get(String(c.variable_id)) : '') ||
            c.hecho_nombre ||
            c.referencia ||
            'variable';
          const op = (typeof c.operador === 'string' ? c.operador : (c.operador as any)?.value) || '=';
          const valor = c.valor_esperado !== undefined ? String(c.valor_esperado) : '';
          return `${varNombre} ${op} ${valor}`;
        })
        .join(' Y ');
      lineas.push(`  SI ${condsStr}`);
    } else {
      lineas.push('  SI verdadero');
    }

    // Conclusiones / Consecuencias
    if (r.conclusiones && r.conclusiones.length > 0) {
      const concsStr = r.conclusiones
        .map((c) => {
          const varNombre =
            c.variable_nombre ||
            (c.variable_resultante_id ? varMap.get(String(c.variable_resultante_id)) : '') ||
            (c as any).hecho_nombre ||
            (c as any).referencia ||
            'variable';
          const valor = c.valor_resultante !== undefined ? String(c.valor_resultante) : '';
          return `${varNombre} = ${valor}`;
        })
        .join(' Y ');
      lineas.push(`  ENTONCES ${concsStr}`);
    } else {
      lineas.push('  ENTONCES accion = verdadera');
    }

    lineas.push(''); // Separador visual entre reglas
  });

  return lineas.join('\n').trimEnd();
}

/**
 * Parsea una sola condición en formato "Variable Operador Valor"
 */
function parsearCondicion(texto: string): CondicionParseada | null {
  const t = texto.trim();
  if (!t) return null;

  // Buscar operadores de dos caracteres primero: !=, ==, >=, <=
  const opMatch = t.match(/\s*(>=|<=|!=|==|=|>|<)\s*/);
  if (!opMatch || opMatch.index === undefined) {
    // Si no tiene operador explícito, ej: "soleado", asumir = "true" o booleano
    return {
      variable_nombre: t,
      operador: '=',
      valor_esperado: 'true',
    };
  }

  const op = opMatch[0].trim() === '==' ? '=' : opMatch[0].trim();
  const varNombre = t.substring(0, opMatch.index).trim();
  const valor = t.substring(opMatch.index + opMatch[0].length).trim();

  if (!varNombre) return null;

  return {
    variable_nombre: varNombre,
    operador: op,
    valor_esperado: valor.replace(/^['"]|['"]$/g, ''), // Quitar comillas si las tuviera
  };
}

/**
 * Parsea una conclusión en formato "Variable = Valor"
 */
function parsearConclusion(texto: string): ConclusionParseada | null {
  const t = texto.trim();
  if (!t) return null;

  const eqMatch = t.match(/\s*(=|:=|==)\s*/);
  if (!eqMatch || eqMatch.index === undefined) {
    return {
      variable_nombre: t,
      valor_resultante: 'true',
    };
  }

  const varNombre = t.substring(0, eqMatch.index).trim();
  const valor = t.substring(eqMatch.index + eqMatch[0].length).trim();

  if (!varNombre) return null;

  return {
    variable_nombre: varNombre,
    valor_resultante: valor.replace(/^['"]|['"]$/g, ''),
  };
}

/**
 * Parsea un código completo en pseudocódigo produciendo una lista de reglas parseadas.
 */
export function parsearPseudocodigo(codigo: string): ResultadoParseo {
  const lineas = codigo.split(/\r?\n/);
  const reglas: ReglaParseada[] = [];
  const errores: ErrorParseo[] = [];

  let reglaActual: Partial<ReglaParseada> | null = null;
  let condicionesTexto = '';
  let conclusionesTexto = '';
  let lineaInicioRegla = 1;

  const finalizarReglaActual = () => {
    if (!reglaActual || !reglaActual.nombre) return;

    // Procesar condiciones acumuladas
    const condiciones: CondicionParseada[] = [];
    if (condicionesTexto.trim()) {
      // Dividir por Y / AND / && o comas
      const partesCond = condicionesTexto.split(/\s+(?:Y|AND|&&)\s+|,\s*/i);
      for (const p of partesCond) {
        const c = parsearCondicion(p);
        if (c) {
          condiciones.push(c);
        } else if (p.trim()) {
          errores.push({
            linea: lineaInicioRegla,
            mensaje: `En ${reglaActual.nombre}: No se pudo interpretar la condición "${p.trim()}".`,
          });
        }
      }
    }

    // Procesar conclusiones acumuladas
    const conclusiones: ConclusionParseada[] = [];
    if (conclusionesTexto.trim()) {
      const partesConc = conclusionesTexto.split(/\s+(?:Y|AND|&&)\s+|,\s*/i);
      for (const p of partesConc) {
        const conc = parsearConclusion(p);
        if (conc) {
          conclusiones.push(conc);
        } else if (p.trim()) {
          errores.push({
            linea: lineaInicioRegla,
            mensaje: `En ${reglaActual.nombre}: No se pudo interpretar la conclusión "${p.trim()}".`,
          });
        }
      }
    }

    if (condiciones.length === 0) {
      errores.push({
        linea: lineaInicioRegla,
        mensaje: `La regla "${reglaActual.nombre}" no tiene condiciones (IF/SI).`,
      });
    }

    if (conclusiones.length === 0) {
      errores.push({
        linea: lineaInicioRegla,
        mensaje: `La regla "${reglaActual.nombre}" no tiene consecuencias (THEN/ENTONCES).`,
      });
    }

    reglas.push({
      nombre: reglaActual.nombre,
      prioridad: reglaActual.prioridad ?? 10,
      descripcion: reglaActual.descripcion || '',
      condiciones,
      conclusiones,
      lineaInicio: lineaInicioRegla,
    });

    reglaActual = null;
    condicionesTexto = '';
    conclusionesTexto = '';
  };

  for (let i = 0; i < lineas.length; i++) {
    const numLinea = i + 1;
    const lineaRaw = lineas[i];
    const linea = lineaRaw.trim();

    // Ignorar líneas vacías y comentarios (// o #)
    if (!linea || linea.startsWith('//') || linea.startsWith('#')) {
      continue;
    }

    // Caso A: Formato en una sola línea estilo Cuaderno:
    // Ej: "R1: IF X = 0 AND Z = 0 THEN P = a" o "R1) IF X = 0 THEN P = a"
    const singleLineMatch = linea.match(/^(?:REGLA\s+)?([A-Za-z0-9_-]+)(?:\s*\[(?:prioridad|p):?\s*(\d+)\])?\s*[:\)]\s*(?:IF|SI)\s+(.+?)\s+(?:THEN|ENTONCES)\s+(.+)$/i);
    if (singleLineMatch) {
      finalizarReglaActual();
      const nombre = singleLineMatch[1].trim();
      const prio = singleLineMatch[2] ? parseInt(singleLineMatch[2], 10) : 10;
      const rawConds = singleLineMatch[3];
      const rawConcs = singleLineMatch[4];

      reglaActual = { nombre, prioridad: prio };
      condicionesTexto = rawConds;
      conclusionesTexto = rawConcs;
      lineaInicioRegla = numLinea;
      finalizarReglaActual();
      continue;
    }

    // Caso B: Encabezado de regla en bloque
    // Ej: "REGLA R1 [Prioridad: 10]:" o "R1 [Prioridad: 10]:" o "R1:"
    const headerMatch = linea.match(/^(?:REGLA\s+)?([A-Za-z0-9_-]+)(?:\s*\[(?:prioridad|p):?\s*(\d+)\])?\s*[:\)]?$/i);
    // Verificar que no sea una palabra clave como SI o ENTONCES
    const esKeyword = /^(?:SI|IF|ENTONCES|THEN)\b/i.test(linea);

    if (headerMatch && !esKeyword) {
      finalizarReglaActual();
      const nombre = headerMatch[1].trim();
      const prio = headerMatch[2] ? parseInt(headerMatch[2], 10) : 10;
      reglaActual = { nombre, prioridad: prio };
      lineaInicioRegla = numLinea;
      continue;
    }

    // Caso C: Cláusula SI / IF en bloque
    const siMatch = linea.match(/^(?:SI|IF)\s+(.+)$/i);
    if (siMatch) {
      if (!reglaActual) {
        // Asignar nombre automático si no tenía encabezado previo
        reglaActual = { nombre: `R${reglas.length + 1}`, prioridad: 10 };
        lineaInicioRegla = numLinea;
      }
      condicionesTexto = (condicionesTexto ? condicionesTexto + ' Y ' : '') + siMatch[1].trim();
      continue;
    }

    // Caso D: Cláusula ENTONCES / THEN en bloque
    const entoncesMatch = linea.match(/^(?:ENTONCES|THEN)\s+(.+)$/i);
    if (entoncesMatch) {
      if (!reglaActual) {
        errores.push({
          linea: numLinea,
          mensaje: `Se encontró "ENTONCES" sin una regla iniciada previamente.`,
        });
        continue;
      }
      conclusionesTexto = (conclusionesTexto ? conclusionesTexto + ' Y ' : '') + entoncesMatch[1].trim();
      continue;
    }

    // Caso E: Continuación de condición o conclusión
    if (reglaActual) {
      if (conclusionesTexto) {
        conclusionesTexto += ' Y ' + linea;
      } else if (condicionesTexto) {
        condicionesTexto += ' Y ' + linea;
      } else {
        errores.push({
          linea: numLinea,
          mensaje: `Línea no reconocida: "${linea}". Usa "SI ... " o "ENTONCES ...".`,
        });
      }
      continue;
    }

    // Línea huérfana
    errores.push({
      linea: numLinea,
      mensaje: `Sintaxis no válida en línea ${numLinea}: "${linea}".`,
    });
  }

  // Finalizar última regla pendiente si existe
  finalizarReglaActual();

  return {
    exito: errores.length === 0 && reglas.length > 0,
    reglas,
    errores,
  };
}
