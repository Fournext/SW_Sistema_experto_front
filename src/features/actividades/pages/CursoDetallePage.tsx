import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, Copy, RefreshCw } from 'lucide-react';
import { Permisos, usePuede } from '@/config/permisos';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import { useCurso, useMiembrosCurso, CURSOS_KEY, ASIGNACIONES_KEY } from '../hooks/useActividades';
import actividadesService from '../services/actividadesService';
import ActividadesDocentePage from './ActividadesDocentePage';
import type { AsignacionActividad } from '../types/types';

export default function CursoDetallePage() {
  const { idCurso } = useParams<{ idCurso: string }>();
  const docente = usePuede(Permisos.CURSOS_CREAR);
  const { data: curso, isLoading, isError, refetch } = useCurso(idCurso);
  const { data: miembros = [], refetch: recargarMiembros } = useMiembrosCurso(idCurso, docente);
  const client = useQueryClient();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editar, setEditar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [plazo, setPlazo] = useState<AsignacionActividad | null>(null);
  const [fecha, setFecha] = useState('');
  const ejecutar = async (accion: () => Promise<unknown>) => {
    setOcupado(true); setError(''); setMensaje('');
    try { await accion(); await client.invalidateQueries({ queryKey: [CURSOS_KEY] }); await client.invalidateQueries({ queryKey: [ASIGNACIONES_KEY] }); await recargarMiembros(); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : 'No se pudo guardar el cambio.'); }
    finally { setOcupado(false); }
  };
  if (isLoading) return <Spinner />;
  if (isError || !curso) return <ErrorMessage message="No se pudo abrir el curso. Comprueba que sigues inscrito o que eres su docente." onRetry={() => refetch()} />;
  const enlace = `${window.location.origin}/cursos/unirse?token=${encodeURIComponent(curso.token_ingreso ?? curso.token_invitacion ?? '')}`;
  const copiar = async () => {
    try { await navigator.clipboard.writeText(enlace); setMensaje('Enlace copiado.'); }
    catch { setMensaje('Puedes seleccionar y copiar el enlace que aparece abajo.'); }
  };
  return <div className="space-y-6">
    <Link to="/cursos" className="text-sm text-teal-700">← Mis cursos</Link>
    <header className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between gap-4"><div><p className="text-xs font-mono tracking-wider text-teal-700">{curso.codigo} · {curso.activo ? 'EN CURSO' : 'ARCHIVADO'}</p>
        <h1 className="font-serif text-3xl font-bold mt-2 text-stone-900">{curso.nombre}</h1><p className="text-sm text-stone-500 mt-3 whitespace-pre-line">{curso.descripcion}</p></div>
        {docente && <div className="flex items-start gap-2"><Button variant="outline" onClick={() => { setNombre(curso.nombre); setDescripcion(curso.descripcion ?? ''); setEditar(true); }}>Editar curso</Button>
          <Button variant="outline" disabled={ocupado} onClick={() => ejecutar(() => actividadesService.actualizarCurso(curso.id, { activo: !curso.activo }))}>{curso.activo ? 'Archivar' : 'Reactivar'}</Button></div>}
      </div>
      {!curso.activo && <p className="text-sm mt-4 text-amber-800 bg-amber-50 rounded-xl p-3">Curso archivado. Las entregas permanecen disponibles para consulta; no se admiten nuevas inscripciones ni envíos.</p>}
    </header>
    {error && <p role="alert" className="text-sm bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800">{error}</p>}
    {mensaje && <p role="status" className="text-sm text-teal-800">{mensaje}</p>}
    {docente && <section className="grid lg:grid-cols-2 gap-5">
      <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-teal-950">Invitar estudiantes</h2><p className="text-xs text-teal-800 mt-1">Comparte el código o el enlace. La inscripción es inmediata.</p>
        <p className="font-mono text-3xl tracking-widest text-teal-950 mt-5">{curso.codigo_ingreso ?? '—'}</p>
        <input aria-label="Enlace de invitación" value={enlace} readOnly className="w-full text-xs rounded-lg border border-teal-200 bg-white p-2 mt-4" />
        <div className="flex gap-2 mt-3 flex-wrap"><Button variant="outline" size="sm" onClick={copiar} icon={<Copy className="w-3.5 h-3.5" />}>Copiar enlace</Button>
          <Button variant="outline" size="sm" disabled={ocupado || !curso.activo} icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => { if (window.confirm('Los enlaces y códigos anteriores dejarán de funcionar. ¿Regenerar la invitación?')) void ejecutar(() => actividadesService.regenerarInvitacion(curso.id)); }}>Regenerar invitación</Button></div>
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl p-5"><h2 className="flex items-center gap-2 font-semibold"><Users className="w-4 h-4 text-teal-700" />Estudiantes inscritos</h2>
        {miembros.length === 0 ? <p className="text-sm text-stone-500 mt-5">Todavía no se han inscrito estudiantes.</p>
          : <ul className="mt-3 divide-y divide-stone-100 max-h-64 overflow-auto">{miembros.map((m) => <li key={m.estudiante_id} className="py-3 flex justify-between items-center gap-3"><div><p className="text-sm font-semibold">{m.estudiante_nombre || m.nombre || m.estudiante_username}</p><p className="text-xs text-stone-500">{m.activo ? 'Inscripción activa' : 'Retirado'}</p></div>
            <Button variant="outline" size="sm" disabled={ocupado} onClick={() => ejecutar(() => actividadesService.actualizarMiembro(curso.id, m.estudiante_id, !m.activo))}>{m.activo ? 'Retirar' : 'Reincorporar'}</Button></li>)}</ul>}
      </div>
    </section>}
    <section className="bg-white border border-stone-200 rounded-2xl p-5">
      <h2 className="font-serif text-xl font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-teal-700" />{docente ? 'Seguimiento de actividades' : 'Actividades del curso'}</h2>
      {!curso.asignaciones?.length ? <p className="text-sm text-stone-500 mt-4">No hay actividades disponibles en este curso.</p>
        : <ul className="mt-4 divide-y divide-stone-100">{curso.asignaciones.map((a) => <li key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><p className="font-semibold text-sm">{a.actividad_titulo}</p><p className="text-xs text-stone-500 mt-1">{a.fecha_limite ? `Entrega hasta ${new Date(a.fecha_limite).toLocaleString()}` : 'Sin fecha límite'} · {a.estado}</p></div>
          <div className="flex gap-2">{docente ? <><Link className="text-sm text-teal-800 font-semibold border border-teal-200 rounded-lg px-3 py-2" to={`/asignaciones/${a.id}/entregas`}>Ver entregas</Link>
            <Button variant="outline" size="sm" onClick={() => { setPlazo(a); setFecha(a.fecha_limite ? new Date(new Date(a.fecha_limite).getTime() - new Date(a.fecha_limite).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''); }}>Cambiar plazo</Button></>
            : <Link className="text-sm text-teal-800 font-semibold border border-teal-200 rounded-lg px-3 py-2" to={`/actividades/resolver/${a.id}`}>Abrir actividad</Link>}</div>
        </li>)}</ul>}
    </section>
    {docente && <ActividadesDocentePage cursoId={curso.id} cursoArchivado={!curso.activo} />}
    <Modal isOpen={editar} onClose={() => setEditar(false)} title="Editar curso"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void ejecutar(async () => { await actividadesService.actualizarCurso(curso.id, { nombre, descripcion }); setEditar(false); }); }}>
      <Input label="Nombre" value={nombre} required onChange={(e) => setNombre(e.target.value)} /><Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /><Button type="submit" loading={ocupado}>Guardar cambios</Button></form></Modal>
    <Modal isOpen={Boolean(plazo)} onClose={() => setPlazo(null)} title="Fecha de entrega"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (plazo) void ejecutar(async () => { await actividadesService.actualizarAsignacion(plazo.id, { fecha_limite: fecha ? new Date(fecha).toISOString() : null }); setPlazo(null); }); }}>
      <Input label="Fecha límite" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} helperText="Deja el campo vacío para no fijar un límite." /><Button type="submit" loading={ocupado}>Guardar plazo</Button></form></Modal>
  </div>;
}
