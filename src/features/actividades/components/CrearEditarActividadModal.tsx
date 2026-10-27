import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useSistemasExpertos } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import type { ActividadEducativa, DatosActividad, PermisosActividad, TipoActividad } from '../types/types';
import { permisosPorTipo } from '../types/types';

const control = 'w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-teal-600 focus:outline-none';
const etiquetas: Record<keyof PermisosActividad, string> = {
  ver_bc: 'Consultar la base de conocimiento', editar_bc: 'Crear y editar la BC propia',
  editor_visual: 'Abrir el editor visual', inferencia_directa: 'Ejecutar inferencia directa',
  simulacion: 'Evaluar paso a paso', validacion: 'Consultar la validación de la BC',
  trazabilidad: 'Ver trazabilidad y explicación',
};

export default function CrearEditarActividadModal({ isOpen, onClose, actividadEditar, onSubmit, isLoading }: {
  isOpen: boolean; onClose: () => void; actividadEditar?: ActividadEducativa | null;
  onSubmit: (values: DatosActividad) => Promise<void>; isLoading: boolean;
}) {
  const { data: sistemas } = useSistemasExpertos();
  const [fallo, setFallo] = useState('');
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<DatosActividad>({
    defaultValues: { tipo: 'ANALISIS_BC', titulo: '', instrucciones: '', sistema_experto_id: '', dificultad: 'MEDIA', estado: 'BORRADOR', permisos: permisosPorTipo('ANALISIS_BC') },
  });
  const tipo = watch('tipo');
  const permisos = watch('permisos');
  useEffect(() => {
    if (!isOpen) return;
    const tipoActual = actividadEditar?.tipo ?? 'ANALISIS_BC';
    reset({ tipo: tipoActual, titulo: actividadEditar?.titulo ?? '', instrucciones: actividadEditar?.instrucciones ?? '',
      sistema_experto_id: actividadEditar?.sistema_experto_id ?? '', dificultad: actividadEditar?.dificultad ?? 'MEDIA',
      estado: actividadEditar?.estado ?? 'BORRADOR', permisos: actividadEditar?.permisos ?? permisosPorTipo(tipoActual) });
    setFallo('');
  }, [isOpen, actividadEditar, reset]);
  const cambiarTipo = (nuevoTipo: TipoActividad) => {
    setValue('tipo', nuevoTipo); setValue('permisos', permisosPorTipo(nuevoTipo));
    if (nuevoTipo === 'CREACION_BC') setValue('sistema_experto_id', null);
  };
  const cambiarPermiso = (clave: keyof PermisosActividad, valor: boolean) => {
    const siguientes = { ...permisos, [clave]: valor };
    if (clave === 'editor_visual' && valor) siguientes.ver_bc = true;
    if (clave === 'ver_bc' && !valor) siguientes.editor_visual = false;
    setValue('permisos', siguientes);
  };
  const guardar = handleSubmit(async (datos) => {
    try { setFallo(''); await onSubmit({ ...datos, sistema_experto_id: tipo === 'CREACION_BC' ? null : datos.sistema_experto_id }); onClose(); }
    catch (error) { setFallo(error instanceof Error ? error.message : 'No se pudo guardar la actividad.'); }
  });
  return <Modal isOpen={isOpen} onClose={onClose} title={actividadEditar ? 'Editar actividad' : 'Nueva actividad'} size="lg">
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['ANALISIS_BC', 'CREACION_BC'] as const).map((opcion) => <button key={opcion} type="button" disabled={Boolean(actividadEditar)}
          onClick={() => cambiarTipo(opcion)} aria-pressed={tipo === opcion}
          className={`rounded-xl border p-4 text-left ${tipo === opcion ? 'border-teal-600 bg-teal-50 text-teal-950' : 'border-stone-200 text-stone-600'}`}>
          <strong className="block text-sm">{opcion === 'ANALISIS_BC' ? 'Analizar una BC' : 'Crear una BC'}</strong>
          <span className="text-xs block mt-1">{opcion === 'ANALISIS_BC' ? 'Trabajar con una base del docente en vivo.' : 'Construir una base privada a partir del enunciado.'}</span>
        </button>)}
      </div>
      {tipo === 'ANALISIS_BC' && <div>
        <label htmlFor="actividad-bc" className="text-sm font-semibold">Base de conocimiento del docente</label>
        <select id="actividad-bc" className={control} {...register('sistema_experto_id', { validate: (v) => tipo !== 'ANALISIS_BC' || Boolean(v) || 'Selecciona una BC.' })} disabled={Boolean(actividadEditar)}>
          <option value="">Selecciona un sistema experto</option>
          {(sistemas ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}{s.estado === 'BORRADOR' ? ' · Borrador' : ''}</option>)}
        </select>
        {errors.sistema_experto_id && <p className="text-xs text-rose-700">{errors.sistema_experto_id.message}</p>}
        <p className="text-xs text-stone-500 mt-2">La BC será accesible para estudiantes solo desde sus actividades. Debe estar activa para publicar.</p>
      </div>}
      <div><label htmlFor="actividad-titulo" className="text-sm font-semibold">Título</label>
        <input id="actividad-titulo" className={control} {...register('titulo', { required: 'Escribe el título.' })} />
        {errors.titulo && <p className="text-xs text-rose-700">{errors.titulo.message}</p>}</div>
      <div><label htmlFor="actividad-instrucciones" className="text-sm font-semibold">Enunciado e instrucciones</label>
        <textarea id="actividad-instrucciones" rows={5} className={control} {...register('instrucciones', { required: 'Escribe el enunciado.' })} />
        {errors.instrucciones && <p className="text-xs text-rose-700">{errors.instrucciones.message}</p>}</div>
      <fieldset className="border border-stone-200 rounded-xl p-4">
        <legend className="text-sm font-semibold px-1">Herramientas del estudiante</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(etiquetas) as Array<keyof PermisosActividad>).map((clave) => <label key={clave} className="text-xs flex gap-2 items-start">
            <input type="checkbox" checked={Boolean(permisos?.[clave])}
              disabled={clave === 'editar_bc' || (tipo === 'CREACION_BC' && clave === 'ver_bc')}
              onChange={(e) => cambiarPermiso(clave, e.target.checked)} className="accent-teal-700 mt-0.5" />{etiquetas[clave]}
          </label>)}
        </div>
        {tipo === 'ANALISIS_BC' && <p className="text-xs text-stone-500 mt-3">Los estudiantes nunca modifican la BC original.</p>}
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Dificultad<select className={control} {...register('dificultad')}>
          <option value="BASICA">Básica</option><option value="MEDIA">Media</option><option value="AVANZADA">Avanzada</option></select></label>
        <label className="text-sm font-semibold">Estado<select className={control} {...register('estado')}>
          <option value="BORRADOR">Borrador</option><option value="PUBLICADA">Publicada</option><option value="INACTIVA">Inactiva</option></select></label>
      </div>
      {fallo && <p role="alert" className="text-sm text-rose-700">{fallo}</p>}
      <div className="flex justify-end gap-2 pt-4 border-t border-stone-200"><Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" loading={isLoading}>{actividadEditar ? 'Guardar cambios' : 'Crear actividad'}</Button></div>
    </form>
  </Modal>;
}
