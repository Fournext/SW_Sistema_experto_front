import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CentralLoginPage from '../pages/CentralLoginPage';
import RegistroEstudiantePage from '../pages/RegistroEstudiantePage';
import { authService } from '@/features/auth/services/authService';
import { useAuthStore, type AuthUser } from '@/features/auth/authStore';
import { Permisos } from '@/config/permisos';

const user: AuthUser = { id: 7, nombre: 'Estudiante', username: 'estudiante', email: 'estudiante@example.com', roles: ['estudiante'], es_admin_central: false, permisos: [Permisos.ACTIVIDADES_RESOLVER] };
beforeEach(() => { useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, status: 'anonimo' }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
it('authenticates students through the central login and redirects to their courses', async () => {
  vi.spyOn(authService, 'login').mockResolvedValue({ access: 'access', refresh: 'refresh', user });
  render(<MemoryRouter initialEntries={['/central/login']}><Routes><Route path="/central/login" element={<CentralLoginPage />} /><Route path="/cursos" element={<p>Cursos del estudiante</p>} /></Routes></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'estudiante' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-segura' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar a la plataforma' }));
  expect(await screen.findByText('Cursos del estudiante')).toBeInTheDocument();
  expect(authService.login).toHaveBeenCalledWith('estudiante', 'clave-segura');
  expect(useAuthStore.getState().status).toBe('autenticado');
});
it('does not send registration when password confirmation differs', async () => {
  const register = vi.spyOn(authService, 'registroEstudiante');
  render(<MemoryRouter><RegistroEstudiantePage /></MemoryRouter>);
  for (const [label, value] of [['Nombre completo', 'Ana Estudiante'], ['Nombre de usuario', 'ana'], ['Correo electrónico', 'ana@example.com'], ['Contraseña', 'clave-segura'], ['Confirmar contraseña', 'diferente']]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta de estudiante' }));
  await waitFor(() => expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument());
  expect(register).not.toHaveBeenCalled();
});
