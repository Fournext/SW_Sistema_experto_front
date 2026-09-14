import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConclusionFinalPanel from '../components/ConclusionFinalPanel';

describe('ConclusionFinalPanel', () => {
  it('muestra mensaje cuando no hay conclusión aún', () => {
    render(<ConclusionFinalPanel />);
    expect(screen.getByText(/no se ha derivado una conclusión final aún/i)).toBeInTheDocument();
  });

  it('muestra la conclusión final y el factor de certeza cuando existen', () => {
    render(
      <ConclusionFinalPanel
        conclusion="Infección Bacteriana Aguda"
        factorCerteza={0.88}
        estado="COMPLETADA"
      />
    );

    expect(screen.getByText('Infección Bacteriana Aguda')).toBeInTheDocument();
    expect(screen.getByText('88.0%')).toBeInTheDocument();
  });
});
