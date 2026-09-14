import { describe, it, expect } from 'vitest';
import { construirGrafoBaseConocimiento } from '../utils/grafoBaseConocimiento';
import type { Hecho, Variable, Regla } from '@/features/base-conocimiento/types/types';

describe('construirGrafoBaseConocimiento', () => {
  it('construye la jerarquía pedagógica: Regla -> IF -> Condición -> THEN -> Conclusión', () => {
    const reglaEjemplo: Regla = {
      id: 1,
      nombre: 'R1',
      descripcion: 'Regla de prueba',
      prioridad: 1,
      factor_certeza: 1.0,
      activa: true,
      condiciones: [
        {
          id: 101,
          referencia: 'temperatura',
          operador: '>',
          valor_esperado: '38',
          orden: 1,
        },
      ],
      conclusiones: [
        {
          id: 201,
          destino: 'diagnostico',
          valor_resultante: 'Fiebre',
        },
      ],
    };

    const { nodes, edges } = construirGrafoBaseConocimiento([], [], [reglaEjemplo]);

    const nodoRegla = nodes.find((n) => n.type === 'REGLA');
    const nodoCond = nodes.find((n) => n.type === 'CONDICION');
    const nodoConcl = nodes.find((n) => n.type === 'CONCLUSION');

    expect(nodoRegla).toBeDefined();
    expect(nodoCond).toBeDefined();
    expect(nodoConcl).toBeDefined();

    // Jerarquía vertical: Regla arriba, Condición al medio, Conclusión abajo
    expect(nodoRegla!.position.y).toBeLessThan(nodoCond!.position.y);
    expect(nodoCond!.position.y).toBeLessThan(nodoConcl!.position.y);

    // Relación REGLA --[IF]--> CONDICIÓN
    const ifEdge = edges.find((e) => e.label === 'IF');
    expect(ifEdge).toBeDefined();
    expect(ifEdge!.source).toBe(nodoRegla!.id);
    expect(ifEdge!.target).toBe(nodoCond!.id);
    expect(ifEdge!.sourceHandle).toBe('bottom');
    expect(ifEdge!.targetHandle).toBe('top');

    // Relación CONDICIÓN --[THEN]--> CONCLUSIÓN
    const thenEdge = edges.find((e) => e.label === 'THEN');
    expect(thenEdge).toBeDefined();
    expect(thenEdge!.source).toBe(nodoCond!.id);
    expect(thenEdge!.target).toBe(nodoConcl!.id);
    expect(thenEdge!.sourceHandle).toBe('bottom');
    expect(thenEdge!.targetHandle).toBe('top');
  });

  it('resuelve correctamente relaciones con formato de Django backend (hecho_id, variable_id, variable_resultante_id)', () => {
    const hechos: Hecho[] = [
      {
        id: '62344eb8-0a11-42e5-b7f2-ea4abbfc5fa6',
        nombre: 'A',
        valor: 'true',
        tipo_dato: 'BOOLEANO',
        es_inicial: true,
      },
      {
        id: '99999999-0a11-42e5-b7f2-ea4abbfc5fa6',
        nombre: 'X',
        valor: 'false',
        tipo_dato: 'BOOLEANO',
        es_inicial: false,
      },
    ];

    const variables: Variable[] = [
      {
        id: 'fd845f63-80ac-4570-929c-e9bad2f5f941',
        nombre: 'B',
        tipo: 'TEXTO',
      },
      {
        id: '66d43967-50af-46a7-808b-7709d410c9af',
        nombre: 'C',
        tipo: 'TEXTO',
      },
    ];

    const reglas: Regla[] = [
      {
        id: '6d412e98-c9d7-450a-b78f-983de1cc0a79',
        nombre: 'R1',
        descripcion: 'regla 1',
        prioridad: 1,
        factor_certeza: '0.00',
        activa: true,
        condiciones: [
          {
            id: '9ac4f270-974f-46f6-80ed-0ccd344a4f59',
            regla_id: '6d412e98-c9d7-450a-b78f-983de1cc0a79',
            variable_id: null,
            hecho_id: '62344eb8-0a11-42e5-b7f2-ea4abbfc5fa6',
            operador: '=',
            valor_esperado: 'true',
            orden: 1,
          },
        ],
        conclusiones: [
          {
            id: '7f8c97fe-3218-4b60-9544-f41371be8c6f',
            regla_id: '6d412e98-c9d7-450a-b78f-983de1cc0a79',
            hecho_resultante_id: null,
            variable_resultante_id: 'fd845f63-80ac-4570-929c-e9bad2f5f941',
            valor_resultante: 'true',
          },
        ],
      },
      {
        id: '3f40c3b8-0154-4662-a148-44d345830790',
        nombre: 'R2',
        descripcion: 'regla 2',
        prioridad: 1,
        factor_certeza: '0.00',
        activa: true,
        condiciones: [
          {
            id: '988f14e2-f634-4efa-b2ff-8adceb9fd480',
            regla_id: '3f40c3b8-0154-4662-a148-44d345830790',
            variable_id: 'fd845f63-80ac-4570-929c-e9bad2f5f941',
            hecho_id: null,
            operador: '=',
            valor_esperado: 'true',
            orden: 1,
          },
        ],
        conclusiones: [
          {
            id: '81862169-cb34-478f-bdee-bd3c93f4cd1a',
            regla_id: '3f40c3b8-0154-4662-a148-44d345830790',
            hecho_resultante_id: null,
            variable_resultante_id: '66d43967-50af-46a7-808b-7709d410c9af',
            valor_resultante: 'true',
          },
        ],
      },
    ];

    const { nodes, edges } = construirGrafoBaseConocimiento(hechos, variables, reglas);

    // 1. Verificar nombres de las condiciones
    const cond1 = nodes.find((n) => n.id.includes('9ac4f270'));
    expect(cond1).toBeDefined();
    expect(cond1!.data.referencia).toBe('A'); // Resuelto desde hecho_id!

    const cond2 = nodes.find((n) => n.id.includes('988f14e2'));
    expect(cond2).toBeDefined();
    expect(cond2!.data.referencia).toBe('B'); // Resuelto desde variable_id!

    // 2. Verificar destinos de las conclusiones
    const concl1 = nodes.find((n) => n.id.includes('7f8c97fe'));
    expect(concl1).toBeDefined();
    expect(concl1!.data.destino).toBe('B'); // Resuelto desde variable_resultante_id!

    const concl2 = nodes.find((n) => n.id.includes('81862169'));
    expect(concl2).toBeDefined();
    expect(concl2!.data.destino).toBe('C'); // Resuelto desde variable_resultante_id!

    // 3. Relación Hecho A -> Condición 1 (EVALÚA)
    const evaluaA = edges.find((e) => e.source === 'hecho_62344eb8-0a11-42e5-b7f2-ea4abbfc5fa6' && e.target === cond1!.id);
    expect(evaluaA).toBeDefined();
    expect(evaluaA!.label).toBe('EVALÚA');

    // 4. Relación Conclusión 1 -> Variable B (ASIGNA)
    const asignaB = edges.find((e) => e.source === concl1!.id && e.target === 'variable_fd845f63-80ac-4570-929c-e9bad2f5f941');
    expect(asignaB).toBeDefined();
    expect(asignaB!.label).toBe('ASIGNA');

    // 5. Relación Variable B -> Condición 2 (EVALÚA)
    const evaluaB = edges.find((e) => e.source === 'variable_fd845f63-80ac-4570-929c-e9bad2f5f941' && e.target === cond2!.id);
    expect(evaluaB).toBeDefined();
    expect(evaluaB!.label).toBe('EVALÚA');

    // 6. Encadenamiento hacia adelante: Conclusión 1 -> Condición 2 (ENCADENA)
    const encadena = edges.find((e) => e.source === concl1!.id && e.target === cond2!.id);
    expect(encadena).toBeDefined();
    expect(encadena!.label).toBe('ENCADENA');

    // 7. Relación Conclusión 2 -> Variable C (ASIGNA)
    const asignaC = edges.find((e) => e.source === concl2!.id && e.target === 'variable_66d43967-50af-46a7-808b-7709d410c9af');
    expect(asignaC).toBeDefined();
    expect(asignaC!.label).toBe('ASIGNA');

    // 8. Todas las aristas deben ser de tipo 'draggable' para permitir moverlas con el mouse
    for (const edge of edges) {
      expect(edge.type).toBe('draggable');
    }
  });

  it('preserva puntos de control de aristas movidas con el ratón', () => {
    const regla: Regla = {
      id: 'r1',
      nombre: 'Regla 1',
      prioridad: 1,
      factor_certeza: 1.0,
      activa: true,
      condiciones: [{ id: 'c1', operador: '==', valor_esperado: 'true', orden: 1 }],
      conclusiones: [],
    };

    const edgeId = 'e_regla_r1_cond_r1_c1';
    const puntosControl = {
      [edgeId]: { x: 500, y: 150 },
    };

    const { edges } = construirGrafoBaseConocimiento([], [], [regla], {}, puntosControl);
    const edge = edges.find((e) => e.id === edgeId);
    expect(edge).toBeDefined();
    expect(edge!.type).toBe('draggable');
    expect((edge!.data as { controlPoint?: { x: number; y: number } })?.controlPoint).toEqual({
      x: 500,
      y: 150,
    });
  });
});
