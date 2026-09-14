import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReglaForm from '../components/ReglaForm';

describe('ReglaForm', () => {
  it('valida que el factor de certeza esté entre 0 y 1', async () => {
    const handleSubmit = vi.fn();
    render(<ReglaForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/identificador de la regla/i), {
      target: { value: 'R1' },
    });
    fireEvent.change(screen.getByLabelText(/factor de certeza/i), {
      target: { value: '1.5' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar regla/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/el factor de certeza máximo es 1.0/i)
      ).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('valida que la prioridad no sea negativa', async () => {
    const handleSubmit = vi.fn();
    render(<ReglaForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/identificador de la regla/i), {
      target: { value: 'R2' },
    });
    fireEvent.change(screen.getByLabelText(/prioridad de ejecución/i), {
      target: { value: '-2' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar regla/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/la prioridad debe ser un número mayor o igual a 0/i)
      ).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
