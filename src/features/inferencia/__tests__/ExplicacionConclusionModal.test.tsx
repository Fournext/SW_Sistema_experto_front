import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import httpClient from '@/services/httpClient';
import ExplicacionConclusionModal from '../components/ExplicacionConclusionModal';

vi.mock('@/services/httpClient', () => ({ default: { get: vi.fn() } }));

const respuesta = {
  conclusion: 'WiFi desactivado',
  texto: 'Se aplicó REGLA R01.',
  arbol: { tipo: 'CADENA_CAUSAL' },
  conclusion_nombre: 'Problema Detectado',
  conclusion_valor: 'WiFi desactivado',
  factor_certeza_final: null,
  resumen_explicativo: 'La conexión es wifi y el WiFi está desactivado.',
  hechos_iniciales_relevantes: [
    { nombre: 'Tipo Conexion', valor: 'wifi' },
    { nombre: 'Wifi Activo', valor: false },
  ],
  reglas_disparadas: [{
    id: 'r1', nombre: 'REGLA R01', prioridad: 20, factor_certeza: null,
    condiciones_cumplidas: ['Tipo Conexion = wifi', 'Wifi Activo = false'],
    consecuencia: 'Problema Detectado = WiFi desactivado',
  }],
  cadena_razonamiento: ['Paso 1: REGLA R01 dedujo WiFi desactivado.'],
};

function abrir() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>
    <ExplicacionConclusionModal isOpen onClose={vi.fn()} inferenciaId="ejecucion" />
  </QueryClientProvider>);
}

describe('ExplicacionConclusionModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra la explicación recibida por el servicio, con hechos y reglas', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: respuesta } });
    abrir();
    expect(await screen.findByRole('heading', { level: 4 })).toHaveTextContent('Problema Detectado = WiFi desactivado');
    expect(httpClient.get).toHaveBeenCalledWith('/ejecuciones/ejecucion/explicacion/');
    expect(screen.getByText(respuesta.resumen_explicativo)).toBeInTheDocument();
    expect(screen.getByText('Wifi Activo')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
    expect(screen.getByText('REGLA R01')).toBeInTheDocument();
    expect(screen.getByText('Tipo Conexion = wifi Y Wifi Activo = false')).toBeInTheDocument();
    expect(screen.getByText(respuesta.cadena_razonamiento[0])).toBeInTheDocument();
    expect(screen.getByText('No registrado')).toBeInTheDocument();
    expect(screen.queryByText(/undefined|NaN|1\.00/)).not.toBeInTheDocument();
  });

  it('conserva un factor de certeza cero', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { ...respuesta, factor_certeza_final: 0 } });
    abrir();
    expect(await screen.findByText('0.00')).toBeInTheDocument();
  });

  it('explica cuando no hubo conclusión sin mostrar undefined', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: {
      ...respuesta, conclusion: null, conclusion_nombre: null, conclusion_valor: null,
      hechos_iniciales_relevantes: [], reglas_disparadas: [], cadena_razonamiento: [],
      resumen_explicativo: 'No se alcanzó ninguna conclusión final durante el razonamiento.',
    } });
    abrir();
    expect(await screen.findByText('No se alcanzó una conclusión')).toBeInTheDocument();
    expect(screen.getByText('No se registraron reglas disparadas.')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('muestra un error cuando no se puede consultar la explicación', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('Error de red'));
    abrir();
    await waitFor(() => expect(screen.getByText(/No se pudo obtener la explicación/)).toBeInTheDocument());
    expect(screen.queryByText('Conclusión demostrada')).not.toBeInTheDocument();
  });
});
