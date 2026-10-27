import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import httpClient from '@/services/httpClient';
import SistemaExpertoForm from '../components/SistemaExpertoForm';
import sistemasExpertosService from '../services/sistemasExpertosService';

vi.mock('@/services/httpClient', () => ({ default: {
  get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(),
} }));

describe('Estado del sistema experto', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([true, false])('envía el estado que acepta la API al guardar activo=%s desde el formulario', async (activo) => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: { id: 's1', nombre: 'Diagnóstico', estado: activo ? 'ACTIVO' : 'BORRADOR' } });
    render(<SistemaExpertoForm initialValues={{ nombre: 'Diagnóstico', activo: !activo }}
      onSubmit={async (datos) => { await sistemasExpertosService.actualizar('s1', datos); }} />);
    fireEvent.click(screen.getByLabelText('Habilitar sistema como activo'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Sistema Experto' }));
    await waitFor(() => expect(httpClient.put).toHaveBeenCalledWith('/sistemas-expertos/s1/', {
      nombre: 'Diagnóstico', descripcion: '', estado: activo ? 'ACTIVO' : 'BORRADOR',
    }));
  });

  it('crea un sistema con estado ACTIVO al habilitarlo', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: { id: 's1', nombre: 'Diagnóstico', estado: 'ACTIVO' } });
    const creado = await sistemasExpertosService.crear({ nombre: 'Diagnóstico', activo: true });
    expect(httpClient.post).toHaveBeenCalledWith('/sistemas-expertos/', { nombre: 'Diagnóstico', estado: 'ACTIVO' });
    expect(creado.activo).toBe(true);
  });

  it('una actualización parcial de nombre conserva el estado', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { id: 's1', nombre: 'Renombrado', estado: 'ACTIVO' } });
    await sistemasExpertosService.actualizarParcial('s1', { nombre: 'Renombrado' });
    expect(httpClient.patch).toHaveBeenCalledWith('/sistemas-expertos/s1/', { nombre: 'Renombrado' });
  });

  it('interpreta los estados de la API sin marcar borradores o archivados como activos', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: ['ACTIVO', 'BORRADOR', 'ARCHIVADO'].map((estado) => ({
      id: estado, nombre: estado, estado,
    })) });
    expect((await sistemasExpertosService.listar()).map((s) => s.activo)).toEqual([true, false, false]);
  });
});
