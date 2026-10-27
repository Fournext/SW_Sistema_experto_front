import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ArrowRight, Users } from 'lucide-react';
import { Permisos, usePuede } from '@/config/permisos';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import { useCrearCurso, useCursos } from '../hooks/useActividades';

export default function CursosPage() {
  const navigate = useNavigate();
  const docente = usePuede(Permisos.CURSOS_CREAR);
  const { data: cursos = [], isLoading, isError, refetch } = useCursos();
  const crear = useCrearCurso();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { const curso = await crear.mutateAsync({ nombre: nombre.trim(), codigo: codigo.trim(), descripcion }); navigate(`/cursos/${curso.id}`); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : 'No se pudo crear el curso.'); }
  };
  return <div className="space-y-7">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><p className="text-xs font-semibold tracking-widest uppercase text-teal-700">Aula de sistemas expertos</p>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">Mis cursos</h1>
        <p className="text-sm text-stone-500 mt-2">{docente ? 'Organiza tus actividades y acompaña el trabajo de cada estudiante.' : 'Tus actividades y respuestas, organizadas por curso.'}</p></div>
      {docente ? <Button onClick={() => setAbierto(true)} icon={<Plus className="w-4 h-4" />}>Crear curso</Button>
        : <Button onClick={() => navigate('/cursos/unirse')}>Unirse a un curso</Button>}
    </div>
    {isLoading ? <Spinner /> : isError ? <ErrorMessage message="No se pudieron cargar tus cursos." onRetry={() => refetch()} />
      : cursos.length === 0 ? <div className="border border-dashed border-stone-300 rounded-2xl p-12 text-center bg-white">
        <BookOpen className="w-10 h-10 mx-auto text-teal-700 mb-3" /><h2 className="font-serif text-xl font-semibold">Todavía no hay cursos</h2>
        <p className="text-sm text-stone-500 mt-2">{docente ? 'Crea tu primer curso para comenzar a preparar actividades.' : 'Pide el enlace o código de ingreso a tu docente.'}</p></div>
        : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{cursos.map((curso) => <Link to={`/cursos/${curso.id}`} key={curso.id}
          className="group block bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:border-teal-400 transition-colors">
          <div className={`h-2 ${curso.activo ? 'bg-teal-700' : 'bg-stone-300'}`} />
          <div className="p-5"><div className="flex justify-between gap-3 text-xs text-stone-500"><span className="font-mono">{curso.codigo}</span><span>{curso.activo ? 'En curso' : 'Archivado'}</span></div>
            <h2 className="font-serif text-xl font-bold mt-4 text-stone-900 group-hover:text-teal-800">{curso.nombre}</h2>
            <p className="text-sm text-stone-500 mt-2 line-clamp-2 min-h-10">{curso.descripcion || curso.docente_nombre || 'Actividades de aprendizaje con bases de conocimiento.'}</p>
            <div className="border-t border-stone-100 mt-5 pt-3 flex items-center justify-between text-xs text-stone-500">
              <span className="flex gap-1.5 items-center"><Users className="w-3.5 h-3.5" />{curso.total_miembros ?? curso.total_estudiantes ?? '—'} estudiantes</span><ArrowRight className="w-4 h-4 text-teal-700" /></div>
          </div></Link>)}</div>}
    <Modal isOpen={abierto} onClose={() => setAbierto(false)} title="Crear curso">
      <form onSubmit={guardar} className="space-y-4">
        <Input label="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Input label="Código académico" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej.: SIS-401" helperText="La invitación para estudiantes se genera por separado." required />
        <Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button><Button type="submit" loading={crear.isPending}>Crear curso</Button></div>
      </form>
    </Modal>
  </div>;
}
