import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HechoForm from '../components/HechoForm';

describe('HechoForm', () => {
  it('requiere nombre pero permite dejar el valor vacío', async () => {
    const handleSubmit = vi.fn();
    render(<HechoForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /guardar hecho/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/el nombre del hecho es obligatorio/i)).toBeInTheDocument();
      expect(screen.queryByText(/el valor del hecho es obligatorio/i)).not.toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it.each(['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO', 'OPCION'] as const)(
    'guarda un hecho %s sin asignarle un valor inicial', async (tipo_dato) => {
      const handleSubmit = vi.fn();
      render(<HechoForm onSubmit={handleSubmit} initialValues={{ nombre: 'Dato', tipo_dato, opciones: ['uno', 'dos'] }} />);
      expect(screen.getByLabelText(/valor del hecho/i)).toHaveValue(
        tipo_dato === 'ENTERO' || tipo_dato === 'DECIMAL' ? null : '',
      );
      fireEvent.click(screen.getByRole('button', { name: /guardar hecho/i }));
      await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Dato', tipo_dato, valor: '' })));
    },
  );

  it('agregar opciones no selecciona automáticamente un valor inicial', async () => {
    const handleSubmit = vi.fn();
    render(<HechoForm onSubmit={handleSubmit} initialValues={{ nombre: 'Dato', tipo_dato: 'OPCION' }} />);
    fireEvent.change(screen.getByPlaceholderText(/escribe una opción/i), { target: { value: 'uno, dos' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));
    expect(screen.getByLabelText(/valor del hecho/i)).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: /guardar hecho/i }));
    await waitFor(() => expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor: '', opciones: ['uno', 'dos'] })));
  });

  it('permite registrar un hecho correctamente', async () => {
    const handleSubmit = vi.fn();
    render(<HechoForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre del hecho/i), {
      target: { value: 'temperatura' },
    });
    fireEvent.change(screen.getByLabelText(/tipo de dato/i), {
      target: { value: 'DECIMAL' },
    });
    fireEvent.change(screen.getByLabelText(/valor del hecho/i), {
      target: { value: '38.5' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar hecho/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          nombre: 'temperatura',
          tipo_dato: 'DECIMAL',
          valor: '38.5',
          es_inicial: true,
        })
      );
    });
  });

  it('permite registrar un hecho con tipo OPCION y opciones múltiples separadas por comas', async () => {
    const handleSubmit = vi.fn();
    render(<HechoForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre del hecho/i), {
      target: { value: 'severidad' },
    });
    fireEvent.change(screen.getByLabelText(/tipo de dato/i), {
      target: { value: 'OPCION' },
    });

    // Ingresar opciones separadas por comas
    const inputOpcion = screen.getByPlaceholderText(/escribe una opción/i);
    fireEvent.change(inputOpcion, { target: { value: 'leve, moderado, severo' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));

    expect(screen.getAllByText('leve').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('moderado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('severo').length).toBeGreaterThanOrEqual(1);

    // Seleccionar valor del hecho entre las opciones
    fireEvent.change(screen.getByLabelText(/valor del hecho/i), {
      target: { value: 'moderado' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar hecho/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          nombre: 'severidad',
          tipo_dato: 'OPCION',
          valor: 'moderado',
          opciones: ['leve', 'moderado', 'severo'],
          es_inicial: true,
        })
      );
    });
  });

  it('solo muestra la pregunta para el usuario si es_inicial está marcado', async () => {
    render(<HechoForm onSubmit={vi.fn()} />);

    // Por defecto es_inicial está activo, por lo que la pregunta debe estar visible
    const checkboxInicial = screen.getByLabelText(/es un hecho inicial/i);
    expect(checkboxInicial).toBeChecked();
    expect(screen.getByLabelText(/pregunta para el usuario/i)).toBeInTheDocument();

    // Desmarcar es_inicial
    fireEvent.click(checkboxInicial);
    expect(checkboxInicial).not.toBeChecked();

    // La pregunta debe ocultarse
    expect(screen.queryByLabelText(/pregunta para el usuario/i)).not.toBeInTheDocument();

    // Volver a marcar es_inicial
    fireEvent.click(checkboxInicial);
    expect(checkboxInicial).toBeChecked();
    expect(screen.getByLabelText(/pregunta para el usuario/i)).toBeInTheDocument();
  });
});
