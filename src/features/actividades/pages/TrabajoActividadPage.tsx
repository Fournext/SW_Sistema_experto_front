import { useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useContextoActividad } from '../hooks/useActividades';
import type { ContextoActividad } from '../types/types';
import type { EntradaTrabajo } from '../types/trabajo';
import httpClient from '@/services/httpClient';
import { Permisos } from '@/config/permisos';
import { PermisosTrabajoContext } from '@/shared/context/PermisosTrabajoContext';
import BaseConocimientoPage from '@/features/base-conocimiento/pages/BaseConocimientoPage';
import EditorVisualPage from '@/features/editor-visual/pages/EditorVisualPage';
import InferenciaPage from '@/features/inferencia/pages/InferenciaPage';
import HistorialInferenciaPage from '@/features/inferencia/pages/HistorialInferenciaPage';
import ValidacionPage from '@/features/validacion/pages/ValidacionPage';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';

export function permisosDelTrabajo(contexto: ContextoActividad): Set<string> {
  const permisos = new Set<string>([Permisos.SISTEMAS_VER]);
  const p = contexto.permisos;
  const cerrada = contexto.solo_lectura || contexto.puede_trabajar === false
    || contexto.entrega?.estado === 'ENVIADA' || contexto.curso.activo === false
    || contexto.asignacion.estado !== 'VIGENTE'
    || (contexto.asignacion.fecha_limite != null && new Date(contexto.asignacion.fecha_limite).getTime() < Date.now());
  const agregar = (...codigos: string[]) => codigos.forEach((codigo) => permisos.add(codigo));
  if (p.ver_bc) agregar(Permisos.BASE_CONOCIMIENTO_VER, Permisos.HECHOS_VER, Permisos.VARIABLES_VER, Permisos.REGLAS_VER);
  const editar = p.editar_bc && !cerrada && contexto.puede_editar !== false;
  if (editar) agregar(
    Permisos.HECHOS_CREAR, Permisos.HECHOS_EDITAR, Permisos.HECHOS_ELIMINAR,
    Permisos.VARIABLES_CREAR, Permisos.VARIABLES_EDITAR, Permisos.VARIABLES_ELIMINAR,
    Permisos.REGLAS_CREAR, Permisos.REGLAS_EDITAR, Permisos.REGLAS_ELIMINAR,
  );
  if (p.editor_visual && p.ver_bc) {
    agregar(Permisos.EDITOR_VER);
    if (editar) agregar(Permisos.EDITOR_NODOS_CREAR, Permisos.EDITOR_NODOS_EDITAR, Permisos.EDITOR_NODOS_ELIMINAR,
      Permisos.EDITOR_CONEXIONES_CREAR, Permisos.EDITOR_CONEXIONES_EDITAR, Permisos.EDITOR_CONEXIONES_ELIMINAR);
  }
  if (!cerrada && p.inferencia_directa) agregar(Permisos.INFERENCIA_EJECUTAR);
  if (!cerrada && p.simulacion) agregar(Permisos.SIMULACION_INICIAR, Permisos.SIMULACION_CONTROLAR);
  if (p.validacion) {
    agregar(Permisos.VALIDACION_VER);
    if (!cerrada) agregar(Permisos.VALIDACION_EJECUTAR);
  }
  if (p.trazabilidad) agregar(Permisos.INFERENCIA_HISTORIAL_VER, Permisos.INFERENCIA_TRAZABILIDAD_VER, Permisos.INFERENCIA_EXPLICACION_VER);
  return permisos;
}

function HerramientaTrabajo({ contexto, idAsignacion }: { contexto: ContextoActividad; idAsignacion: string }) {
  const { herramienta } = useParams();
  const permisos = permisosDelTrabajo(contexto);
  const inferencia = herramienta === 'inferencia';
  const entradas = useQuery({
    queryKey: ['entradas-trabajo', idAsignacion],
    queryFn: async () => {
      const response = await httpClient.get<EntradaTrabajo[]>(`/asignaciones/${idAsignacion}/trabajo/entradas/`);
      return response.data;
    },
    enabled: inferencia && !contexto.permisos.ver_bc,
  });
  const permitida = herramienta === 'base-conocimiento' ? permisos.has(Permisos.BASE_CONOCIMIENTO_VER)
    : herramienta === 'editor' ? permisos.has(Permisos.EDITOR_VER)
    : herramienta === 'inferencia' ? permisos.has(Permisos.INFERENCIA_EJECUTAR) || permisos.has(Permisos.SIMULACION_INICIAR)
    : herramienta === 'validacion' ? permisos.has(Permisos.VALIDACION_VER)
    : herramienta === 'historial' && permisos.has(Permisos.INFERENCIA_HISTORIAL_VER);
  if (!permitida) return <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Esta herramienta no está habilitada para tu actividad.</p>;
  if (inferencia && !contexto.permisos.ver_bc && entradas.isPending) return <Spinner />;
  if (entradas.isError) return <ErrorMessage message="No se pudieron cargar los datos iniciales de la actividad." onRetry={() => entradas.refetch()} />;
  return <PermisosTrabajoContext.Provider value={permisos}>
    {herramienta === 'base-conocimiento' && <BaseConocimientoPage />}
    {herramienta === 'editor' && <EditorVisualPage />}
    {herramienta === 'inferencia' && <InferenciaPage entradasActividad={contexto.permisos.ver_bc ? undefined : entradas.data ?? []} />}
    {herramienta === 'validacion' && <ValidacionPage />}
    {herramienta === 'historial' && <HistorialInferenciaPage />}
  </PermisosTrabajoContext.Provider>;
}

export default function TrabajoActividadPage() {
  const { idAsignacion, id } = useParams();
  const contexto = useContextoActividad(idAsignacion);
  const version = contexto.data ? JSON.stringify([contexto.data.permisos, contexto.data.puede_editar, contexto.data.entrega?.estado]) : '';
  const client = useMemo(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } } }), [idAsignacion, version]);
  if (contexto.isPending) return <Spinner />;
  if (contexto.isError || !contexto.data) return <ErrorMessage message="No se pudo abrir el espacio de trabajo. Comprueba que sigues inscrito en el curso." onRetry={() => contexto.refetch()} />;
  if (!idAsignacion || !id || contexto.data.trabajo_sistema_id !== id) return <p role="alert">El sistema solicitado no corresponde a esta actividad.</p>;
  return <div className="space-y-5">
    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
      <Link className="font-semibold underline underline-offset-2" to={`/actividades/resolver/${idAsignacion}`}>Volver a la actividad</Link>
      <span className="ml-3">{contexto.data.actividad.titulo} · {contexto.data.curso.nombre}</span>
    </div>
    <QueryClientProvider client={client}>
      <HerramientaTrabajo contexto={contexto.data} idAsignacion={idAsignacion} />
    </QueryClientProvider>
  </div>;
}
