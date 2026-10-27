import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import httpClient from '@/services/httpClient';
import HistorialInferenciaPage from '../pages/HistorialInferenciaPage';

vi.mock('@/services/httpClient', () => ({ default: { get: vi.fn() } }));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'sistema-1' }), useNavigate: () => vi.fn(),
}));
vi.mock('@/config/permisos', () => ({ Permisos: {}, usePuede: () => true }));
vi.mock('@/features/sistemas-expertos/hooks/useSistemasExpertos', () => ({
  useSistemaExperto: () => ({ data: { nombre: 'Diagnóstico' } }),
}));
vi.mock('../components/ExplicacionConclusionModal', () => ({ default: () => null }));

const ejecucion = {
  id: 'directa', estado: 'FINALIZADA', modo: 'AUTOMATICA', es_simulacion: false,
  fecha_inicio: '2026-10-26T15:30:00Z', fecha_fin: '2026-10-26T15:30:01Z',
  paso_actual: 4, paso_visual_actual: 2, total_pasos: 2, total_reglas_evaluadas: 12,
  conclusion_final: 'Router apagado',
};

function abrir() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><HistorialInferenciaPage /></QueryClientProvider>);
}

describe('HistorialInferenciaPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra fecha, modo y contadores reales del contrato de historial', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: [ejecucion, {
      ...ejecucion, id: 'simulada', modo: 'PASO_A_PASO', es_simulacion: true,
      estado: 'PAUSADA', conclusion_final: 'WiFi desactivado', total_pasos: 1,
    }] } });
    abrir();
    const directa = (await screen.findByText('Router apagado')).closest('tr')!;
    const simulada = screen.getByText('WiFi desactivado').closest('tr')!;
    expect(directa.querySelector('td')).toHaveTextContent(
      new Date(ejecucion.fecha_inicio).toLocaleString().replace(/\s+/g, ' '),
    );
    expect(within(directa).getByText('Directo')).toBeInTheDocument();
    expect(within(simulada).getByText('Simulación Paso a Paso')).toBeInTheDocument();
    expect(within(directa).getByText('2 pasos')).toBeInTheDocument();
    expect(within(directa).getByText('12 evaluaciones')).toBeInTheDocument();
    expect(within(simulada).getByText('1 paso')).toBeInTheDocument();
    expect(screen.queryByText('N/D')).not.toBeInTheDocument();
    expect(screen.queryByText('0 ev.')).not.toBeInTheDocument();
  });

  it('envía el sistema y los filtros con los nombres y valores que acepta la API', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: [ejecucion] } });
    abrir();
    await screen.findByText('Router apagado');
    expect(httpClient.get).toHaveBeenCalledWith('/historial-inferencias/', {
      params: { sistema_id: 'sistema-1', modo: undefined, estado: undefined },
    });
    fireEvent.change(screen.getByLabelText('Filtrar por modo de inferencia'), { target: { value: 'SIMULACION_PASO_A_PASO' } });
    fireEvent.change(screen.getByLabelText('Filtrar por estado de ejecución'), { target: { value: 'EJECUTANDO' } });
    await waitFor(() => expect(httpClient.get).toHaveBeenLastCalledWith('/historial-inferencias/', {
      params: { sistema_id: 'sistema-1', modo: 'SIMULACION_PASO_A_PASO', estado: 'EJECUTANDO' },
    }));
  });

  it('respeta contadores cero sin sustituirlos por el cursor de evaluación', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: [{
      ...ejecucion, total_pasos: 0, total_reglas_evaluadas: 0,
    }] } });
    abrir();
    expect(await screen.findByText('0 pasos')).toBeInTheDocument();
    expect(screen.getByText('0 evaluaciones')).toBeInTheDocument();
  });

  it('permite reintentar un error sin presentarlo como historial vacío', async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValue({ data: { data: [ejecucion] } });
    abrir();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el historial');
    expect(screen.queryByText('Sin ejecuciones registradas')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(await screen.findByText('Router apagado')).toBeInTheDocument();
  });
});
