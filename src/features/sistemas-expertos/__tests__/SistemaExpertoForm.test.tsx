import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SistemaExpertoForm from '../components/SistemaExpertoForm';

describe('SistemaExpertoForm', () => {
  it('renderiza campos obligatorios y botones correctamente', () => {
    render(<SistemaExpertoForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/nombre del sistema experto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción pedagógica/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar sistema experto/i })).toBeInTheDocument();
  });

  it('muestra error de validación cuando el nombre está vacío', async () => {
    const handleSubmit = vi.fn();
    render(<SistemaExpertoForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /guardar sistema experto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/el nombre del sistema experto es obligatorio/i)
      ).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos correctos cuando el formulario es válido', async () => {
    const handleSubmit = vi.fn();
    render(<SistemaExpertoForm onSubmit={handleSubmit} />);

    const nombreInput = screen.getByLabelText(/nombre del sistema experto/i);
    const descInput = screen.getByLabelText(/descripción pedagógica/i);

    fireEvent.change(nombreInput, { target: { value: 'Diagnóstico Médico' } });
    fireEvent.change(descInput, { target: { value: 'Sistema de apoyo para medicina' } });

    const submitBtn = screen.getByRole('button', { name: /guardar sistema experto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          nombre: 'Diagnóstico Médico',
          descripcion: 'Sistema de apoyo para medicina',
          activo: true,
        })
      );
    });
  });
});
