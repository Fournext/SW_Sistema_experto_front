import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUnirseCurso } from '../hooks/useActividades';

export default function UnirseCursoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const unirse = useUnirseCurso();
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { const curso = await unirse.mutateAsync(token ? { token } : { codigo: codigo.trim() }); navigate(`/cursos/${curso.id}`, { replace: true }); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : 'No se pudo ingresar al curso. Verifica la invitación con tu docente.'); }
  };
  return <div className="max-w-lg mx-auto pt-8"><Link to="/cursos" className="text-sm text-teal-700">← Mis cursos</Link>
    <div className="bg-white border border-stone-200 rounded-2xl p-7 mt-5 shadow-sm">
      <KeyRound className="w-9 h-9 text-teal-700" /><h1 className="font-serif text-2xl font-bold mt-4">Unirse a un curso</h1>
      <p className="text-sm text-stone-500 mt-2">{token ? 'Recibiste una invitación. Confirma tu inscripción para ver las actividades del curso.' : 'Ingresa el código de invitación que compartió tu docente.'}</p>
      <form onSubmit={enviar} className="mt-6 space-y-4">
        {!token && <Input label="Código de ingreso" value={codigo} onChange={(e) => setCodigo(e.target.value)} required autoComplete="off" />}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <Button type="submit" loading={unirse.isPending} className="w-full">Confirmar inscripción</Button>
      </form>
    </div></div>;
}
