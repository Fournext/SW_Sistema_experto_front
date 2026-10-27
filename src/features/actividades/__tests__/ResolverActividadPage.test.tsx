import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContextoActividad } from '../types/types';
import ResolverActividadPage from '../pages/ResolverActividadPage';

const mocks = vi.hoisted(() => ({
  contexto: undefined as ContextoActividad | undefined,
  guardar: vi.fn(), enviar: vi.fn(), refetch: vi.fn(), navigate: vi.fn(), historial: vi.fn(),
}));
vi.mock('react-router-dom', async (original) => ({ ...await original<object>(), useParams: () => ({ idAsignacion: 'a1' }), useNavigate: () => mocks.navigate }));
vi.mock('@/config/permisos', () => ({ Permisos: {}, usePuede: () => true }));
vi.mock('@/features/inferencia/services/inferenciaService', () => ({ default: { listarHistorial: mocks.historial } }));
vi.mock('../hooks/useActividades', () => ({
  useContextoActividad: () => ({ data: mocks.contexto, isPending: false, isError: false, refetch: mocks.refetch }),
  useEntregaEstudiante: () => ({ data: null, isLoading: false, isError: false, refetch: mocks.refetch }),
  useGuardarBorrador: () => ({ mutateAsync: mocks.guardar, isPending: false }),
  useEnviarEntrega: () => ({ mutateAsync: mocks.enviar, isPending: false }),
}));

const abrir = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ResolverActividadPage /></MemoryRouter></QueryClientProvider>);
describe('Resolver actividad del curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.contexto = {
      asignacion: { id: 'a1', actividad_id: 'act', curso_id: 'c1', estado: 'VIGENTE' },
      curso: { id: 'c1', nombre: 'Lógica', codigo: 'LOG', activo: true },
      actividad: { id: 'act', titulo: 'Diagnóstico', instrucciones: 'Analiza las reglas y explica tu conclusión.', tipo: 'ANALISIS_BC', dificultad: 'MEDIA', estado: 'PUBLICADA', activa: true, sistema_experto_id: 's1' },
      permisos: { ver_bc: true, editar_bc: false, editor_visual: false, inferencia_directa: true, simulacion: false, validacion: false, trazabilidad: false },
      entrega: null, trabajo_sistema_id: 's1', puede_editar: true,
    };
    mocks.guardar.mockResolvedValue({}); mocks.enviar.mockResolvedValue({}); mocks.refetch.mockResolvedValue({});
    mocks.historial.mockResolvedValue([]);
  });
  it('presenta instrucciones y solo herramientas autorizadas', () => {
    abrir();
    expect(screen.getByText('Analiza las reglas y explica tu conclusión.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizar la BC' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editor visual' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validar BC' })).not.toBeInTheDocument();
  });
  it('guarda la respuesta antes de navegar a la herramienta', async () => {
    abrir();
    fireEvent.change(screen.getByLabelText('Tu respuesta y conclusiones'), { target: { value: 'Mi conclusión' } });
    fireEvent.click(screen.getByRole('button', { name: 'Realizar inferencia' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/actividades/resolver/a1/sistemas/s1/inferencia'));
    expect(mocks.guardar).toHaveBeenCalledWith({ asignacionId: 'a1', datos: { solucion_texto: 'Mi conclusión', ejecuciones_ids: [] } });
    expect(mocks.guardar.mock.invocationCallOrder[0]).toBeLessThan(mocks.navigate.mock.invocationCallOrder[0]);
  });
  it('permite entregar una respuesta escrita sin inferencias adjuntas', async () => {
    abrir();
    fireEvent.change(screen.getByLabelText('Tu respuesta y conclusiones'), { target: { value: 'Análisis escrito' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar entrega' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Enviar entrega' }).at(-1)!);
    await waitFor(() => expect(mocks.enviar).toHaveBeenCalledWith({ asignacionId: 'a1', datos: { solucion_texto: 'Análisis escrito', ejecuciones_ids: [] } }));
  });
  it('permite seleccionar una ejecución propia para adjuntarla al envío', async () => {
    mocks.historial.mockResolvedValue([{ id: 'ej1', estado: 'FINALIZADA', conclusion_final: 'Diagnóstico obtenido' }]);
    abrir();
    fireEvent.click(await screen.findByRole('checkbox', { name: /Diagnóstico obtenido/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar entrega' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Enviar entrega' }).at(-1)!);
    await waitFor(() => expect(mocks.enviar).toHaveBeenCalledWith({ asignacionId: 'a1', datos: { solucion_texto: '', ejecuciones_ids: ['ej1'] } }));
  });
  it('una entrega enviada se muestra en lectura sin permitir inferencias nuevas', () => {
    mocks.contexto!.entrega = { id: 'e1', asignacion_id: 'a1', estado: 'ENVIADA', solucion_texto: 'Enviado' };
    abrir();
    expect(screen.getByLabelText('Tu respuesta y conclusiones')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Realizar inferencia' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar entrega' })).not.toBeInTheDocument();
  });
});
