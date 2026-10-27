import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { Permisos } from '@/config/permisos';
import SistemaExpertoCard from '../components/SistemaExpertoCard';

const usuario = {
  id: 1, username: 'docente', nombre: 'Docente', email: 'docente@example.com',
  roles: ['docente'], es_admin_central: false, permisos: [Permisos.SISTEMAS_VER],
};

afterEach(() => useAuthStore.setState({ user: null, status: 'anonimo' }));

describe('Acciones de sistemas por permisos', () => {
  it.each([['ACTIVO', 'Activo'], ['BORRADOR', 'Borrador'], ['ARCHIVADO', 'Archivado']])('muestra correctamente el estado %s', (estado, etiqueta) => {
    useAuthStore.setState({ user: usuario, status: 'autenticado' });
    render(<MemoryRouter><SistemaExpertoCard sistema={{ id: 1, nombre: 'Diagnóstico', descripcion: null, estado }} onEliminar={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(etiqueta)).toBeInTheDocument();
  });

  it('permite consultar el detalle sin exponer acciones de otros módulos o eliminar', () => {
    useAuthStore.setState({ user: usuario, status: 'autenticado' });
    render(<MemoryRouter><SistemaExpertoCard sistema={{ id: 1, nombre: 'Diagnóstico', descripcion: null }} onEliminar={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /ver detalle/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar sistema/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^editor$/i })).not.toBeInTheDocument();
  });

  it('actualiza las acciones al cambiar permisos y ejecuta solo la acción autorizada', () => {
    const eliminar = vi.fn();
    useAuthStore.setState({ user: usuario, status: 'autenticado' });
    render(<MemoryRouter><SistemaExpertoCard sistema={{ id: 7, nombre: 'Diagnóstico', descripcion: null }} onEliminar={eliminar} /></MemoryRouter>);
    act(() => useAuthStore.setState({ user: { ...usuario, permisos: [...usuario.permisos, Permisos.SISTEMAS_ELIMINAR] } }));
    fireEvent.click(screen.getByRole('button', { name: /eliminar sistema/i }));
    expect(eliminar).toHaveBeenCalledWith(7);
    act(() => useAuthStore.setState({ user: usuario }));
    expect(screen.queryByRole('button', { name: /eliminar sistema/i })).not.toBeInTheDocument();
  });
});
