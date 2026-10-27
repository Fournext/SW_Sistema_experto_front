import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PanelPropiedadesHecho from '../components/PanelPropiedadesHecho';
import PanelPropiedadesVariable from '../components/PanelPropiedadesVariable';

describe('Valores opcionales en el editor visual', () => {
  it('permite quitar el valor de un hecho booleano', async () => {
    const guardar = vi.fn();
    render(<PanelPropiedadesHecho nodo={{ id: 'h', position: { x: 0, y: 0 }, data: { nombre: 'Hecho', valor: 'false', tipo_dato: 'BOOLEANO' } }} onGuardar={guardar} />);
    fireEvent.change(screen.getByLabelText('Valor Asignado'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /aplicar cambios/i }));
    await waitFor(() => expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ valor: '' }), expect.anything()));
  });

  it('permite quitar el valor inicial de una variable', async () => {
    const guardar = vi.fn();
    render(<PanelPropiedadesVariable nodo={{ id: 'v', position: { x: 0, y: 0 }, data: { nombre: 'Variable', valor_por_defecto: '4', tipo: 'ENTERO' } }} onGuardar={guardar} />);
    fireEvent.change(screen.getByLabelText(/valor inicial/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /aplicar cambios/i }));
    await waitFor(() => expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ valor_por_defecto: '' }), expect.anything()));
  });
});
