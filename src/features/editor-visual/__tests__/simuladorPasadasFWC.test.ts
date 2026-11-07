import { describe, it, expect } from 'vitest';

describe('Simulador FWC por Pasadas Pedagógicas (Ejemplo del Cuaderno)', () => {
  it('ejecuta el ciclo didáctico de pasadas, deshabilitando reglas y detectando la contradicción en C', () => {
    // 6 Reglas del cuaderno del docente
    const reglas = [
      {
        id: 'r1',
        nombre: 'R1',
        prioridad: 10,
        condiciones: [{ sujeto: 'X', operador: '=', valor_esperado: '0' }],
        conclusiones: [{ variable_nombre: 'P', valor_resultante: 'a' }],
      },
      {
        id: 'r2',
        nombre: 'R2',
        prioridad: 10,
        condiciones: [{ sujeto: 'X', operador: '=', valor_esperado: '0' }],
        conclusiones: [{ variable_nombre: 'C', valor_resultante: 'b' }],
      },
      {
        id: 'r3',
        nombre: 'R3',
        prioridad: 10,
        condiciones: [{ sujeto: 'P', operador: '=', valor_esperado: 'a' }],
        conclusiones: [{ variable_nombre: 'C', valor_resultante: 'a' }],
      },
      {
        id: 'r4',
        nombre: 'R4',
        prioridad: 10,
        condiciones: [{ sujeto: 'S', operador: '>', valor_esperado: '4' }],
        conclusiones: [{ variable_nombre: 'C', valor_resultante: 'b' }],
      },
      {
        id: 'r5',
        nombre: 'R5',
        prioridad: 10,
        condiciones: [{ sujeto: 'S', operador: '<', valor_esperado: '4' }],
        conclusiones: [{ variable_nombre: 'P', valor_resultante: 'a' }],
      },
      {
        id: 'r6',
        nombre: 'R6',
        prioridad: 10,
        condiciones: [{ sujeto: 'S', operador: '=', valor_esperado: '10' }],
        conclusiones: [{ variable_nombre: 'Q', valor_resultante: 'a' }],
      },
    ];

    const vectorIni = [{ nombre: 'X', valor: '0' }];

    // Replicamos el algoritmo de pasadas de construirPasosWorkflow
    let bhActual = [...vectorIni];
    const reglasMarcadas = new Set<string>();
    const pasos: any[] = [];
    let contradiccionGlobal: any = null;
    let pasadaNumero = 1;

    while (pasadaNumero <= 5 && !contradiccionGlobal) {
      const bhInicioPasada = [...bhActual];
      let huboDisparoEnPasada = false;
      const nuevosHechosDeEstaPasada: any[] = [];

      for (const reglaObj of reglas) {
        if (reglasMarcadas.has(reglaObj.id)) {
          pasos.push({
            pasadaNumero,
            reglaNombre: reglaObj.nombre,
            estado: 'DESHABILITADA',
          });
          continue;
        }

        const todasCumplen = reglaObj.condiciones.every((c) => {
          const enBH = bhInicioPasada.find((h) => h.nombre.toLowerCase() === c.sujeto.toLowerCase());
          return enBH && enBH.valor === c.valor_esperado;
        });

        if (todasCumplen) {
          huboDisparoEnPasada = true;
          reglasMarcadas.add(reglaObj.id);
          const c0 = reglaObj.conclusiones[0];
          const hechoProducido = { nombre: c0.variable_nombre, valor: c0.valor_resultante };
          nuevosHechosDeEstaPasada.push(hechoProducido);

          const existente = bhActual.find((h) => h.nombre.toLowerCase() === hechoProducido.nombre.toLowerCase());
          let pasoContradiccion: any = null;
          if (existente && existente.valor !== hechoProducido.valor) {
            pasoContradiccion = {
              variable: hechoProducido.nombre,
              valorAnterior: existente.valor,
              valorNuevo: hechoProducido.valor,
            };
            contradiccionGlobal = pasoContradiccion;
          }

          pasos.push({
            pasadaNumero,
            reglaNombre: reglaObj.nombre,
            estado: 'EJECUTADA',
            hechoProducido,
            contradiccion: pasoContradiccion,
          });

          if (pasoContradiccion) break;
        } else {
          pasos.push({
            pasadaNumero,
            reglaNombre: reglaObj.nombre,
            estado: 'RECHAZADA',
          });
        }
      }

      nuevosHechosDeEstaPasada.forEach((nh) => {
        const idx = bhActual.findIndex((h) => h.nombre.toLowerCase() === nh.nombre.toLowerCase());
        if (idx >= 0) bhActual[idx] = nh;
        else bhActual.push(nh);
      });

      pasos.push({
        pasadaNumero,
        tipoPaso: 'CIERRE_PASADA',
        bhResultante: [...bhActual],
        contradiccion: contradiccionGlobal,
      });

      if (contradiccionGlobal || !huboDisparoEnPasada) break;
      pasadaNumero++;
    }

    // Comprobaciones didácticas:
    // 1. En Pasada 1: R1 y R2 disparan; R3 NO dispara (P aún no estaba en BH al inicio de la pasada)
    const pasosPasada1 = pasos.filter((p) => p.pasadaNumero === 1);
    expect(pasosPasada1.find((p) => p.reglaNombre === 'R1')?.estado).toBe('EJECUTADA');
    expect(pasosPasada1.find((p) => p.reglaNombre === 'R2')?.estado).toBe('EJECUTADA');
    expect(pasosPasada1.find((p) => p.reglaNombre === 'R3')?.estado).toBe('RECHAZADA');

    // 2. Base de hechos al cierre de Pasada 1: { X = 0, P = a, C = b }
    const cierrePasada1 = pasos.find((p) => p.pasadaNumero === 1 && p.tipoPaso === 'CIERRE_PASADA');
    expect(cierrePasada1?.bhResultante).toEqual([
      { nombre: 'X', valor: '0' },
      { nombre: 'P', valor: 'a' },
      { nombre: 'C', valor: 'b' },
    ]);

    // 3. En Pasada 2: R1 y R2 quedan DESHABILITADAS; R3 DISPARA
    const pasosPasada2 = pasos.filter((p) => p.pasadaNumero === 2);
    expect(pasosPasada2.find((p) => p.reglaNombre === 'R1')?.estado).toBe('DESHABILITADA');
    expect(pasosPasada2.find((p) => p.reglaNombre === 'R2')?.estado).toBe('DESHABILITADA');
    const pasoR3 = pasosPasada2.find((p) => p.reglaNombre === 'R3');
    expect(pasoR3?.estado).toBe('EJECUTADA');

    // 4. Se detecta CONTRADICCIÓN en C (existía C = b, R3 concluye C = a)
    expect(pasoR3?.contradiccion).toEqual({
      variable: 'C',
      valorAnterior: 'b',
      valorNuevo: 'a',
    });
    expect(contradiccionGlobal).not.toBeNull();
  });

  it('encadena de manera inmediata los hechos disparados para que la siguiente regla de la misma pasada los utilice', () => {
    // 5 Reglas del caso subido por el usuario en las imágenes:
    // R1 (P:10): IF X > 0 AND Z = 0 THEN P = a
    // R2 (P:9): IF H != a THEN X = 20
    // R3 (P:8): IF X > 10 THEN Z = 0
    // R4 (P:7): IF Q = 0 THEN H = c
    // R5 (P:6): IF Q != 0 THEN Z = 0
    const reglas = [
      {
        id: 'r1',
        nombre: 'R1',
        prioridad: 10,
        condiciones: [
          { sujeto: 'X', operador: '>', valor_esperado: '0' },
          { sujeto: 'Z', operador: '=', valor_esperado: '0' },
        ],
        conclusiones: [{ variable_nombre: 'P', valor_resultante: 'a' }],
      },
      {
        id: 'r2',
        nombre: 'R2',
        prioridad: 9,
        condiciones: [{ sujeto: 'H', operador: '!=', valor_esperado: 'a' }],
        conclusiones: [{ variable_nombre: 'X', valor_resultante: '20' }],
      },
      {
        id: 'r3',
        nombre: 'R3',
        prioridad: 8,
        condiciones: [{ sujeto: 'X', operador: '>', valor_esperado: '10' }],
        conclusiones: [{ variable_nombre: 'Z', valor_resultante: '0' }],
      },
      {
        id: 'r4',
        nombre: 'R4',
        prioridad: 7,
        condiciones: [{ sujeto: 'Q', operador: '=', valor_esperado: '0' }],
        conclusiones: [{ variable_nombre: 'H', valor_resultante: 'c' }],
      },
      {
        id: 'r5',
        nombre: 'R5',
        prioridad: 6,
        condiciones: [{ sujeto: 'Q', operador: '!=', valor_esperado: '0' }],
        conclusiones: [{ variable_nombre: 'Z', valor_resultante: '0' }],
      },
    ];

    const vectorIni = [{ nombre: 'Q', valor: '0' }];

    // Ejecutamos con la Base de Hechos que se actualiza INMEDIATAMENTE al disparar cada regla
    let bhActual = [...vectorIni];
    const reglasMarcadas = new Set<string>();
    const pasos: any[] = [];
    let pasadaNumero = 1;

    while (pasadaNumero <= 5) {
      const bhInicioPasada = [...bhActual];
      let huboDisparoEnPasada = false;

      for (const reglaObj of reglas) {
        if (reglasMarcadas.has(reglaObj.id)) {
          pasos.push({
            pasadaNumero,
            reglaNombre: reglaObj.nombre,
            estado: 'DESHABILITADA',
          });
          continue;
        }

        const todasCumplen = reglaObj.condiciones.every((c) => {
          const enBH = bhActual.find((h) => h.nombre.toLowerCase() === c.sujeto.toLowerCase());
          if (!enBH) return false;
          if (c.operador === '=') return enBH.valor === c.valor_esperado;
          if (c.operador === '!=') return enBH.valor !== c.valor_esperado;
          if (c.operador === '>') return Number(enBH.valor) > Number(c.valor_esperado);
          return false;
        });

        if (todasCumplen) {
          huboDisparoEnPasada = true;
          reglasMarcadas.add(reglaObj.id);
          const c0 = reglaObj.conclusiones[0];
          const hechoProducido = { nombre: c0.variable_nombre, valor: c0.valor_resultante };

          // Actualización INMEDIATA de la Base de Hechos
          const idx = bhActual.findIndex((h) => h.nombre.toLowerCase() === hechoProducido.nombre.toLowerCase());
          if (idx >= 0) bhActual[idx] = hechoProducido;
          else bhActual.push(hechoProducido);

          pasos.push({
            pasadaNumero,
            reglaNombre: reglaObj.nombre,
            estado: 'EJECUTADA',
            hechoProducido,
            memoriaTrabajoSnapshot: [...bhActual],
          });
        } else {
          pasos.push({
            pasadaNumero,
            reglaNombre: reglaObj.nombre,
            estado: 'RECHAZADA',
            memoriaTrabajoSnapshot: [...bhActual],
          });
        }
      }

      pasos.push({
        pasadaNumero,
        tipoPaso: 'CIERRE_PASADA',
        bhResultante: [...bhActual],
      });

      if (!huboDisparoEnPasada) break;
      pasadaNumero++;
    }

    // 1. En Pasada 1, R4 dispara H = c
    const pasosP1 = pasos.filter((p) => p.pasadaNumero === 1);
    expect(pasosP1.find((p) => p.reglaNombre === 'R4')?.estado).toBe('EJECUTADA');

    // 2. En Pasada 2, R2 dispara X = 20, y R3 (inmediatamente después) DISPARA Z = 0 en la misma pasada
    const pasosP2 = pasos.filter((p) => p.pasadaNumero === 2);
    expect(pasosP2.find((p) => p.reglaNombre === 'R2')?.estado).toBe('EJECUTADA');
    expect(pasosP2.find((p) => p.reglaNombre === 'R3')?.estado).toBe('EJECUTADA');

    // 3. En Pasada 3, R1 ve X=20 y Z=0 en la memoria de trabajo y DISPARA P = a
    const pasosP3 = pasos.filter((p) => p.pasadaNumero === 3);
    expect(pasosP3.find((p) => p.reglaNombre === 'R1')?.estado).toBe('EJECUTADA');
  });
});

