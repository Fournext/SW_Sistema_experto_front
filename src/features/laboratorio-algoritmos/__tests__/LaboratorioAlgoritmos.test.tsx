import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditorAlgoritmo } from '../components/EditorAlgoritmo';
import { CodigoEjecucion } from '../components/CodigoEjecucion';
import { PanelVariables } from '../components/PanelVariables';
import { PanelBaseHechos } from '../components/PanelBaseHechos';
import { PanelEstructuras } from '../components/PanelEstructuras';
import { PreguntaLaboratorioModal } from '../components/PreguntaLaboratorioModal';
import { ControlesEjecucion } from '../components/ControlesEjecucion';

describe('Laboratorio de Algoritmos - Componentes', () => {
  it('EditorAlgoritmo renderiza código y responde al cambio', () => {
    const handleChange = vi.fn();
    render(<EditorAlgoritmo codigo="int i = 0;" onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('int i = 0;');
    fireEvent.change(textarea, { target: { value: 'int i = 1;' } });
    expect(handleChange).toHaveBeenCalledWith('int i = 1;');
  });

  it('CodigoEjecucion resalta la línea activa y muestra salidas de consola', () => {
    render(
      <CodigoEjecucion
        codigo={'int x = 1;\nint y = 2;\nprintln("Hola");'}
        lineaActiva={2}
        salidasTexto={['Hola mundo']}
      />
    );
    expect(screen.getByText('int y = 2;')).toBeInTheDocument();
    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
  });

  it('PanelVariables muestra variables locales y sus tipos', () => {
    render(
      <PanelVariables
        frame={{
          nombre_funcion: 'main',
          pc: 4,
          variables: { pasada: 1, huboDisparo: true, nombre: 'Test' },
          pila_operandos: [],
        }}
      />
    );
    expect(screen.getByText('pasada')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('huboDisparo')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('PanelBaseHechos lista los hechos presentes en memoria', () => {
    render(
      <PanelBaseHechos
        baseHechos={{
          tipo_objeto: 'BaseHechos',
          hechos: {
            fiebre: {
              tipo_objeto: 'Hecho',
              id: 'h1',
              variable_id: 'v1',
              variable_nombre: 'Fiebre',
              valor: 'Si',
              tipo_dato: 'TEXTO',
            },
          },
          consultadas: [],
        }}
        hechosInicialesNombres={['Fiebre']}
      />
    );
    expect(screen.getByText('Fiebre')).toBeInTheDocument();
    expect(screen.getByText('Si')).toBeInTheDocument();
    expect(screen.getByText('1 hechos')).toBeInTheDocument();
  });

  it('PanelEstructuras visualiza Pila HN y Cola Q', () => {
    render(
      <PanelEstructuras
        pilaHN={{
          tipo_objeto: 'Pila',
          elementos: [{ nombre: 'H1' }, { nombre: 'H2' }],
        }}
        colaQ={{
          tipo_objeto: 'Cola',
          elementos: [{ nombre: 'R1' }, { nombre: 'R2' }],
        }}
      />
    );
    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('H2')).toBeInTheDocument();
    expect(screen.getByText('TOPE')).toBeInTheDocument();
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
  });

  it('PreguntaLaboratorioModal permite enviar respuesta', () => {
    const handleResponder = vi.fn();
    const handleCancelar = vi.fn();
    render(
      <PreguntaLaboratorioModal
        pregunta={{
          id_pregunta: 'preg-1',
          variable_id: 'v1',
          variable_nombre: 'PresionArterial',
          texto: '¿Cuál es la presión arterial del paciente?',
        }}
        onResponder={handleResponder}
        onCancelar={handleCancelar}
      />
    );
    expect(screen.getByText('PresionArterial')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Ej. Si, No, 85, etc.');
    fireEvent.change(input, { target: { value: '120/80' } });
    fireEvent.click(screen.getByText('Confirmar Respuesta'));
    expect(handleResponder).toHaveBeenCalledWith('120/80');
  });

  it('ControlesEjecucion conmuta botones según el estado', () => {
    const handleIniciar = vi.fn();
    render(
      <ControlesEjecucion
        estado={null}
        enEjecucionAutomatica={false}
        velocidadMs={800}
        onCambiarVelocidad={vi.fn()}
        onValidar={vi.fn()}
        onIniciar={handleIniciar}
        onPasoLinea={vi.fn()}
        onPlay={vi.fn()}
        onPausa={vi.fn()}
        onReiniciar={vi.fn()}
      />
    );
    const botonIniciar = screen.getByText('Iniciar Simulación');
    expect(botonIniciar).toBeInTheDocument();
    fireEvent.click(botonIniciar);
    expect(handleIniciar).toHaveBeenCalled();
  });
});

