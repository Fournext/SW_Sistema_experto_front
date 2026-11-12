import { describe, it, expect } from 'vitest';
import { parsearPseudocodigo, generarPseudocodigo } from '../utils/parserPseudocodigo';
import type { Regla } from '../../base-conocimiento/types/types';

describe('parserPseudocodigo', () => {
  it('parsea correctamente el formato de una sola línea (estilo cuaderno)', () => {
    const codigo = `
      R1) IF X = 0 THEN P = a
      R2: IF X = 0 THEN C = b
      R3: IF P = a THEN C = a
      R4: IF S > 4 THEN C = b
      R5: IF S < 4 THEN P = a
      R6: IF S = 10 THEN Q = a
    `;

    const res = parsearPseudocodigo(codigo);
    expect(res.errores).toHaveLength(0);
    expect(res.exito).toBe(true);
    expect(res.reglas).toHaveLength(6);

    expect(res.reglas[0].nombre).toBe('R1');
    expect(res.reglas[0].condiciones[0]).toEqual({
      variable_nombre: 'X',
      operador: '=',
      valor_esperado: '0',
    });
    expect(res.reglas[0].conclusiones[0]).toEqual({
      variable_nombre: 'P',
      valor_resultante: 'a',
    });

    // R4 tiene operador >
    expect(res.reglas[3].nombre).toBe('R4');
    expect(res.reglas[3].condiciones[0].operador).toBe('>');
    expect(res.reglas[3].condiciones[0].valor_esperado).toBe('4');
  });

  it('parsea el formato en bloque con prioridades y múltiples premisas', () => {
    const codigo = `
      // Regla principal
      REGLA R1 [Prioridad: 10]:
        SI X > 0 Y Z = 0
        ENTONCES P = a

      REGLA R2 [P: 8]:
        SI H != a
        ENTONCES X = 20 Y W = true
    `;

    const res = parsearPseudocodigo(codigo);
    expect(res.errores).toHaveLength(0);
    expect(res.reglas).toHaveLength(2);

    expect(res.reglas[0].nombre).toBe('R1');
    expect(res.reglas[0].prioridad).toBe(10);
    expect(res.reglas[0].condiciones).toHaveLength(2);
    expect(res.reglas[0].condiciones[0]).toEqual({
      variable_nombre: 'X',
      operador: '>',
      valor_esperado: '0',
    });
    expect(res.reglas[0].condiciones[1]).toEqual({
      variable_nombre: 'Z',
      operador: '=',
      valor_esperado: '0',
    });

    expect(res.reglas[1].nombre).toBe('R2');
    expect(res.reglas[1].prioridad).toBe(8);
    expect(res.reglas[1].condiciones[0]).toEqual({
      variable_nombre: 'H',
      operador: '!=',
      valor_esperado: 'a',
    });
    expect(res.reglas[1].conclusiones).toHaveLength(2);
  });

  it('detecta errores de sintaxis en reglas mal formadas', () => {
    const codigo = `
      REGLA R1:
        SI
        ENTONCES P = a
    `;

    const res = parsearPseudocodigo(codigo);
    expect(res.exito).toBe(false);
    expect(res.errores.length).toBeGreaterThan(0);
  });

  it('genera pseudocódigo coherente a partir de reglas existentes', () => {
    const reglasMock: Regla[] = [
      {
        id: '1',
        nombre: 'R1',
        prioridad: 10,
        factor_certeza: 1,
        activa: true,
        condiciones: [
          { id: 'c1', variable_nombre: 'X', operador: '=', valor_esperado: '0' },
        ],
        conclusiones: [
          { id: 'con1', variable_nombre: 'P', valor_resultante: 'a' },
        ],
      },
    ];

    const generado = generarPseudocodigo(reglasMock);
    expect(generado).toContain('R1 [Prioridad: 10]:');
    expect(generado).toContain('SI X = 0');
    expect(generado).toContain('ENTONCES P = a');
  });

  it('parsea correctamente premisas complejas con OR, AND y paréntesis', () => {
    const codigo = `
      R1: IF (A=b AND B=0) OR P>10 THEN resultado = 'aprobado'
      R2: IF (A=b AND B=0) OR (P>10 AND P<100) THEN resultado = 'valido'
    `;

    const res = parsearPseudocodigo(codigo);
    expect(res.exito).toBe(true);
    expect(res.reglas).toHaveLength(2);

    expect(res.reglas[0].nombre).toBe('R1');
    expect(res.reglas[0].expresion_logica).toBe('(A=b AND B=0) OR P>10');
    expect(res.reglas[0].condiciones.length).toBeGreaterThanOrEqual(3);

    expect(res.reglas[1].nombre).toBe('R2');
    expect(res.reglas[1].expresion_logica).toBe('(A=b AND B=0) OR (P>10 AND P<100)');
  });
});

