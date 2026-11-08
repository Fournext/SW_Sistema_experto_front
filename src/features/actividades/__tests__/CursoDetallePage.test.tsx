import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import CursoDetallePage from '../pages/CursoDetallePage';
import actividadesService from '../services/actividadesService';
import * as useActividadesHook from '../hooks/useActividades';
import * as permisosConfig from '@/config/permisos';

vi.mock('../services/actividadesService', () => ({
  default: {
    regenerarInvitacion: vi.fn(),
    actualizarCurso: vi.fn(),
    actualizarMiembro: vi.fn(),
    actualizarAsignacion: vi.fn(),
  },
}));

vi.mock('../pages/ActividadesDocentePage', () => ({
  default: () => <div data-testid="actividades-docente-stub" />,
}));

describe('CursoDetallePage - Regenerar invitación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(permisosConfig, 'usePuede').mockReturnValue(true);
    vi.spyOn(useActividadesHook, 'useCurso').mockReturnValue({
      data: {
        id: 'c1',
        codigo: 'INF-101',
        nombre: 'Inteligencia Artificial',
        descripcion: 'Curso base',
        activo: true,
        token_ingreso: 'token-test',
        codigo_ingreso: 'ABC1234',
        asignaciones: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useActividadesHook, 'useMiembrosCurso').mockReturnValue({
      data: [],
      refetch: vi.fn(),
    } as any);
  });

  it('abre el modal ConfirmDialog sin usar window.confirm nativo', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/cursos/c1']}>
          <Routes>
            <Route path="/cursos/:idCurso" element={<CursoDetallePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const botonRegenerar = screen.getByRole('button', { name: /regenerar invitación/i });
    fireEvent.click(botonRegenerar);

    // No debe usar window.confirm nativo del navegador
    expect(confirmSpy).not.toHaveBeenCalled();

    // Debe mostrar el modal de confirmación en el DOM
    expect(screen.getByText('Regenerar invitación del curso')).toBeInTheDocument();
    expect(
      screen.getByText(/Los enlaces y códigos anteriores dejarán de funcionar de inmediato/i)
    ).toBeInTheDocument();
  });
});

