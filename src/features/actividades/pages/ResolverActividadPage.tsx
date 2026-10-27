import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Network, Play, Save, Send, ShieldCheck } from 'lucide-react';
import { Permisos, usePuede } from '@/config/permisos';
import { useContextoActividad, useEntregaEstudiante, useGuardarBorrador, useEnviarEntrega } from '../hooks/useActividades';
import type { RevisionEntrega } from '../types/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SnapshotEntregaPanel from '../components/SnapshotEntregaPanel';
import inferenciaService from '@/features/inferencia/services/inferenciaService';

function RevisionEnviada({ revision }: { revision: RevisionEntrega }) {
  return <details className="rounded-xl border border-stone-200 bg-white p-4">
    <summary className="cursor-pointer text-sm font-semibold text-stone-800">Entrega {revision.numero}{revision.fecha_envio ? ` · ${new Date(revision.fecha_envio).toLocaleString()}` : ''}</summary>
    <div className="mt-4"><SnapshotEntregaPanel snapshot={revision.snapshot ?? { solucion_texto: revision.solucion_texto, bc: revision.bc_snapshot, ejecuciones: revision.ejecuciones_snapshot }} /></div>
    {(revision.comentarios ?? []).map((comentario) => <div key={comentario.id} className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950">
      <p className="font-semibold">{comentario.autor_username || 'Docente'}</p><p className="whitespace-pre-wrap">{comentario.texto}</p>
    </div>)}
  </details>;
}

