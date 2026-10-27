import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConflictosPanel from '../components/ConflictosPanel';
import type { ConflictoInferencia } from '../types/types';

describe('ConflictosPanel', () => {
  it('muestra mensaje amigable cuando no se registraron conflictos', () => {
    render(<ConflictosPanel conflictos={[]} />);
    expect(screen.getByText(/no se presentaron conflictos de múltiples reglas/i)).toBeInTheDocument();
  });

  it('muestra reglas candidatas y destaca la seleccionada con su criterio', () => {
    const mockConflictos: ConflictoInferencia[] = [
      {
        id: 'conf-1',
        paso_numero: 1,
        criterio_aplicado: 'PRIORIDAD_Y_ESPECIFICIDAD_DETERMINISTA',
        regla_seleccionada_id: 'r-1',
        regla_seleccionada_nombre: 'Regla Diagnóstico Alfa',
        reglas_candidatas: [
          {
            id: 'rc-1',
            regla_id: 'r-1',
            nombre_regla: 'Regla Diagnóstico Alfa',
            prioridad: 10,
            numero_condiciones: 3,
            seleccionada: true,
          },
          {
            id: 'rc-2',
            regla_id: 'r-2',
            nombre_regla: 'Regla Diagnóstico Beta',
            prioridad: 5,
            numero_condiciones: 1,
            seleccionada: false,
            motivo_descarte: 'Superada por prioridad 10 vs 5.',
          },
        ],
      },
    ];

    render(<ConflictosPanel conflictos={mockConflictos} pasoActual={1} />);

    expect(screen.getByText(/resolución de conflictos/i)).toBeInTheDocument();
    expect(screen.getByText('Regla Diagnóstico Alfa')).toBeInTheDocument();
    expect(screen.getByText('Regla Diagnóstico Beta')).toBeInTheDocument();
    expect(screen.getByText('Seleccionada')).toBeInTheDocument();
    expect(screen.getByText('Descartada')).toBeInTheDocument();
  });
});
