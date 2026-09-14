import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HechoForm from '../components/HechoForm';

describe('HechoForm', () => {
  it('valida que el nombre y valor sean obligatorios', async () => {
    const handleSubmit = vi.fn();
    render(<HechoForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /guardar hecho/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/el nombre del hecho es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/el valor del hecho es obligatorio/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
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
});
