import type { TipoDato, Variable, Hecho } from '../types/types';

/**
 * Infiere el tipo de dato de un valor o variable:
 * 1. Si la variable ya está registrada en la lista de variables o hechos, retorna su tipo configurado.
 * 2. Si no, infiere por el valor:
 *    - 'true', 'false', 'si', 'no' -> BOOLEANO
 *    - Numérico con punto -> DECIMAL
 *    - Numérico entero -> ENTERO
 *    - Por defecto -> TEXTO
 */
export function inferirTipoDato(
  valor: string | undefined | null,
  varNombre?: string,
  variablesExistentes: Variable[] = [],
  hechosExistentes: Hecho[] = []
): TipoDato {
  if (varNombre && varNombre.trim()) {
    const nombreNormalizado = varNombre.trim().toLowerCase();
    const varEncontrada = variablesExistentes.find(
      (v) => v.nombre.trim().toLowerCase() === nombreNormalizado
    );
    if (varEncontrada?.tipo_dato) return varEncontrada.tipo_dato;
    if (varEncontrada?.tipo) return varEncontrada.tipo;

    const hechoEncontrado = hechosExistentes.find(
      (h) => h.nombre.trim().toLowerCase() === nombreNormalizado
    );
    if (hechoEncontrado?.tipo_dato) return hechoEncontrado.tipo_dato;
  }

  if (valor === undefined || valor === null) {
    return 'TEXTO';
  }

  const trimmed = String(valor).trim().toLowerCase();

  if (
    trimmed === 'true' ||
    trimmed === 'false' ||
    trimmed === 'si' ||
    trimmed === 'no' ||
    trimmed === 'sí' ||
    trimmed === 'verdadero' ||
    trimmed === 'falso'
  ) {
    return 'BOOLEANO';
  }

  if (trimmed !== '' && !isNaN(Number(trimmed))) {
    return trimmed.includes('.') ? 'DECIMAL' : 'ENTERO';
  }

  return 'TEXTO';
}
