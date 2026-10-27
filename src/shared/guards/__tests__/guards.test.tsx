import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AuthGuard from '../AuthGuard';
import PermisoGuard from '../PermisoGuard';
import { useAuthStore, type AuthUser } from '@/features/auth/authStore';
import { Permisos } from '@/config/permisos';

const user: AuthUser = { id: 42, nombre: 'Ana', username: 'ana', email: 'ana@example.com', roles: [], es_admin_central: false, permisos: [] };
function LoginLocation() { const location = useLocation(); return <p>{location.pathname}{location.search}</p>; }
beforeEach(() => {
  vi.spyOn(useAuthStore.getState(), 'restaurarSesion').mockResolvedValue();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'anonimo' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('route guards', () => {
  it('keeps the destination and query when requesting authentication', () => {
    render(<MemoryRouter initialEntries={['/sistemas?orden=nombre']}><Routes><Route element={<AuthGuard />}><Route path="/sistemas" element={<p>Privado</p>} /></Route><Route path="/central/login" element={<LoginLocation />} /></Routes></MemoryRouter>);
    expect(screen.getByText('/central/login?next=%2Fsistemas%3Forden%3Dnombre')).toBeInTheDocument();
    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
  });
  it('shows loading before restoring the account', () => {
    useAuthStore.setState({ status: 'cargando' });
    render(<MemoryRouter><Routes><Route element={<AuthGuard />}><Route path="/" element={<p>Privado</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
  });
  it('does not grant every permission to a central administrator', () => {
    useAuthStore.setState({ status: 'autenticado', user: { ...user, es_admin_central: true, permisos: [Permisos.CENTRAL_ACCEDER] } });
    render(<MemoryRouter><Routes><Route element={<PermisoGuard permisos={[Permisos.CENTRAL_USUARIOS_VER]} />}><Route path="/" element={<p>Usuarios privados</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByText('No tiene acceso a esta sección')).toBeInTheDocument();
    expect(screen.queryByText('Usuarios privados')).not.toBeInTheDocument();
  });
  it('renders the protected screen for an authenticated permitted user', () => {
    useAuthStore.setState({ status: 'autenticado', user: { ...user, permisos: [Permisos.SISTEMAS_VER] } });
    render(<MemoryRouter><Routes><Route element={<AuthGuard />}><Route element={<PermisoGuard permisos={[Permisos.SISTEMAS_VER]} />}><Route path="/" element={<p>Sistemas autorizados</p>} /></Route></Route></Routes></MemoryRouter>);
    expect(screen.getByText('Sistemas autorizados')).toBeInTheDocument();
  });
});
