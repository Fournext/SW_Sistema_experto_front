import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HechosGeneradosPanel from '../components/HechosGeneradosPanel';
import type { HechoDeducido } from '../types/types';

describe('HechosGeneradosPanel', () => {
  const mockHechos: HechoDeducido[] = [
    {
      nombre: 'temperatura',
      valor: '39',
      procedencia: 'INICIAL',
    },
    {
      nombre: 'fiebre_alta',
      valor: true,
      procedencia: 'INFERIDO',
      paso_numero: 1,
      factor_certeza: 0.9,
      regla_origen_nombre: 'R1_DetectarFiebre',
    },
  ];

  it('renderiza hechos y permite filtrar entre iniciales e inferidos', () => {
    render(<HechosGeneradosPanel hechos={mockHechos} pasoActual={1} />);

    expect(screen.getByText('temperatura')).toBeInTheDocument();
    expect(screen.getByText('fiebre_alta')).toBeInTheDocument();
    expect(screen.getByText(/r1_detectarfiebre/i)).toBeInTheDocument();

    // Filtro por solo iniciales
    const btnIniciales = screen.getByRole('button', { name: /iniciales/i });
    fireEvent.click(btnIniciales);
    expect(screen.getByText('temperatura')).toBeInTheDocument();
    expect(screen.queryByText('fiebre_alta')).not.toBeInTheDocument();

    // Filtro por solo inferidos
    const btnInferidos = screen.getByRole('button', { name: /inferidos/i });
    fireEvent.click(btnInferidos);
    expect(screen.getByText('fiebre_alta')).toBeInTheDocument();
    expect(screen.queryByText('temperatura')).not.toBeInTheDocument();
  });
});
