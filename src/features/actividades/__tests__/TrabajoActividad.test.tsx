import { describe, expect, it } from 'vitest';
import { rutaTrabajo } from '@/services/trabajoHttpClient';
import { permisosDelTrabajo } from '../pages/TrabajoActividadPage';
import { Permisos } from '@/config/permisos';
import type { ContextoActividad } from '../types/types';

const contexto = (): ContextoActividad => ({
  asignacion: { id: 'a1', actividad_id: 'act', curso_id: 'c1', estado: 'VIGENTE' },
  curso: { id: 'c1', nombre: 'Curso', codigo: 'C1', activo: true },
  actividad: { id: 'act', titulo: 'Crear BC', instrucciones: 'Trabajo', tipo: 'CREACION_BC', dificultad: 'MEDIA', estado: 'PUBLICADA', activa: true, sistema_experto_id: null },
  permisos: { ver_bc: true, editar_bc: true, editor_visual: true, inferencia_directa: false, simulacion: false, validacion: true, trazabilidad: false },
  entrega: null, trabajo_sistema_id: 's1', puede_editar: true,
});

describe('Espacio de trabajo de una actividad', () => {
  it.each([
    '/sistemas-expertos/s1/base-conocimiento/', '/hechos/h1/', '/simulaciones/e1/paso/',
    '/bases-conocimiento/b1/validar/', '/historial-inferencias/', '/reglas/r1/conclusiones/',
  ])('conserva el contexto al consultar %s', (url) => {
    expect(rutaTrabajo(url, '/actividades/resolver/a1/sistemas/s1/editor')).toBe(`/asignaciones/a1/trabajo${url}`);
  });
  it('no transforma recursos generales o peticiones fuera del trabajo', () => {
    expect(rutaTrabajo('/cursos/', '/actividades/resolver/a1')).toBe('/cursos/');
    expect(rutaTrabajo('/asignaciones/a1/enviar/', '/actividades/resolver/a1')).toBe('/asignaciones/a1/enviar/');
    expect(rutaTrabajo('/hechos/h1/', '/sistemas/s1/editor')).toBe('/hechos/h1/');
  });
  it('permite crear la BC propia sin conceder inferencia ni publicación global', () => {
    const permisos = permisosDelTrabajo(contexto());
    expect(permisos.has(Permisos.HECHOS_CREAR)).toBe(true);
    expect(permisos.has(Permisos.EDITOR_NODOS_CREAR)).toBe(true);
    expect(permisos.has(Permisos.INFERENCIA_EJECUTAR)).toBe(false);
    expect(permisos.has(Permisos.SISTEMAS_EDITAR)).toBe(false);
  });
  it('solo inferencia no concede lectura de BC ni trazabilidad', () => {
    const ctx = contexto();
    ctx.permisos = { ver_bc: false, editar_bc: false, editor_visual: false, inferencia_directa: true, simulacion: true, validacion: false, trazabilidad: false };
    const permisos = permisosDelTrabajo(ctx);
    expect(permisos.has(Permisos.INFERENCIA_EJECUTAR)).toBe(true);
    expect(permisos.has(Permisos.SIMULACION_INICIAR)).toBe(true);
    expect(permisos.has(Permisos.REGLAS_VER)).toBe(false);
    expect(permisos.has(Permisos.INFERENCIA_TRAZABILIDAD_VER)).toBe(false);
  });
  it.each(['enviada', 'vencida', 'archivado', 'cerrada'])('bloquea cambios cuando está %s', (estado) => {
    const ctx = contexto();
    ctx.permisos.inferencia_directa = true;
    if (estado === 'enviada') ctx.entrega = { id: 'e1', asignacion_id: 'a1', estado: 'ENVIADA' };
    if (estado === 'vencida') ctx.asignacion.fecha_limite = '2000-01-01T00:00:00Z';
    if (estado === 'archivado') ctx.curso.activo = false;
    if (estado === 'cerrada') ctx.asignacion.estado = 'CERRADA';
    const permisos = permisosDelTrabajo(ctx);
    expect(permisos.has(Permisos.HECHOS_EDITAR)).toBe(false);
    expect(permisos.has(Permisos.INFERENCIA_EJECUTAR)).toBe(false);
    expect(permisos.has(Permisos.REGLAS_VER)).toBe(true);
  });
});
