import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CuestionarioConsultaModal from '../components/CuestionarioConsultaModal';
import type { Hecho } from '@/features/base-conocimiento/types/types';

describe('CuestionarioConsultaModal', () => {
  const hechosPrueba: Hecho[] = [
    {
      id: 'h1',
      nombre: 'temperatura',
      valor: '36.5',
      tipo_dato: 'DECIMAL',
      pregunta: '¿Cuál es la temperatura corporal del paciente?',
      es_inicial: true,
    },
    {
      id: 'h2',
      nombre: 'tiene_tos',
      valor: 'false',
      tipo_dato: 'BOOLEANO',
      pregunta: '¿El paciente presenta tos constante?',
      es_inicial: true,
    },
    {
      id: 'h3',
      nombre: 'severidad',
      valor: 'moderada',
      tipo_dato: 'OPCION',
      opciones: ['leve', 'moderada', 'grave'],
      pregunta: '¿Qué nivel de severidad se percibe?',
      es_inicial: true,
    },
  ];

  it('renderiza las preguntas configuradas para cada hecho o variable', () => {
    render(
      <CuestionarioConsultaModal
        isOpen={true}
        onClose={vi.fn()}
        hechos={hechosPrueba}
        onConfirmar={vi.fn()}
      />
    );

    expect(screen.getByText('¿Cuál es la temperatura corporal del paciente?')).toBeInTheDocument();
    expect(screen.getByText('¿El paciente presenta tos constante?')).toBeInTheDocument();
    expect(screen.getByText('¿Qué nivel de severidad se percibe?')).toBeInTheDocument();
  });

  it('permite modificar respuestas y enviar los hechos con los nuevos valores', () => {
    const handleConfirmar = vi.fn();

    render(
      <CuestionarioConsultaModal
        isOpen={true}
        onClose={vi.fn()}
        hechos={hechosPrueba}
        onConfirmar={handleConfirmar}
      />
    );

    // Cambiar respuesta booleana a "Sí / Verdadero"
    const btnSi = screen.getByRole('button', { name: /sí \/ verdadero/i });
    fireEvent.click(btnSi);

    // Cambiar opción a "grave"
    const btnGrave = screen.getByRole('button', { name: 'grave' });
    fireEvent.click(btnGrave);

    // Enviar cuestionario
    const btnSubmit = screen.getByRole('button', { name: /iniciar inferencia con respuestas/i });
    fireEvent.click(btnSubmit);

    expect(handleConfirmar).toHaveBeenCalledTimes(1);
    const resultadoEnviado = handleConfirmar.mock.calls[0][0];

    // Verificar que los nuevos valores fueron capturados
    const hechoTos = resultadoEnviado.find((h: any) => h.nombre === 'tiene_tos');
    expect(hechoTos.valor).toBe('true');

    const hechoSev = resultadoEnviado.find((h: any) => h.nombre === 'severidad');
    expect(hechoSev.valor).toBe('grave');
  });

  it('solo incluye hechos iniciales o con pregunta, y excluye hechos intermedios sin pregunta', () => {
    const hechosMixtos: Hecho[] = [
      {
        id: 'h-inicial',
        nombre: 'sintoma_fiebre',
        valor: 'true',
        tipo_dato: 'BOOLEANO',
        es_inicial: true,
      },
      {
        id: 'h-intermedio-con-pregunta',
        nombre: 'nivel_glucosa',
        valor: '90',
        tipo_dato: 'ENTERO',
        pregunta: '¿Cuál es el nivel de glucosa en ayunas?',
        es_inicial: false,
      },
      {
        id: 'h-intermedio-sin-pregunta',
        nombre: 'diagnostico_intermedio',
        valor: 'pendiente',
        tipo_dato: 'TEXTO',
        es_inicial: false,
      },
    ];

    render(
      <CuestionarioConsultaModal
        isOpen={true}
        onClose={vi.fn()}
        hechos={hechosMixtos}
        onConfirmar={vi.fn()}
      />
    );

    expect(screen.getByText('sintoma_fiebre')).toBeInTheDocument();
    expect(screen.getByText('¿Cuál es el nivel de glucosa en ayunas?')).toBeInTheDocument();
    expect(screen.queryByText('diagnostico_intermedio')).not.toBeInTheDocument();
  });

  it('incluye variables si tienen configurada una pregunta y excluye variables sin pregunta', () => {
    const variablesMixtas = [
      {
        id: 'v1',
        nombre: 'edad_paciente',
        tipo_dato: 'ENTERO' as const,
        valor_defecto: '30',
        pregunta: '¿Qué edad tiene el paciente?',
      },
      {
        id: 'v2',
        nombre: 'factor_riesgo_interno',
        tipo_dato: 'TEXTO' as const,
        valor_defecto: '',
        pregunta: '', // sin pregunta
      },
    ];

    render(
      <CuestionarioConsultaModal
        isOpen={true}
        onClose={vi.fn()}
        hechos={[]}
        variables={variablesMixtas}
        onConfirmar={vi.fn()}
      />
    );

    expect(screen.getByText('¿Qué edad tiene el paciente?')).toBeInTheDocument();
    expect(screen.queryByText('factor_riesgo_interno')).not.toBeInTheDocument();
  });

  it('resalta variables verificadas en reglas con un badge e indicador', () => {
    const variablesReglas = [
      {
        id: 'v1',
        nombre: 'temperatura',
        tipo_dato: 'DECIMAL' as const,
        es_inicial: true,
        pregunta: '¿Cuál es la temperatura?',
      },
    ];

    render(
      <CuestionarioConsultaModal
        isOpen={true}
        onClose={vi.fn()}
        hechos={[]}
        variables={variablesReglas}
        nombresEnReglas={new Set(['temperatura'])}
        onConfirmar={vi.fn()}
      />
    );

    expect(screen.getByText(/preguntas de simulación interactiva/i)).toBeInTheDocument();
    expect(screen.getByText(/verificada en reglas/i)).toBeInTheDocument();
  });
});
