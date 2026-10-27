import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlesSimulacionBar from '../components/ControlesSimulacionBar';

describe('ControlesSimulacionBar', () => {
  it('muestra botón para Iniciar Simulación cuando el estado es inactivo', () => {
    const onIniciar = vi.fn();
    render(
      <ControlesSimulacionBar
        estado={null}
        pasoActual={0}
        isLoading={false}
        onIniciar={onIniciar}
        onAvanzarPaso={vi.fn()}
        onEvaluarRegla={vi.fn()}
        onPausar={vi.fn()}
        onContinuar={vi.fn()}
        onReiniciar={vi.fn()}
        onFinalizar={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /iniciar simulación/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onIniciar).toHaveBeenCalledTimes(1);
  });

  it('muestra controles de avanzar paso, pausar y reiniciar cuando está activa', () => {
    const onAvanzar = vi.fn();
    const onEvaluar = vi.fn();
    const onPausar = vi.fn();
    const onReiniciar = vi.fn();

    render(
      <ControlesSimulacionBar
        estado="EJECUTANDO"
        pasoActual={2}
        numeroVuelta={3}
        siguienteRegla={{ id: 'r2', nombre: 'R2', prioridad: 10 }}
        isLoading={false}
        onIniciar={vi.fn()}
        onAvanzarPaso={onAvanzar}
        onEvaluarRegla={onEvaluar}
        onPausar={onPausar}
        onContinuar={vi.fn()}
        onReiniciar={onReiniciar}
        onFinalizar={vi.fn()}
      />
    );

    expect(screen.getByText(/paso actual:/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Vuelta 3')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
    expect(screen.getByText('Prioridad: 10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /evaluar siguiente regla/i }));
    expect(onEvaluar).toHaveBeenCalledTimes(1);
    expect(onAvanzar).not.toHaveBeenCalled();
    const btnPaso = screen.getByRole('button', { name: /avanzar inferencia/i });
    fireEvent.click(btnPaso);
    expect(onAvanzar).toHaveBeenCalledTimes(1);

    const btnPausa = screen.getByRole('button', { name: /pausar/i });
    fireEvent.click(btnPausa);
    expect(onPausar).toHaveBeenCalledTimes(1);

    const btnReiniciar = screen.getByRole('button', { name: /reiniciar/i });
    fireEvent.click(btnReiniciar);
    expect(onReiniciar).toHaveBeenCalledTimes(1);
  });

  it.each([
    { estado: 'PAUSADA', isLoading: false, puedeControlar: true },
    { estado: 'FINALIZADA', isLoading: false, puedeControlar: true },
    { estado: 'COMPLETADA', isLoading: false, puedeControlar: true },
    { estado: 'EJECUTANDO', isLoading: true, puedeControlar: true },
    { estado: 'EJECUTANDO', isLoading: false, puedeControlar: false },
  ])('bloquea ambos avances cuando $estado, carga $isLoading, permiso $puedeControlar', (estadoProps) => {
    render(<ControlesSimulacionBar
      {...estadoProps}
      pasoActual={2}
      onIniciar={vi.fn()}
      onEvaluarRegla={vi.fn()}
      onAvanzarPaso={vi.fn()}
      onPausar={vi.fn()}
      onContinuar={vi.fn()}
      onReiniciar={vi.fn()}
      onFinalizar={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: /evaluar siguiente regla/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /avanzar inferencia/i })).toBeDisabled();
  });
});
