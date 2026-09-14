import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReglaEstadoBadge from '../components/ReglaEstadoBadge';

describe('ReglaEstadoBadge', () => {
  it('renderiza correctamente los 4 estados principales', () => {
    const { rerender } = render(<ReglaEstadoBadge estado="ACTIVADA" />);
    expect(screen.getByText('ACTIVADA')).toBeInTheDocument();

    rerender(<ReglaEstadoBadge estado="RECHAZADA" />);
    expect(screen.getByText('RECHAZADA')).toBeInTheDocument();

    rerender(<ReglaEstadoBadge estado="EVALUADA" />);
    expect(screen.getByText('EVALUADA')).toBeInTheDocument();

    rerender(<ReglaEstadoBadge estado="EJECUTADA" />);
    expect(screen.getByText('EJECUTADA')).toBeInTheDocument();
  });
});
