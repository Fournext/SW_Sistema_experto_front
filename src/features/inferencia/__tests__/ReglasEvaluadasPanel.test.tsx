import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReglasEvaluadasPanel from '../components/ReglasEvaluadasPanel';

describe('ReglasEvaluadasPanel', () => {
  it('agrupa las evaluaciones individuales de una vuelta dentro del mismo paso', () => {
    const { rerender } = render(<ReglasEvaluadasPanel detalles={[
      { paso_numero: 1, paso_visual: 1, regla_id: 'r1', regla: 'R1', estado: 'RECHAZADA' },
      { paso_numero: 2, paso_visual: 1, regla_id: 'r2', regla: 'R2', estado: 'RECHAZADA' },
      { paso_numero: 3, paso_visual: 1, regla_id: 'r3', regla: 'R3', estado: 'EJECUTADA' },
    ]} pasoActual={1} />);
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('3 reglas evaluadas')).toBeInTheDocument();
    expect(screen.queryByText('Paso 2')).not.toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /^Evaluación de/ })).toHaveLength(3);
    rerender(<ReglasEvaluadasPanel detalles={[
      { paso_numero: 1, paso_visual: 1, regla_id: 'r1', regla: 'R1', estado: 'RECHAZADA' },
      { paso_numero: 2, paso_visual: 1, regla_id: 'r2', regla: 'R2', estado: 'RECHAZADA' },
      { paso_numero: 3, paso_visual: 1, regla_id: 'r3', regla: 'R3', estado: 'EJECUTADA' },
      { paso_numero: 4, paso_visual: 2, regla_id: 'r1', regla: 'R1', estado: 'EJECUTADA' },
    ]} pasoActual={2} />);
    expect(screen.getByText('Paso 1').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByText('Paso 2').closest('details')).toHaveAttribute('open');
  });

  it('reúne la evaluación y el rechazo en una tarjeta con la definición de la regla debajo', () => {
    render(<ReglasEvaluadasPanel
      detalles={[
        { regla_id: 'r5', regla: 'REGLA R05', estado: 'EVALUADA', condiciones_cumplidas: [false],
          condiciones_evaluadas: [{ condicion_id: 'c', resultado: false }] },
        { regla_id: 'r5', regla: 'REGLA R05', estado: 'RECHAZADA', resultado_generado: 'Condiciones no satisfechas.' },
      ]}
      reglas={[{
        id: 'r5', nombre: 'REGLA R05', prioridad: 5, factor_certeza: 1, activa: true,
        condiciones: [{ id: 'c', variable_id: 'temperatura', operador: '>', valor_esperado: '38' }],
        conclusiones: [{ id: 's', hecho_resultante_id: 'diagnostico', valor_resultante: 'fiebre' }],
      }]}
      variables={[{ id: 'temperatura', nombre: 'Temperatura', tipo: 'DECIMAL' }]}
      hechos={[{ id: 'diagnostico', nombre: 'Diagnóstico', tipo_dato: 'TEXTO', valor: '', es_inicial: false }]}
    />);
    expect(screen.getByText('1 evaluadas')).toBeInTheDocument();
    const tarjeta = screen.getByRole('group', { name: 'Evaluación de REGLA R05' });
    expect(screen.getAllByRole('group', { name: /^Evaluación de/ })).toHaveLength(1);
    expect(within(tarjeta).getByText('EVALUADA')).toBeInTheDocument();
    expect(within(tarjeta).getByText('RECHAZADA')).toBeInTheDocument();
    expect(within(tarjeta).getByRole('img', { name: 'Condición #1 FALSA' })).toBeInTheDocument();
    expect(within(tarjeta).getByText(/Temperatura > 38/)).toHaveTextContent('SI Temperatura > 38');
    expect(within(tarjeta).getByText(/Diagnóstico = fiebre/)).toHaveTextContent('ENTONCES Diagnóstico = fiebre');
    expect(tarjeta.lastElementChild).toHaveTextContent('Definición de la regla');
  });

  it('marca cada condición por su ID, aunque lleguen desordenadas y la regla sea rechazada', () => {
    render(<ReglasEvaluadasPanel
      detalles={[{
        regla_id: 'r', regla: 'R', estado: 'RECHAZADA', condiciones_cumplidas: [false],
        condiciones_evaluadas: [
          { condicion_id: 'c3', resultado: true },
          { condicion_id: 'c1', resultado: true },
          { condicion_id: 'c2', resultado: false },
        ],
      }]}
      reglas={[{
        id: 'r', nombre: 'R', activa: true, prioridad: 1, factor_certeza: 1,
        condiciones: ['c1', 'c2', 'c3'].map((id) => ({ id, referencia: id, operador: '==', valor_esperado: 'true' })),
      }]}
    />);
    for (const [index, estado] of ['VERDADERA', 'FALSA', 'VERDADERA'].entries()) {
      const icono = screen.getByRole('img', { name: `Condición #${index + 1} ${estado}` });
      expect(icono.parentElement).toHaveTextContent(`c${index + 1} == true`);
    }
  });

  it('no interpreta el resultado global de una traza antigua como resultado individual', () => {
    render(<ReglasEvaluadasPanel
      detalles={[{ regla_id: 'r', estado: 'RECHAZADA', condiciones_cumplidas: [false] }]}
      reglas={[{
        id: 'r', nombre: 'R', activa: true, prioridad: 1, factor_certeza: 1,
        condiciones: [{ id: 'c', referencia: 'dato', operador: '>', valor_esperado: '1' }],
      }]}
    />);
    expect(screen.getByRole('img', { name: 'Condición #1 SIN DETALLE' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /FALSA|VERDADERA/ })).not.toBeInTheDocument();
  });

  it('actualiza el estado y conserva tarjetas distintas para reglas con identificadores diferentes', () => {
    const { rerender } = render(<ReglasEvaluadasPanel detalles={[
      { regla_id: 'r1', regla: 'R1', estado: 'EVALUADA' },
    ]} />);
    rerender(<ReglasEvaluadasPanel detalles={[
      { regla_id: 'r1', regla: 'R1', estado: 'EVALUADA' },
      { regla_id: 'r1', regla: 'R1', estado: 'ACTIVADA' },
      { regla_id: 'r1', regla: 'R1', estado: 'EJECUTADA', resultado_generado: 'resultado = sí' },
      { regla_id: 'r2', regla: 'R2', estado: 'RECHAZADA' },
    ]} />);
    expect(screen.getByText('2 evaluadas')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /^Evaluación de/ })).toHaveLength(2);
    const tarjeta = screen.getByRole('group', { name: 'Evaluación de R1' });
    expect(within(tarjeta).getByText('EVALUADA')).toBeInTheDocument();
    expect(within(tarjeta).getByText('ACTIVADA')).toBeInTheDocument();
    expect(within(tarjeta).getByText('EJECUTADA')).toBeInTheDocument();
    expect(within(tarjeta).getByText('resultado = sí')).toBeInTheDocument();
  });

  it('separa la misma regla por pasos y conserva los resultados propios de cada paso', () => {
    render(<ReglasEvaluadasPanel
      detalles={[
        { paso_numero: 1, regla_id: 'r7', regla: 'R07', estado: 'EVALUADA', condiciones_evaluadas: [{ condicion_id: 'c', resultado: false }] },
        { paso_numero: 1, regla_id: 'r7', regla: 'R07', estado: 'RECHAZADA' },
        { paso_numero: 2, regla_id: 'r7', regla: 'R07', estado: 'EVALUADA', condiciones_evaluadas: [{ condicion_id: 'c', resultado: true }] },
        { paso_numero: 2, regla_id: 'r7', regla: 'R07', estado: 'ACTIVADA' },
        { paso_numero: 2, regla_id: 'r7', regla: 'R07', estado: 'EJECUTADA' },
      ]}
      reglas={[{
        id: 'r7', nombre: 'R07', activa: true, prioridad: 10, factor_certeza: 1,
        condiciones: [{ id: 'c', referencia: 'DNS Funcional', operador: '=', valor_esperado: 'true' }],
      }]}
    />);
    const paso1 = screen.getByText('Paso 1').closest('details')!;
    const paso2 = screen.getByText('Paso 2').closest('details')!;
    expect(paso1).not.toHaveAttribute('open');
    expect(paso2).toHaveAttribute('open');
    expect(within(paso2).getAllByText('EVALUADA')).toHaveLength(1);
    expect(within(paso2).getByText('EJECUTADA')).toBeInTheDocument();
    expect(within(paso2).queryByText('RECHAZADA')).not.toBeInTheDocument();
    expect(within(paso2).getByRole('img', { name: 'Condición #1 VERDADERA' })).toBeInTheDocument();
    fireEvent.click(paso1.querySelector('summary')!);
    expect(within(paso1).getByRole('img', { name: 'Condición #1 FALSA' })).toBeInTheDocument();
    expect(within(paso1).getAllByText('EVALUADA')).toHaveLength(1);
    expect(within(paso1).queryByText('ACTIVADA')).not.toBeInTheDocument();
    expect(screen.getByText('1 evaluadas')).toBeInTheDocument();
  });
});
