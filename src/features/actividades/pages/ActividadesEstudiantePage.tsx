import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useActividadesEstudiante } from '../hooks/useActividades';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { ActividadEstudianteResumen } from '../types/types';

export const ActividadesEstudiantePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: actividades = [], isLoading } = useActividadesEstudiante();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <Button variant="outline" onClick={() => navigate('/cursos')} className="mb-4">Mis cursos</Button>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5 font-serif">
          <BookOpen className="w-6 h-6 text-teal-700" />
          Todas mis actividades
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Consulta y resuelve las actividades prácticas asignadas en tus cursos matriculados.
        </p>
      </div>

      {/* Lista de Actividades */}
      {isLoading ? (
        <div className="text-center py-16 text-stone-400">
          <Spinner size="lg" />
          <p className="mt-3 text-sm">Cargando tus actividades asignadas...</p>
        </div>
      ) : actividades.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 shadow-sm">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-400" />
          <h4 className="text-sm font-bold text-stone-700">¡Al día! No tienes actividades pendientes</h4>
          <p className="text-xs text-stone-500 mt-1">
            Tu docente aún no ha asignado nuevas actividades a tus cursos vigentes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {actividades.map((item: ActividadEstudianteResumen) => {
            const fechaLimiteFmt = item.fecha_limite
              ? new Date(item.fecha_limite).toLocaleString()
              : 'Sin fecha límite';

            const esEnviada = item.estado_entrega === 'ENVIADA';
            const esBorrador = item.estado_entrega === 'BORRADOR';

            return (
              <div
                key={item.asignacion_id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {item.curso_codigo}
                    </span>

                    <Badge
                      variant={
                        esEnviada ? 'success' : esBorrador ? 'warning' : 'neutral'
                      }
                      className="text-[10px]"
                    >
                      {esEnviada ? 'Enviada' : esBorrador ? 'Borrador Guardado' : 'Pendiente'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-stone-900 text-sm mb-1 leading-snug">
                    {item.actividad_titulo}
                  </h3>

                  <p className="text-xs text-stone-500 mb-3 font-medium">
                    {item.curso_nombre}
                  </p>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-[11px] text-stone-600 mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Límite: <strong className="text-stone-800">{fechaLimiteFmt}</strong></span>
                  </div>
                </div>

                {/* Botón para resolver o consultar */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400">
                    Asignada el {new Date(item.fecha_asignacion).toLocaleDateString()}
                  </span>

                  <Button
                    variant={esEnviada ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => navigate(`/actividades/resolver/${item.asignacion_id}`)}
                    className={
                      esEnviada
                        ? 'text-xs text-stone-700'
                        : 'text-xs bg-teal-700 hover:bg-teal-800 text-white'
                    }
                  >
                    <span>{esEnviada ? 'Ver Entrega' : esBorrador ? 'Continuar Borrador' : 'Resolver'}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActividadesEstudiantePage;
