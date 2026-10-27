import { Permisos, usePuede } from '@/config/permisos';
import { Permiso } from '@/shared/components/Permiso';
import React, { useState } from 'react';
import {
  GraduationCap,
  PlusCircle,
  Calendar,
  Share2,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';
import {
  useActividades,
  useCrearActividad,
  useActualizarActividad,
  useDesactivarActividad,
  useAsignarActividad,
  useAsignaciones,
} from '../hooks/useActividades';
import CrearEditarActividadModal from '../components/CrearEditarActividadModal';
import AsignarActividadModal from '../components/AsignarActividadModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { ActividadEducativa, DatosActividad } from '../types/types';

export const ActividadesDocentePage: React.FC<{ cursoId?: string; cursoArchivado?: boolean }> = ({ cursoId, cursoArchivado }) => {
  const { data: actividades = [], isLoading } = useActividades();
  const { data: asignaciones = [] } = useAsignaciones(cursoId ? { curso_id: cursoId } : undefined);
  const actividadesMostradas = cursoId ? actividades.filter((a) => asignaciones.some((s) => s.actividad_id === a.id)) : actividades;
  const crearActividad = useCrearActividad();
  const puedeCrear = usePuede(Permisos.ACTIVIDADES_CREAR);
  const puedeEditar = usePuede(Permisos.ACTIVIDADES_EDITAR);
  const puedeEliminar = usePuede(Permisos.ACTIVIDADES_ELIMINAR);
  const puedeAsignar = usePuede(Permisos.ASIGNACIONES_CREAR);
  const actualizarActividad = useActualizarActividad();
  const desactivarActividad = useDesactivarActividad();
  const asignarActividad = useAsignarActividad();

  const [modalCrearEditarAbierto, setModalCrearEditarAbierto] = useState<boolean>(false);
  const [actividadEditar, setActividadEditar] = useState<ActividadEducativa | null>(null);

  const [modalAsignarAbierto, setModalAsignarAbierto] = useState<boolean>(false);
  const [actividadParaAsignar, setActividadParaAsignar] = useState<ActividadEducativa | null>(null);

  const handleCrearEditarSubmit = async (values: DatosActividad) => {
    if (actividadEditar ? !puedeEditar : !puedeCrear) return;
    if (actividadEditar) {
      await actualizarActividad.mutateAsync({
        id: actividadEditar.id,
        datos: values,
      });
    } else {
      await crearActividad.mutateAsync({ ...values, ...(cursoId ? { curso_id: cursoId } : {}) });
    }
  };

  const handleAsignarSubmit = async (datos: {
    actividad_id: string;
    curso_id: string;
    fecha_limite?: string | null;
  }) => {
    if (!puedeAsignar) return;
    await asignarActividad.mutateAsync(datos);
  };

  const handleDesactivar = async (id: string) => {
    if (!puedeEliminar) return;
    if (window.confirm('¿Desea eliminar esta actividad educativa? Ya no estará visible en la biblioteca ni en los cursos.')) {
      await desactivarActividad.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5 font-serif">
            <GraduationCap className="w-6 h-6 text-teal-700" />
            {cursoId ? 'Actividades del curso' : 'Biblioteca de actividades'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {cursoId ? 'Enunciados, herramientas y entregas de este curso.' : 'Reutiliza tus actividades en distintos cursos.'}
          </p>
        </div>

        <Permiso permisos={[Permisos.ACTIVIDADES_CREAR]}><Button
          variant="primary"
          disabled={cursoArchivado}
          onClick={() => {
            setActividadEditar(null);
            setModalCrearEditarAbierto(true);
          }}
          className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Actividad</span>
        </Button></Permiso>
      </div>

      {/* Listado de Actividades */}
      {isLoading ? (
        <div className="text-center py-16 text-stone-400">
          <Spinner size="lg" />
          <p className="mt-3 text-sm">Cargando actividades educativas...</p>
        </div>
      ) : actividadesMostradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 shadow-sm">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40 text-stone-300" />
          <h4 className="text-sm font-bold text-stone-700">Sin actividades creadas</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-4">
            Comienza creando una actividad didáctica para que los estudiantes pongan a prueba sistemas basados en conocimiento.
          </p>
          <Permiso permisos={[Permisos.ACTIVIDADES_CREAR]}><Button
            variant="primary"
            disabled={cursoArchivado}
            onClick={() => {
              setActividadEditar(null);
              setModalCrearEditarAbierto(true);
            }}
            className="bg-teal-700 text-white"
          >
            Crear Primera Actividad
          </Button></Permiso>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {actividadesMostradas.map((act) => {
            const fechaFmt = act.creada_en ? new Date(act.creada_en).toLocaleDateString() : '';

            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      variant={
                        act.dificultad === 'BASICA'
                          ? 'success'
                          : act.dificultad === 'MEDIA'
                          ? 'neutral'
                          : 'danger'
                      }
                      className="text-[10px]"
                    >
                      {act.dificultad}
                    </Badge>

                    <Badge
                      variant={act.estado === 'PUBLICADA' ? 'teal' : 'warning'}
                      className="text-[10px]"
                    >
                      {act.estado}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-stone-900 text-sm mb-1 leading-snug">
                    {act.titulo}
                  </h3>

                  <p className="text-xs text-stone-500 mb-3 line-clamp-2">
                    {act.instrucciones}
                  </p>

                  <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-2.5 text-[11px] text-stone-600 mb-4">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Sistema Experto
                    </span>
                    <strong className="text-stone-800">
                      {act.tipo === 'CREACION_BC' ? 'Creación de una BC privada por estudiante' : act.sistema_experto_nombre || 'Análisis de BC del docente'}
                    </strong>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fechaFmt}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Permiso permisos={[Permisos.ASIGNACIONES_CREAR]}><Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActividadParaAsignar(act);
                        setModalAsignarAbierto(true);
                      }}
                      className="text-teal-700 border-teal-200 hover:bg-teal-50 text-xs px-2.5 py-1"
                      title="Asignar actividad a un curso"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Asignar
                    </Button></Permiso>

                    <Permiso permisos={[Permisos.ACTIVIDADES_EDITAR]}><button
                      type="button"
                      onClick={() => {
                        setActividadEditar(act);
                        setModalCrearEditarAbierto(true);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Editar actividad"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button></Permiso>

                    <Permiso permisos={[Permisos.ACTIVIDADES_ELIMINAR]}><button
                      type="button"
                      onClick={() => handleDesactivar(act.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button></Permiso>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cursoId && puedeAsignar && !cursoArchivado && <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <label htmlFor="reutilizar-actividad" className="text-sm font-semibold">Reutilizar una actividad de la biblioteca</label>
        <select id="reutilizar-actividad" value="" className="block mt-2 w-full rounded-xl border border-stone-300 p-2 text-sm bg-white"
          onChange={(e) => { const seleccionada = actividades.find((a) => a.id === e.target.value); if (seleccionada) { setActividadParaAsignar(seleccionada); setModalAsignarAbierto(true); } }}>
          <option value="">Selecciona una actividad para asignarla</option>
          {actividades.filter((a) => !asignaciones.some((s) => s.actividad_id === a.id)).map((a) => <option key={a.id} value={a.id}>{a.titulo}</option>)}
        </select>
      </div>}

      {/* Modales */}
      <CrearEditarActividadModal
        isOpen={modalCrearEditarAbierto}
        onClose={() => setModalCrearEditarAbierto(false)}
        actividadEditar={actividadEditar}
        onSubmit={handleCrearEditarSubmit}
        isLoading={crearActividad.isPending || actualizarActividad.isPending}
      />

      <AsignarActividadModal
        isOpen={modalAsignarAbierto}
        onClose={() => setModalAsignarAbierto(false)}
        actividad={actividadParaAsignar}
        cursoInicialId={cursoId}
        onSubmit={handleAsignarSubmit}
        isLoading={asignarActividad.isPending}
      />
    </div>
  );
};

export default ActividadesDocentePage;
