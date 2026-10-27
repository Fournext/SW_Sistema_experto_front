import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useCursos, useCrearCurso } from '../hooks/useActividades';
import type { ActividadEducativa } from '../types/types';

interface AsignarActividadModalProps {
  isOpen: boolean;
  onClose: () => void;
  actividad: ActividadEducativa | null;
  onSubmit: (datos: {
    actividad_id: string;
    curso_id: string;
    fecha_limite?: string | null;
  }) => Promise<void>;
  isLoading: boolean;
  cursoInicialId?: string;
}

export const AsignarActividadModal: React.FC<AsignarActividadModalProps> = ({
  isOpen,
  onClose,
  actividad,
  onSubmit,
  isLoading,
  cursoInicialId,
}) => {
  const { data: cursos = [] } = useCursos();
  const crearCurso = useCrearCurso();

  const [cursoId, setCursoId] = useState<string>('');
  const [fechaLimite, setFechaLimite] = useState<string>('');
  const [mostrarCrearCurso, setMostrarCrearCurso] = useState<boolean>(false);
  const [nuevoCodigo, setNuevoCodigo] = useState<string>('');
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [error, setError] = useState('');
  useEffect(() => { if (isOpen) { setCursoId(cursoInicialId ?? ''); setFechaLimite(''); setError(''); } }, [isOpen, cursoInicialId]);

  const handleCrearCursoRapido = async () => {
    if (!nuevoCodigo || !nuevoNombre) return;
    try {
      setError('');
      const nuevo = await crearCurso.mutateAsync({ codigo: nuevoCodigo, nombre: nuevoNombre });
      setCursoId(nuevo.id); setMostrarCrearCurso(false);
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : 'No se pudo crear el curso.'); }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividad || !cursoId) return;

    try {
      setError('');
      await onSubmit({ actividad_id: actividad.id, curso_id: cursoId, fecha_limite: fechaLimite ? new Date(fechaLimite).toISOString() : null });
      onClose();
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : 'No se pudo asignar la actividad.'); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Actividad a un Curso"
      size="md"
    >
      <form onSubmit={handleAsignar} className="space-y-4 text-xs">
        <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl">
          <span className="text-[11px] text-stone-500 block uppercase font-bold tracking-wider">
            Actividad Seleccionada
          </span>
          <strong className="text-stone-900 text-sm">{actividad?.titulo}</strong>
        </div>

        {/* Selector de Curso */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-stone-700 font-semibold">Curso Académico *</label>
            <button
              type="button"
              onClick={() => setMostrarCrearCurso(!mostrarCrearCurso)}
              className="text-teal-700 hover:text-teal-900 font-medium text-[11px]"
            >
              {mostrarCrearCurso ? 'Cancelar nuevo curso' : '+ Crear nuevo curso'}
            </button>
          </div>

          {mostrarCrearCurso ? (
            <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2 mb-2">
              <input
                type="text"
                placeholder="Código (Ej: SIS-401)"
                value={nuevoCodigo}
                onChange={(e) => setNuevoCodigo(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800"
              />
              <input
                type="text"
                placeholder="Nombre de la Asignatura"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800"
              />
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleCrearCursoRapido}
                loading={crearCurso.isPending}
                className="bg-teal-700 text-white w-full"
              >
                Guardar y Seleccionar Curso
              </Button>
            </div>
          ) : (
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              required
              aria-label="Seleccionar curso académico"
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
            >
              <option value="">Seleccione el curso de destino...</option>
              {cursos.filter((c) => c.activo !== false).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Fecha Límite Opcional */}
        <div>
          <label className="block text-stone-700 font-semibold mb-1">
            Fecha Límite de Entrega (Opcional)
          </label>
          <input
            type="datetime-local"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!cursoId}
            loading={isLoading}
            className="bg-teal-700 hover:bg-teal-800 text-white"
          >
            Confirmar Asignación
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AsignarActividadModal;
