import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RegistroEstudiantePage from '@/features/central/pages/RegistroEstudiantePage';
import { authService } from '@/features/auth/services/authService';

vi.mock('@/features/auth/services/authService', () => ({ authService: { registroEstudiante: vi.fn() } }));

describe('Invitación al registrar una cuenta', () => {
  it('conserva el destino del curso al terminar el registro y volver al login', async () => {
    vi.mocked(authService.registroEstudiante).mockResolvedValue({ id: 1 } as never);
    const next = '/cursos/unirse?token=invitacion-segura';
    const login = `/central/login?next=${encodeURIComponent(next)}`;
    render(<MemoryRouter initialEntries={[`/registro-estudiante?next=${encodeURIComponent(next)}`]}><RegistroEstudiantePage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Inicia sesión' })).toHaveAttribute('href', login);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Estudiante' } });
    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'ana' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'ClaveSegura123' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'ClaveSegura123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta de estudiante' }));
    expect(await screen.findByRole('link', { name: 'Continuar al inicio de sesión' })).toHaveAttribute('href', login);
  });
});
