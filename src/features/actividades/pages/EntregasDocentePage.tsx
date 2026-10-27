import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import { useContextoActividad, useDetalleEntregaDocente, useEntregasDocente } from '../hooks/useActividades';
import actividadesService from '../services/actividadesService';
import SnapshotEntregaPanel from '../components/SnapshotEntregaPanel';

export default function EntregasDocentePage() {
  const { idAsignacion } = useParams<{ idAsignacion: string }>();
  const { data: contexto } = useContextoActividad(idAsignacion);
  const { data: filas = [], isLoading, isError, refetch } = useEntregasDocente(idAsignacion);
  const [seleccionada, setSeleccionada] = useState<string>();
  const { data: entrega, isLoading: cargandoDetalle, isError: errorDetalle } = useDetalleEntregaDocente(seleccionada);
  const [revisionId, setRevisionId] = useState('');
  const [comentario, setComentario] = useState('');
  const [reabrir, setReabrir] = useState(false);
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const client = useQueryClient();
  const revisiones = entrega?.revisiones ?? [];
  const revision = revisiones.find((r) => r.id === revisionId) ?? revisiones[revisiones.length - 1];
  const guardar = async (accion: () => Promise<unknown>) => {
    setError(''); setOcupado(true);
    try { await accion(); await client.invalidateQueries({ queryKey: ['entrega-docente', seleccionada] }); await refetch(); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : 'No se pudo guardar el cambio.'); }
    finally { setOcupado(false); }
  };
  return <div className="space-y-6">
    <Link to={contexto ? `/cursos/${contexto.curso.id}` : '/cursos'} className="text-sm text-teal-700">← Volver al curso</Link>
    <header><p className="text-xs uppercase tracking-wider text-teal-700">{contexto?.curso.nombre}</p><h1 className="font-serif text-3xl font-bold mt-1">Entregas de estudiantes</h1><p className="text-sm text-stone-500 mt-2">{contexto?.actividad.titulo} · El contenido de los borradores es privado.</p></header>
    {isLoading ? <Spinner /> : isError ? <ErrorMessage message="No se pudieron consultar las entregas de esta actividad." onRetry={() => refetch()} />
      : <div className="border border-stone-200 rounded-2xl bg-white overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="p-4">Estudiante</th><th className="p-4">Estado</th><th className="p-4">Último envío</th><th className="p-4">Respuesta</th></tr></thead>
        <tbody className="divide-y divide-stone-100">{filas.map((fila) => <tr key={fila.estudiante_id}><td className="p-4 font-semibold">{fila.estudiante_nombre || fila.nombre || fila.estudiante_username}</td><td className="p-4">{fila.estado === 'ENVIADA' ? 'Enviada' : fila.estado === 'BORRADOR' ? 'Trabajando' : 'Pendiente'}</td><td className="p-4 text-stone-500">{fila.fecha_envio ? new Date(fila.fecha_envio).toLocaleString() : '—'}</td><td className="p-4">
          {fila.entrega_id && (fila.estado === 'ENVIADA' || (fila.numero_revision ?? 0) > 0) ? <Button variant="outline" size="sm" onClick={() => { setSeleccionada(fila.entrega_id!); setRevisionId(''); setComentario(''); setError(''); }}>Revisar entrega</Button> : <span className="text-xs text-stone-400">Aún no enviada</span>}
        </td></tr>)}</tbody></table>{!filas.length && <p className="p-6 text-sm text-stone-500">No hay estudiantes inscritos en el curso.</p>}</div>}
    <Modal isOpen={Boolean(seleccionada)} onClose={() => setSeleccionada(undefined)} title={`Entrega de ${entrega?.estudiante_username ?? 'estudiante'}`} size="xl">
      {cargandoDetalle ? <Spinner /> : errorDetalle ? <p role="alert" className="text-sm text-rose-700">No se pudo cargar esta entrega.</p> : entrega && <div className="space-y-5">
        <div className="flex flex-wrap gap-3 justify-between"><label className="text-sm font-semibold">Versión enviada<select className="block mt-1 rounded-lg border border-stone-300 p-2 bg-white text-sm" value={revision?.id ?? ''} onChange={(e) => setRevisionId(e.target.value)}>{revisiones.map((r) => <option key={r.id} value={r.id}>Envío {r.numero} · {new Date(r.creada_en ?? r.fecha_envio ?? '').toLocaleString()}</option>)}</select></label>
          {entrega.estado === 'ENVIADA' && <Button variant="outline" onClick={() => { setFecha(''); setReabrir(true); }}>Reabrir entrega</Button>}</div>
        {revision ? <SnapshotEntregaPanel snapshot={revision.snapshot ?? { solucion_texto: revision.solucion_texto, bc: revision.bc_snapshot, ejecuciones: revision.ejecuciones_snapshot }} /> : <p className="text-sm text-stone-500">Esta entrega antigua no tiene una copia de la BC. Respuesta: {entrega.solucion_texto || 'Sin texto.'}</p>}
        <section className="border-t border-stone-200 pt-4"><h3 className="text-sm font-bold">Retroalimentación</h3><ul className="space-y-3 mt-3">{(revision?.comentarios ?? entrega.comentarios ?? []).map((c) => <li key={c.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3"><p className="text-xs font-semibold text-stone-500">{c.autor_nombre ?? c.autor_username ?? 'Docente'}</p><p className="text-sm whitespace-pre-wrap mt-1">{c.texto}</p></li>)}</ul>
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (seleccionada && comentario.trim()) void guardar(async () => { await actividadesService.comentarEntrega(seleccionada, { texto: comentario.trim(), revision_id: revision?.id }); setComentario(''); }); }}>
            <label htmlFor="comentario-entrega" className="text-sm font-semibold">Comentario para el estudiante</label><textarea id="comentario-entrega" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} required className="w-full border border-stone-300 rounded-xl p-3 text-sm" /><Button type="submit" loading={ocupado}>Publicar comentario</Button>
          </form></section>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </div>}
    </Modal>
    <Modal isOpen={reabrir} onClose={() => setReabrir(false)} title="Reabrir entrega"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (seleccionada) void guardar(async () => { await actividadesService.reabrirEntrega(seleccionada, fecha ? new Date(fecha).toISOString() : null); setReabrir(false); }); }}>
      <p className="text-sm text-stone-600">El estudiante podrá volver a trabajar y enviar otra versión. Los envíos anteriores y sus comentarios se conservarán.</p><Input label="Nuevo plazo para la actividad" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} helperText="Vacío elimina el plazo; se aplica a la actividad de este curso." />
      <Button type="submit" loading={ocupado}>Reabrir y guardar plazo</Button></form></Modal>
  </div>;
}
