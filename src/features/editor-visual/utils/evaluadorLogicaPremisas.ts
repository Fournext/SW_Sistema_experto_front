/**
 * Evaluador de expresiones lógicas booleanas para premisas complejas en el Frontend.
 * Soporta AND (Y, &&), OR (O, ||), NOT (NO, !), paréntesis y comparaciones relacionales.
 */

interface Token {
  tipo: 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN' | 'ATOM';
  valor: string;
}

export function tokenizarExpresion(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = expr.length;

  while (i < n) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ tipo: 'LPAREN', valor: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ tipo: 'RPAREN', valor: ')' });
      i++;
      continue;
    }

    if (expr.slice(i, i + 2) === '&&') {
      tokens.push({ tipo: 'AND', valor: 'AND' });
      i += 2;
      continue;
    }
    if (expr.slice(i, i + 2) === '||') {
      tokens.push({ tipo: 'OR', valor: 'OR' });
      i += 2;
      continue;
    }
    if (ch === '!' && expr[i + 1] !== '=') {
      tokens.push({ tipo: 'NOT', valor: 'NOT' });
      i++;
      continue;
    }

    // Identificar palabras reservadas AND, OR, Y, O, NOT, NO
    const matchPalabra = expr.slice(i).match(/^[A-Za-z_áéíóúÁÉÍÓÚñÑ][\wáéíóúÁÉÍÓÚñÑ]*/);
    if (matchPalabra) {
      const palabra = matchPalabra[0];
      const palabraUpper = palabra.toUpperCase();
      if (palabraUpper === 'AND' || palabraUpper === 'Y') {
        tokens.push({ tipo: 'AND', valor: 'AND' });
        i += palabra.length;
        continue;
      }
      if (palabraUpper === 'OR' || palabraUpper === 'O') {
        tokens.push({ tipo: 'OR', valor: 'OR' });
        i += palabra.length;
        continue;
      }
      if (palabraUpper === 'NOT' || palabraUpper === 'NO') {
        tokens.push({ tipo: 'NOT', valor: 'NOT' });
        i += palabra.length;
        continue;
      }
    }

    // Átomo relacional
    let atomo = '';
    while (i < n) {
      if (expr[i] === '(' || expr[i] === ')') break;
      if (expr.slice(i, i + 2) === '&&' || expr.slice(i, i + 2) === '||') break;
      const sub = expr.slice(i);
      const mOp = sub.match(/^\s+(AND|OR|Y|O|NOT|NO)\b/i);
      if (mOp && atomo.trim().length > 0) break;
      atomo += expr[i];
      i++;
    }

    if (atomo.trim()) {
      tokens.push({ tipo: 'ATOM', valor: atomo.trim() });
    }
  }

  return tokens;
}

export function evaluarAtomo(texto: string, memoria: Record<string, any>): boolean {
  const ops = ['>=', '<=', '!=', '<>', '==', '=', '>', '<'];
  let varNombre = texto;
  let op = '=';
  let valorEsperado = 'true';

  for (const o of ops) {
    const idx = texto.indexOf(o);
    if (idx !== -1) {
      varNombre = texto.slice(0, idx).trim();
      op = o === '==' ? '=' : o === '<>' ? '!=' : o;
      valorEsperado = texto.slice(idx + o.length).trim().replace(/^['"]|['"]$/g, '');
      break;
    }
  }

  // Buscar variable en memoria (case-insensitive)
  let valorActual: any = undefined;
  if (varNombre in memoria) {
    valorActual = memoria[varNombre];
  } else {
    const lower = varNombre.toLowerCase();
    for (const [k, v] of Object.entries(memoria)) {
      if (k.toLowerCase() === lower) {
        valorActual = v;
        break;
      }
    }
  }

  if (valorActual === undefined || valorActual === null || valorActual === '') {
    return false;
  }

  // Comparación booleana
  if (
    typeof valorActual === 'boolean' ||
    ['true', 'false', 'verdadero', 'falso', 'si', 'no'].includes(valorEsperado.toLowerCase())
  ) {
    const toBool = (val: any) =>
      typeof val === 'boolean' ? val : ['true', '1', 'si', 'sí', 'verdadero'].includes(String(val).toLowerCase());
    const bAct = toBool(valorActual);
    const bEsp = toBool(valorEsperado);
    return op === '=' ? bAct === bEsp : op === '!=' ? bAct !== bEsp : false;
  }

  // Comparación numérica
  const numAct = Number(valorActual);
  const numEsp = Number(valorEsperado);
  if (!isNaN(numAct) && !isNaN(numEsp)) {
    switch (op) {
      case '=': return numAct === numEsp;
      case '!=': return numAct !== numEsp;
      case '>': return numAct > numEsp;
      case '<': return numAct < numEsp;
      case '>=': return numAct >= numEsp;
      case '<=': return numAct <= numEsp;
      default: return false;
    }
  }

  // Comparación de texto
  const strAct = String(valorActual).trim().toLowerCase();
  const strEsp = valorEsperado.trim().toLowerCase();
  if (op === '=') return strAct === strEsp;
  if (op === '!=') return strAct !== strEsp;

  return false;
}

export function evaluarExpresionLogica(expr: string, memoria: Record<string, any>): boolean {
  if (!expr || !expr.trim()) return true;

  try {
    const tokens = tokenizarExpresion(expr);
    if (tokens.length === 0) return true;

    let pos = 0;

    const actual = () => tokens[pos];
    const consumir = () => tokens[pos++];

    const parseExpr = (): boolean => parseOr();

    const parseOr = (): boolean => {
      let res = parseAnd();
      while (actual() && actual().tipo === 'OR') {
        consumir();
        const derecha = parseAnd();
        res = res || derecha;
      }
      return res;
    };

    const parseAnd = (): boolean => {
      let res = parseNot();
      while (actual() && actual().tipo === 'AND') {
        consumir();
        const derecha = parseNot();
        res = res && derecha;
      }
      return res;
    };

    const parseNot = (): boolean => {
      if (actual() && actual().tipo === 'NOT') {
        consumir();
        return !parseNot();
      }
      return parseFactor();
    };

    const parseFactor = (): boolean => {
      const tok = actual();
      if (!tok) return false;

      if (tok.tipo === 'LPAREN') {
        consumir();
        const res = parseExpr();
        if (actual() && actual().tipo === 'RPAREN') {
          consumir();
        }
        return res;
      }

      if (tok.tipo === 'ATOM') {
        consumir();
        return evaluarAtomo(tok.valor, memoria);
      }

      return false;
    };

    return parseExpr();
  } catch (err) {
    console.error('Error evaluando expresión lógica en frontend:', err);
    return false;
  }
}

