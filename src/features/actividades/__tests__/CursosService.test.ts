import { beforeEach, describe, expect, it, vi } from 'vitest';
import httpClient from '@/services/httpClient';
import actividadesService from '../services/actividadesService';

vi.mock('@/services/httpClient', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

describe('Contrato de cursos y actividades', () => {
  beforeEach(() => vi.clearAllMocks());
  it('inscribe por código y por token sin enviar identidad de otro estudiante', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: { data: { id: 'c1', nombre: 'Redes' } } });
    expect((await actividadesService.unirseCurso({ codigo: 'ABC123' })).id).toBe('c1');
    await actividadesService.unirseCurso({ token: 'invitacion' });
    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/cursos/unirse/', { codigo: 'ABC123' });
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/cursos/unirse/', { token: 'invitacion' });
  });
  it('normaliza el contexto plano de la API conservando permisos y asignación', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { data: {
      id: 'a1', estado: 'VIGENTE', fecha_limite: null, actividad: { id: 'act1' },
      curso: { id: 'c1' }, permisos: { ver_bc: false, inferencia_directa: true }, trabajo_sistema_id: 's1',
    } } });
    const contexto = await actividadesService.obtenerContexto('a1');
    expect(contexto.asignacion).toEqual({ id: 'a1', actividad_id: 'act1', curso_id: 'c1', estado: 'VIGENTE', fecha_limite: null });
    expect(contexto.permisos.ver_bc).toBe(false);
    expect(contexto.trabajo_sistema_id).toBe('s1');
  });
  it('retira una matrícula específica y reabre una entrega con nuevo plazo', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ data: { data: { activo: false } } });
    vi.mocked(httpClient.post).mockResolvedValue({ data: { data: { estado: 'BORRADOR' } } });
    await actividadesService.actualizarMiembro('c1', 8, false);
    expect(httpClient.patch).toHaveBeenCalledWith('/cursos/c1/miembros/8/', { activo: false });
    await actividadesService.reabrirEntrega('e1', '2026-12-01T12:00:00Z');
    expect(httpClient.post).toHaveBeenCalledWith('/entregas/e1/reabrir/', { fecha_limite: '2026-12-01T12:00:00Z' });
  });
});
