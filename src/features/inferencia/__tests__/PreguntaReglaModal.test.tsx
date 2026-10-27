import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreguntaReglaModal, { type PreguntaEvaluacion } from '../components/PreguntaReglaModal';

describe('PreguntaReglaModal', () => {
  const evaluacionDecimal: PreguntaEvaluacion = {
    reglaNombre: 'R1_Fiebre_Alta',
    reglaDescripcion: 'Determina si el paciente presenta cuadro febril agudo',
    condicionTexto: 'temperatura > 38.5',
    nombreVariable: 'temperatura',
    pregunta: '¿Cuál es la temperatura actual del paciente en °C?',
    tipoDato: 'DECIMAL',
    valorActual: '',
    origen: 'VARIABLE',
  };

  const evaluacionBooleano: PreguntaEvaluacion = {
    reglaNombre: 'R2_Presencia_Tos',
    condicionTexto: 'tiene_tos == true',
    nombreVariable: 'tiene_tos',
    pregunta: '¿El paciente presenta tos constante?',
    tipoDato: 'BOOLEANO',
    origen: 'VARIABLE',
  };

  const evaluacionOpcion: PreguntaEvaluacion = {
    reglaNombre: 'R3_Nivel_Dolor',
    condicionTexto: 'dolor == severo',
    nombreVariable: 'dolor',
    pregunta: '¿Cuál es el nivel de dolor reportado?',
    tipoDato: 'OPCION',
    opciones: ['leve', 'moderado', 'severo'],
    origen: 'VARIABLE',
  };

  it('renderiza la regla evaluada, la condición y la pregunta configurada', () => {
    render(
      <PreguntaReglaModal
        isOpen={true}
        onClose={vi.fn()}
        evaluacion={evaluacionDecimal}
        onResponder={vi.fn()}
        totalPendientes={2}
        indicePendiente={1}
      />
    );

    expect(screen.getByText('R1_Fiebre_Alta')).toBeInTheDocument();
    expect(screen.getByText(/temperatura > 38\.5/)).toBeInTheDocument();
    expect(screen.getByText('¿Cuál es la temperatura actual del paciente en °C?')).toBeInTheDocument();
    expect(screen.getByText('Pregunta 1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Responder y Continuar/i })).toBeInTheDocument();
  });

  it('permite ingresar un valor numérico y llama a onResponder', () => {
    const handleResponder = vi.fn();

    render(
      <PreguntaReglaModal
        isOpen={true}
        onClose={vi.fn()}
        evaluacion={evaluacionDecimal}
        onResponder={handleResponder}
      />
    );

    const input = screen.getByPlaceholderText('Ingrese temperatura...');
    fireEvent.change(input, { target: { value: '39.2' } });

    fireEvent.click(screen.getByRole('button', { name: /Responder y Continuar/i }));

    expect(handleResponder).toHaveBeenCalledTimes(1);
    expect(handleResponder).toHaveBeenCalledWith('temperatura', '39.2', 'DECIMAL', undefined);
  });

  it('permite seleccionar Sí/No para tipo booleano y responde', () => {
    const handleResponder = vi.fn();

    render(
      <PreguntaReglaModal
        isOpen={true}
        onClose={vi.fn()}
        evaluacion={evaluacionBooleano}
        onResponder={handleResponder}
      />
    );

    expect(screen.getByText('¿El paciente presenta tos constante?')).toBeInTheDocument();
    const btnNo = screen.getByRole('button', { name: /No \/ Falso/i });
    fireEvent.click(btnNo);

    fireEvent.click(screen.getByRole('button', { name: /Responder y Continuar/i }));

    expect(handleResponder).toHaveBeenCalledWith('tiene_tos', 'false', 'BOOLEANO', undefined);
  });

  it('permite seleccionar opciones tipo pill y responde con la elegida', () => {
    const handleResponder = vi.fn();

    render(
      <PreguntaReglaModal
        isOpen={true}
        onClose={vi.fn()}
        evaluacion={evaluacionOpcion}
        onResponder={handleResponder}
      />
    );

    expect(screen.getByText('¿Cuál es el nivel de dolor reportado?')).toBeInTheDocument();
    const btnSevero = screen.getByRole('button', { name: 'severo' });
    fireEvent.click(btnSevero);

    fireEvent.click(screen.getByRole('button', { name: /Responder y Continuar/i }));

    expect(handleResponder).toHaveBeenCalledWith('dolor', 'severo', 'OPCION', ['leve', 'moderado', 'severo']);
  });
});