export default function ResolverActividadPage() {
  const { idAsignacion } = useParams();
  const navigate = useNavigate();
  const puedeResolver = usePuede(Permisos.ACTIVIDADES_RESOLVER);
  const puedeEnviar = usePuede(Permisos.ENTREGAS_ENVIAR);
  const contexto = useContextoActividad(idAsignacion);
  const entregaQuery = useEntregaEstudiante(idAsignacion);
  const guardar = useGuardarBorrador();
  const enviar = useEnviarEntrega();
  const [texto, setTexto] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [ejecucionesIds, setEjecucionesIds] = useState<string[]>([]);
  const textoModificado = useRef(false);
  const ctx = contexto.data;
  const entrega = entregaQuery.data ?? ctx?.entrega;
  const ejecuciones = useQuery({
    queryKey: ['ejecuciones-entrega', idAsignacion, ctx?.trabajo_sistema_id],
    queryFn: () => inferenciaService.listarHistorial({ sistema_experto_id: ctx?.trabajo_sistema_id ?? undefined }),
    enabled: Boolean(ctx?.trabajo_sistema_id && (ctx.permisos.inferencia_directa || ctx.permisos.simulacion)),
    retry: false,
  });

  useEffect(() => {
    textoModificado.current = false;
    setTexto(''); setMensaje(null); setError(null); setEjecucionesIds([]);
  }, [idAsignacion]);
  useEffect(() => {
    if (!textoModificado.current) {
      setTexto(entrega?.solucion_texto ?? '');
      setEjecucionesIds(entrega?.ejecuciones_ids ?? []);
    }
  }, [entrega?.id, entrega?.solucion_texto, entrega?.ejecuciones_ids]);

  const enviada = entrega?.estado === 'ENVIADA';
  const vencida = Boolean(ctx?.asignacion.fecha_limite && new Date(ctx.asignacion.fecha_limite).getTime() < Date.now());
  const cerrada = enviada || vencida || ctx?.curso.activo === false || ctx?.asignacion.estado !== 'VIGENTE' || ctx?.puede_trabajar === false;
  const ocupada = guardar.isPending || enviar.isPending;
  const guardarRespuesta = async (): Promise<boolean> => {
    if (!idAsignacion || !puedeResolver || cerrada) return false;
    setError(null);
    try {
      await guardar.mutateAsync({ asignacionId: idAsignacion, datos: { solucion_texto: texto, ejecuciones_ids: ejecucionesIds } });
      textoModificado.current = false;
      setMensaje('Borrador guardado.');
      await contexto.refetch();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la respuesta.');
      return false;
    }
  };
  const abrirHerramienta = async (herramienta: string) => {
    if (!ctx?.trabajo_sistema_id || !idAsignacion) return;
    if (textoModificado.current && !await guardarRespuesta()) return;
    navigate(`/actividades/resolver/${idAsignacion}/sistemas/${ctx.trabajo_sistema_id}/${herramienta}`);
  };
  const enviarRespuesta = async () => {
    if (!idAsignacion || !puedeEnviar || cerrada) return;
    setError(null);
    try {
      await enviar.mutateAsync({ asignacionId: idAsignacion, datos: { solucion_texto: texto, ejecuciones_ids: ejecucionesIds } });
      textoModificado.current = false;
      setConfirmando(false);
      setMensaje('Entrega enviada. El docente ya puede revisar tu respuesta.');
      await Promise.all([contexto.refetch(), entregaQuery.refetch()]);
    } catch (e) {
      setConfirmando(false);
      setError(e instanceof Error ? e.message : 'No se pudo enviar la entrega.');
    }
  };

  if (contexto.isPending || entregaQuery.isLoading) return <div className="py-16 text-center"><Spinner /><p className="mt-3 text-sm">Cargando actividad…</p></div>;
  if (contexto.isError || entregaQuery.isError || !ctx) return <ErrorMessage title="No se pudo abrir la actividad" message="Comprueba tu inscripción en el curso y que la actividad esté disponible." onRetry={() => { contexto.refetch(); entregaQuery.refetch(); }} />;
  const p = ctx.permisos;
  const herramientas = [
    { clave: 'base-conocimiento', titulo: ctx.actividad.tipo === 'CREACION_BC' ? 'Construir mi BC' : 'Analizar la BC', visible: p.ver_bc, icono: BookOpen },
    { clave: 'editor', titulo: 'Editor visual', visible: p.editor_visual && p.ver_bc, icono: Network },
    { clave: 'inferencia', titulo: 'Realizar inferencia', visible: (p.inferencia_directa || p.simulacion) && !cerrada, icono: Play },
    { clave: 'validacion', titulo: 'Validar BC', visible: p.validacion, icono: ShieldCheck },
    { clave: 'historial', titulo: 'Mis ejecuciones', visible: p.trazabilidad, icono: BookOpen },
  ];
  return <div className="mx-auto max-w-5xl space-y-6">
    <Link to={`/cursos/${ctx.curso.id}`} className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-teal-800"><ArrowLeft className="h-4 w-4" />Volver a {ctx.curso.nombre}</Link>
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs uppercase tracking-wide text-teal-700">{ctx.actividad.tipo === 'CREACION_BC' ? 'Creación de una base de conocimiento' : 'Análisis de una base de conocimiento'}</p><h1 className="mt-1 font-serif text-2xl font-bold text-stone-950">{ctx.actividad.titulo}</h1>
        <p className="mt-2 text-xs text-stone-500">{ctx.asignacion.fecha_limite ? `Entrega hasta ${new Date(ctx.asignacion.fecha_limite).toLocaleString()}` : 'Sin fecha límite'}</p></div>
      <Badge variant={enviada ? 'success' : 'neutral'}>{enviada ? 'Enviada' : entrega ? 'Borrador' : 'Pendiente'}</Badge>
    </header>
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-stone-900">Instrucciones</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{ctx.actividad.instrucciones}</p></section>
    {cerrada && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><CheckCircle2 className="h-5 w-5 shrink-0" /><p>{enviada ? 'Tu entrega está cerrada. El docente puede reabrirla si necesitas corregirla.' : vencida ? 'El plazo de entrega terminó. El docente debe ampliar el plazo para continuar.' : 'La actividad o el curso está cerrado. Puedes consultar tu trabajo.'}</p></div>}
    {ctx.trabajo_sistema_id && <section className="flex flex-wrap gap-3">{herramientas.filter((h) => h.visible).map((h) => <Button key={h.clave} variant="outline" onClick={() => abrirHerramienta(h.clave)} disabled={ocupada}><h.icono className="h-4 w-4" />{h.titulo}</Button>)}</section>}
    {mensaje && <p role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{mensaje}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <label htmlFor="respuesta-actividad" className="block font-semibold text-stone-900">Tu respuesta y conclusiones</label>
      <p className="text-xs text-stone-500">Explica tu análisis o las decisiones que tomaste al construir la BC. No es obligatorio ejecutar una inferencia para entregar.</p>
      <textarea id="respuesta-actividad" rows={9} disabled={cerrada || !puedeResolver || ocupada} value={texto} onChange={(e) => { textoModificado.current = true; setTexto(e.target.value); }} className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-stone-50" placeholder="Escribe tu respuesta…" />
      {!!ejecuciones.data?.length && <fieldset className="space-y-2 rounded-xl border border-stone-200 p-4">
        <legend className="px-1 text-sm font-semibold">Ejecuciones para adjuntar (opcional)</legend>
        {ejecuciones.data.map((ejecucion) => {
          const idEjecucion = ejecucion.id ?? ejecucion.ejecucion_id;
          return idEjecucion ? <label key={idEjecucion} className="flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" className="mt-1 accent-teal-700" disabled={cerrada || ocupada} checked={ejecucionesIds.includes(idEjecucion)} onChange={(e) => {
              textoModificado.current = true;
              setEjecucionesIds((actuales) => e.target.checked ? [...actuales, idEjecucion] : actuales.filter((id) => id !== idEjecucion));
            }} />
            <span>{ejecucion.es_simulacion ? 'Paso a paso' : 'Inferencia directa'} · {ejecucion.conclusion_final || 'Sin conclusión'}{ejecucion.fecha_inicio ? ` · ${new Date(ejecucion.fecha_inicio).toLocaleString()}` : ''}</span>
          </label> : null;
        })}
      </fieldset>}
      {ejecuciones.isError && <p role="alert" className="text-sm text-rose-700">No se pudieron cargar tus ejecuciones. Puedes guardar tu respuesta y volver a intentar antes de enviarla.</p>}
      {!cerrada && <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-4">
        {puedeResolver && <Button variant="outline" loading={guardar.isPending} disabled={ocupada} onClick={guardarRespuesta}><Save className="h-4 w-4" />Guardar borrador</Button>}
        {puedeEnviar && <Button loading={enviar.isPending} disabled={ocupada} onClick={() => setConfirmando(true)}><Send className="h-4 w-4" />Enviar entrega</Button>}
      </div>}
    </section>
    {!!entrega?.revisiones?.length && <section className="space-y-3"><h2 className="font-semibold text-stone-900">Entregas y comentarios del docente</h2>{entrega.revisiones.map((revision) => <RevisionEnviada key={revision.id} revision={revision} />)}</section>}
    <ConfirmDialog isOpen={confirmando} onClose={() => setConfirmando(false)} onConfirm={enviarRespuesta} title="Enviar entrega" message="Se conservará tu respuesta, la BC y las ejecuciones realizadas. Solo el docente podrá reabrirla para permitir cambios." confirmText="Enviar entrega" />
  </div>;
}
