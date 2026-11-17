import React, { useState, useEffect } from 'react';
import { Save, Copy, X } from 'lucide-react';
import type { ProgramaAlgoritmo } from '../types/contracts';

interface ModalGuardarAlgoritmoProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: { titulo: string; descripcion: string; comoNuevo?: boolean }) => Promise<void>;
  programaActual?: ProgramaAlgoritmo | null;
  guardando?: boolean;
}

export const ModalGuardarAlgoritmo: React.FC<ModalGuardarAlgoritmoProps> = ({
  abierto,
  onCerrar,
  onGuardar,
  programaActual,
  guardando = false,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [comoNuevo, setComoNuevo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicionExistente = Boolean(programaActual?.id && programaActual.es_propio !== false);

  useEffect(() => {
    if (abierto) {
      if (programaActual) {
        setTitulo(programaActual.titulo || '');
        setDescripcion(programaActual.descripcion || '');
        setComoNuevo(false);
      } else {
        setTitulo('Mi Algoritmo de Inferencia');
        setDescripcion('');
        setComoNuevo(true);
      }
      setError(null);
    }
  }, [abierto, programaActual]);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('El título del algoritmo es obligatorio.');
      return;
    }
    try {
      setError(null);
      await onGuardar({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        comoNuevo: esEdicionExistente ? comoNuevo : true,
      });
      onCerrar();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al guardar el algoritmo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Save className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {esEdicionExistente && !comoNuevo ? 'Guardar Cambios de Versión' : 'Guardar Algoritmo en BD'}
              </h3>
              <p className="text-xs text-slate-400">
                Guarda tu código fuente en PostgreSQL con historial inmutable de revisiones.
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título del Algoritmo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Variante FWC con Prioridades"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción / Notas (Opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas sobre el orden de evaluación o hipótesis del algoritmo..."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {esEdicionExistente && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={comoNuevo}
                  onChange={(e) => setComoNuevo(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Copy className="h-3.5 w-3.5 text-indigo-400" />
                  Guardar como una nueva copia independiente
                </span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                {comoNuevo
                  ? 'Se creará un nuevo registro en tu lista sin sobreescribir este algoritmo.'
                  : `Se incrementará la versión a v${(programaActual?.version_entero || 1) + 1} guardando una revisión inmutable.`}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {guardando ? 'Guardando...' : esEdicionExistente && !comoNuevo ? 'Guardar Versión' : 'Guardar en BD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

