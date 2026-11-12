import { describe, it, expect } from 'vitest';
import { evaluarExpresionLogica } from '../utils/evaluadorLogicaPremisas';

describe('evaluadorLogicaPremisas', () => {
  it('evalúa correctamente (A=b AND B=0) OR P>10', () => {
    const expr = '(A=b AND B=0) OR P>10';

    // P=15 cumple rama derecha
    expect(evaluarExpresionLogica(expr, { A: 'otro', B: 5, P: 15 })).toBe(true);

    // Rama izquierda cumple
    expect(evaluarExpresionLogica(expr, { A: 'b', B: 0, P: 5 })).toBe(true);

    // Ninguna cumple
    expect(evaluarExpresionLogica(expr, { A: 'c', B: 5, P: 5 })).toBe(false);
  });

  it('evalúa correctamente (A=b AND B=0) OR (P>10 AND P<100)', () => {
    const expr = '(A=b AND B=0) OR (P>10 AND P<100)';

    expect(evaluarExpresionLogica(expr, { A: 'x', B: 9, P: 50 })).toBe(true);
    expect(evaluarExpresionLogica(expr, { A: 'b', B: 0, P: 150 })).toBe(true);
    expect(evaluarExpresionLogica(expr, { A: 'x', B: 9, P: 150 })).toBe(false);
  });

  it('soporta conectores en español Y, O y negación NOT', () => {
    const expr = '(A=b Y B=0) O P>10';
    expect(evaluarExpresionLogica(expr, { A: 'b', B: 0, P: 2 })).toBe(true);

    const exprNot = 'NOT (A=b) AND P>10';
    expect(evaluarExpresionLogica(exprNot, { A: 'c', P: 20 })).toBe(true);
    expect(evaluarExpresionLogica(exprNot, { A: 'b', P: 20 })).toBe(false);
  });
});

