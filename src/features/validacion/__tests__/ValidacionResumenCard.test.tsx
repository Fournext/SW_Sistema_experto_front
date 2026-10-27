import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ValidacionResumenCard from '../components/ValidacionResumenCard';
import type { ResultadoValidacion } from '../types/types';

describe('ValidacionResumenCard', () => {
  it('muestra estado vacío y botón para validar cuando no hay resultado', () => {
    const onValidar = vi.fn();
    render(
      <ValidacionResumenCard
        resultado={null}
        isValidando={false}
        onValidar={onValidar}
      />
    );

    expect(screen.getByText(/base de conocimiento aún no validada/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /validar base de conocimiento ahora/i });
    fireEvent.click(btn);
    expect(onValidar).toHaveBeenCalledTimes(1);
  });

  it('muestra métricas de errores y advertencias cuando hay diagnóstico', () => {
    const mockResultado: ResultadoValidacion = {
      id: 'val-1',
      base_conocimiento_id: 'bc-1',
      fecha_validacion: '2026-10-22T12:00:00Z',
      es_valida: false,
      total_errores: 2,
      total_advertencias: 1,
      resumen: 'Se detectaron 2 errores que impiden la inferencia y 1 advertencia.',
      incidencias: [],
    };

    render(
      <ValidacionResumenCard
        resultado={mockResultado}
        isValidando={false}
        onValidar={vi.fn()}
      />
    );

    expect(screen.getByText(/se detectaron anomalías o inconsistencias/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Requiere Revisión')).toBeInTheDocument();
  });
});
