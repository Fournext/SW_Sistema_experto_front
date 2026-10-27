import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VariableForm from '../components/VariableForm';

describe('VariableForm', () => {
  it.each(['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO', 'OPCION'] as const)(
    'permite guardar una variable %s sin valor inicial', async (tipo) => {
      const handleSubmit = vi.fn();
      render(<VariableForm onSubmit={handleSubmit} initialValues={{ nombre: 'Dato', tipo }} />);
      fireEvent.click(screen.getByRole('button', { name: /guardar variable/i }));
      await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Dato', tipo, valor_por_defecto: '' })));
    },
  );

  it('permite quitar un valor booleano existente', async () => {
    const handleSubmit = vi.fn();
    render(<VariableForm onSubmit={handleSubmit} initialValues={{ nombre: 'Dato', tipo: 'BOOLEANO', valor_por_defecto: 'false' }} />);
    const valor = screen.getByLabelText(/valor inicial/i);
    expect(valor).toHaveValue('false');
    fireEvent.change(valor, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar variable/i }));
    await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor_por_defecto: '' })));
  });

  it('valida que el nombre de la variable sea obligatorio', async () => {
    const handleSubmit = vi.fn();
    render(<VariableForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar variable/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre de la variable es obligatorio/i)).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('no muestra la pregunta si no está marcada como inicial, y la muestra al marcarla', async () => {
    render(<VariableForm onSubmit={vi.fn()} />);

    // Por defecto una variable no es inicial, por ende no debe mostrarse la pregunta
    const checkboxInicial = screen.getByLabelText(/es una variable inicial/i);
    expect(checkboxInicial).not.toBeChecked();
    expect(screen.queryByLabelText(/pregunta para el usuario/i)).not.toBeInTheDocument();

    // Al marcarla como inicial
    fireEvent.click(checkboxInicial);
    expect(checkboxInicial).toBeChecked();
    expect(screen.getByLabelText(/pregunta para el usuario/i)).toBeInTheDocument();

    // Al desmarcarla
    fireEvent.click(checkboxInicial);
    expect(checkboxInicial).not.toBeChecked();
    expect(screen.queryByLabelText(/pregunta para el usuario/i)).not.toBeInTheDocument();
  });

  it('guarda los datos con es_inicial y pregunta cuando está configurada', async () => {
    const handleSubmit = vi.fn();
    render(<VariableForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre de la variable/i), {
      target: { value: 'temperatura_ambiente' },
    });

    const checkboxInicial = screen.getByLabelText(/es una variable inicial/i);
    fireEvent.click(checkboxInicial);

    const inputPregunta = screen.getByLabelText(/pregunta para el usuario/i);
    fireEvent.change(inputPregunta, {
      target: { value: '¿Cuál es la temperatura del ambiente?' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar variable/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          nombre: 'temperatura_ambiente',
          es_inicial: true,
          pregunta: '¿Cuál es la temperatura del ambiente?',
        })
      );
    });
  });

  it('carga initialValues con es_inicial en true y pregunta configurada', () => {
    render(
      <VariableForm
        initialValues={{
          nombre: 'nivel_estres',
          tipo: 'ENTERO',
          es_inicial: true,
          pregunta: '¿Cuál es su nivel de estrés del 1 al 10?',
        }}
        onSubmit={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/es una variable inicial/i);
    expect(checkbox).toBeChecked();

    const inputPregunta = screen.getByLabelText(/pregunta para el usuario/i);
    expect(inputPregunta).toHaveValue('¿Cuál es su nivel de estrés del 1 al 10?');
  });
});
