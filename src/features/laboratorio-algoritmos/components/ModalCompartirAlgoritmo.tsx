import React, { useState, useEffect } from 'react';
import { Share2, Users, Eye, Edit3, X, Check } from 'lucide-react';
import type { CursoItem, ProgramaAlgoritmo } from '../types/contracts';
import { laboratorioService } from '../services/laboratorioService';

interface ModalCompartirAlgoritmoProps {
  abierto: boolean;
  onCerrar: () => void;
  programa: ProgramaAlgoritmo | null;
  onCompartidoExitoso?: () => void;
}

export const ModalCompartirAlgoritmo: React.FC<ModalCompartirAlgoritmoProps> = ({
  abierto,
  onCerrar,
  programa,
  onCompartidoExitoso,
}) => {
  const [cursos, setCursos] = useState<CursoItem[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [modoAcceso, setModoAcceso] = useState<'LECTURA' | 'COPIA_EDICION'>('LECTURA');
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (abierto) {
      setError(null);
      setExito(false);
      setCargando(true);
      laboratorioService
        .listarCursosDocente()
        .then((data) => {
          setCursos(data);
          if (data.length > 0) {
            setCursoSeleccionado(data[0].id);
          }
        })
        .catch((err) => {
          setError('No se pudieron cargar los cursos del docente: ' + (err.message || ''));
        })
        .finally(() => setCargando(false));
    }
  }, [abierto]);

  if (!abierto || !programa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoSeleccionado) {
      setError('Debes seleccionar un curso de destino.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await laboratorioService.compartirPrograma(programa.id, {
        curso_id: cursoSeleccionado,
        modo_acceso: modoAcceso,
      });
      setExito(true);
      if (onCompartidoExitoso) onCompartidoExitoso();
      setTimeout(() => {
        onCerrar();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al compartir el algoritmo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Compartir Algoritmo a Estudiantes
              </h3>
              <p className="text-xs text-slate-400">
                Comparte '{programa.titulo}' a todos los alumnos matriculados en tu curso.
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {exito && (
          <div className="mt-4 rounded-lg bg-emerald-950/60 border border-emerald-800/80 p-3 text-xs text-emerald-200 flex items-center gap-2">
            <Check className="h-4 w-4" />
            ¡Algoritmo compartido exitosamente a los alumnos del curso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              Selecciona el Curso Académico
            </label>
            {cargando ? (
              <div className="py-2 text-xs text-slate-400">Cargando tus cursos...</div>
            ) : cursos.length === 0 ? (
              <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-300">
                No tienes cursos activos registrados. Crea o activa un curso antes de compartir.
              </div>
            ) : (
              <select
                value={cursoSeleccionado}
                onChange={(e) => setCursoSeleccionado(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} - {c.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Modo de Acceso y Permisos para los Estudiantes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  modoAcceso === 'LECTURA'
                    ? 'border-emerald-500 bg-emerald-950/20 text-slate-100'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs text-slate-200 mb-1">
                  <input
                    type="radio"
                    name="modoAcceso"
                    value="LECTURA"
                    checked={modoAcceso === 'LECTURA'}
                    onChange={() => setModoAcceso('LECTURA')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  Solo Lectura
                </div>
                <p className="text-[11px] text-slate-400 pl-5">
                  El alumno puede cargar y simular el código, pero no puede editarlo ni modificarlo.
                </p>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  modoAcceso === 'COPIA_EDICION'
                    ? 'border-emerald-500 bg-emerald-950/20 text-slate-100'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-xs text-slate-200 mb-1">
                  <input
                    type="radio"
                    name="modoAcceso"
                    value="COPIA_EDICION"
                    checked={modoAcceso === 'COPIA_EDICION'}
                    onChange={() => setModoAcceso('COPIA_EDICION')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <Edit3 className="h-3.5 w-3.5 text-cyan-400" />
                  Permitir Edición (Copia)
                </div>
                <p className="text-[11px] text-slate-400 pl-5">
                  Al editar, se genera una copia privada para el alumno. Tu código docente original nunca se modifica.
                </p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || cursos.length === 0}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              {enviando ? 'Compartiendo...' : 'Compartir con el Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

