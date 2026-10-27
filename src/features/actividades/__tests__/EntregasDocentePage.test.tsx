import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import httpClient from '@/services/httpClient';
import EntregasDocentePage from '../pages/EntregasDocentePage';

vi.mock('@/services/httpClient', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe('Revisión docente por actividad', () => {
  it('solo permite abrir contenido enviado y comenta sobre su revisión inmutable', async () => {
    vi.mocked(httpClient.get).mockImplementation(async (url) => {
      if (url === '/asignaciones/a1/') return { data: { data: { id: 'a1', estado: 'VIGENTE', actividad: { id: 'act', titulo: 'Redes' }, curso: { id: 'c1', nombre: 'Inteligencia artificial' }, permisos: {} } } };
      if (url === '/asignaciones/a1/entregas/') return { data: { data: [
        { estudiante_id: 1, estudiante_username: 'Pendiente', estado: 'PENDIENTE' },
        { estudiante_id: 2, estudiante_username: 'En progreso', estado: 'BORRADOR', entrega_id: 'e2' },
        { estudiante_id: 3, estudiante_username: 'Ana', estado: 'ENVIADA', entrega_id: 'e3', numero_revision: 1 },
      ] } };
      return { data: { data: {
        id: 'e3', estudiante_username: 'Ana', estado: 'ENVIADA', revisiones: [{
          id: 'rev1', numero: 1, creada_en: '2026-10-26T12:00:00Z', comentarios: [],
          snapshot: { solucion_texto: 'El fallo se encuentra en el adaptador.', bc: { nombre: 'Diagnóstico', hechos: [{ id: 'uuid-h', nombre: 'Conexión', valor: false }], variables: [], reglas: [] }, ejecuciones: [] },
        }],
      } } };
    });
    vi.mocked(httpClient.post).mockResolvedValue({ data: { data: { id: 'comentario', texto: 'Buen análisis' } } });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/asignaciones/a1/entregas']}><Routes><Route path="/asignaciones/:idAsignacion/entregas" element={<EntregasDocentePage />} /></Routes></MemoryRouter>
    </QueryClientProvider>);
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Revisar entrega' })).toHaveLength(1);
    expect(screen.getAllByText('Aún no enviada')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar entrega' }));
    expect(await screen.findByText('El fallo se encuentra en el adaptador.')).toBeInTheDocument();
    expect(screen.getByText('Conexión = false')).toBeInTheDocument();
    expect(screen.queryByText('uuid-h')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Comentario para el estudiante'), { target: { value: 'Buen análisis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar comentario' }));
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledWith('/entregas/e3/comentarios/', { texto: 'Buen análisis', revision_id: 'rev1' }));
  });
});
