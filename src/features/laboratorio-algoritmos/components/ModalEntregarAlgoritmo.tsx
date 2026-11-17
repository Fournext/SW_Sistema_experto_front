import React, { useState, useEffect } from 'react';
import { Send, FileCheck, BookOpen, X, Check } from 'lucide-react';
import type { ActividadAsignadaItem, ProgramaAlgoritmo } from '../types/contracts';
import { laboratorioService } from '../services/laboratorioService';

interface ModalEntregarAlgoritmoProps {
  abierto: boolean;
  onCerrar: () => void;
  programa: ProgramaAlgoritmo | null;
  onEntregadoExitoso?: () => void;
}

export const ModalEntregarAlgoritmo: React.FC<ModalEntregarAlgoritmoProps> = ({
  abierto,
  onCerrar,
  programa,
  onEntregadoExitoso,
}) => {
  const [actividades, setActividades] = useState<ActividadAsignadaItem[]>([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<string>('');
  const [solucionTexto, setSolucionTexto] = useState('');
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
        .listarActividadesEstudiante()
        .then((data: any[]) => {
          // Normalizar items según la estructura de la API de estudiante/actividades
          const items: ActividadAsignadaItem[] = data.map((a: any) => ({
            id: a.id || a.actividad_id,
            titulo: a.titulo || a.actividad_titulo || 'Actividad Sin Título',
            descripcion: a.descripcion || '',
            curso_nombre: a.curso_nombre || a.curso_codigo || '',
            asignacion_id: a.asignacion_id || a.id_asignacion || a.id,
            estado_entrega: a.estado_entrega || a.entrega?.estado || 'PENDIENTE',
          }));
          setActividades(items);
          if (items.length > 0) {
            setAsignacionSeleccionada(items[0].asignacion_id);
          }
        })
        .catch((err) => {
          setError('No se pudieron cargar tus tareas asignadas: ' + (err.message || ''));
        })
        .finally(() => setCargando(false));
    }
  }, [abierto]);

  if (!abierto || !programa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asignacionSeleccionada) {
      setError('Debes seleccionar la tarea o actividad asignada.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await laboratorioService.entregarAlgoritmoEnActividad(asignacionSeleccionada, {
        programa_algoritmo_id: programa.id,
        solucion_texto: solucionTexto.trim() || undefined,
      });
      setExito(true);
      if (onEntregadoExitoso) onEntregadoExitoso();
      setTimeout(() => {
        onCerrar();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al enviar la entrega de la tarea.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Presentar Algoritmo en Tarea / Actividad
              </h3>
              <p className="text-xs text-slate-400">
                Adjunta tu algoritmo guardado '{programa.titulo}' para calificación docente.
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
            ¡Tu algoritmo ha sido entregado exitosamente al docente!
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              Selecciona la Actividad o Tarea Asignada
            </label>
            {cargando ? (
              <div className="py-2 text-xs text-slate-400">Cargando tus actividades...</div>
            ) : actividades.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
                No tienes actividades asignadas pendientes de entrega en este momento.
              </div>
            ) : (
              <select
                value={asignacionSeleccionada}
                onChange={(e) => setAsignacionSeleccionada(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {actividades.map((a) => (
                  <option key={a.asignacion_id} value={a.asignacion_id}>
                    {a.titulo} {a.curso_nombre ? `(${a.curso_nombre})` : ''} - [{a.estado_entrega}]
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Justificación / Comentario al Docente (Opcional)
            </label>
            <textarea
              value={solucionTexto}
              onChange={(e) => setSolucionTexto(e.target.value)}
              placeholder="Explica tu enfoque o resultados del algoritmo para el docente..."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
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
              disabled={enviando || actividades.length === 0}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {enviando ? 'Enviando...' : 'Enviar Entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

