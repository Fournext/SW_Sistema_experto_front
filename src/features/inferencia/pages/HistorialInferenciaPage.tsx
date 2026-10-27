import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useActividadNavigate } from '@/hooks/useActividadNavigate';
import { History, Calendar, Lightbulb, ArrowLeft } from 'lucide-react';
import { useHistorialInferencia } from '../hooks/useInferencia';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import ExplicacionConclusionModal from '../components/ExplicacionConclusionModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import type { EjecucionInferencia } from '../types/types';
import { Permisos, usePuede } from '@/config/permisos';

export const HistorialInferenciaPage: React.FC = () => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useActividadNavigate();
  const puedeExplicacion = usePuede(Permisos.INFERENCIA_EXPLICACION_VER);

  const { data: sistema } = useSistemaExperto(sistemaId);
  const [filtroModo, setFiltroModo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [modalExplicacionId, setModalExplicacionId] = useState<string | null>(null);

  const { data: historial = [], isLoading, isError, refetch } = useHistorialInferencia({
    sistema_experto_id: sistemaId,
    modo: filtroModo || undefined,
    estado: filtroEstado || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          {sistemaId && (
            <button
              type="button"
              onClick={() => navigate(`/sistemas/${sistemaId}`)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a {sistema?.nombre || 'Detalle del Sistema'}
            </button>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5 font-serif">
            <History className="w-6 h-6 text-teal-700" />
            Historial de Ejecuciones de Inferencia
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro auditable de inferencias automáticas y simulaciones paso a paso.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroModo}
            onChange={(e) => setFiltroModo(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
            aria-label="Filtrar por modo de inferencia"
          >
            <option value="">Todos los modos</option>
            <option value="DIRECTO">Modo Directo</option>
            <option value="SIMULACION_PASO_A_PASO">Simulación Paso a Paso</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-700 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
            aria-label="Filtrar por estado de ejecución"
          >
            <option value="">Todos los estados</option>
            <option value="INICIADA">Iniciada</option>
            <option value="EJECUTANDO">Ejecutando</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="PAUSADA">Pausada</option>
            <option value="ERROR">Error</option>
          </select>
        </div>
      </div>

      {/* Lista del Historial */}
      {isLoading ? (
        <div className="text-center py-16 text-stone-400">
          <Spinner size="lg" />
          <p className="mt-3 text-sm">Cargando historial de inferencia...</p>
        </div>
      ) : isError ? (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-800">
          <p>No se pudo cargar el historial de inferencias.</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-3">Reintentar</Button>
        </div>
      ) : historial.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 shadow-sm">
          <History className="w-10 h-10 mx-auto mb-3 opacity-40 text-stone-300" />
          <h4 className="text-sm font-bold text-stone-700">Sin ejecuciones registradas</h4>
          <p className="text-xs text-stone-500 mt-1">
            Ejecuta una simulación o inferencia directa para registrar trazabilidad aquí.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200/80 text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Modo</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Pasos / Reglas</th>
                  <th className="p-4">Conclusión Obtenida</th>
                  <th className="p-4">Factor Certeza</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {historial.map((item: EjecucionInferencia) => {
                  const fecha = item.fecha_inicio || item.fecha_ejecucion || item.created_at;
                  const fechaDate = fecha ? new Date(fecha) : null;
                  const fechaFmt = fechaDate && !Number.isNaN(fechaDate.getTime())
                    ? fechaDate.toLocaleString() : 'N/D';
                  const esSimulacion = item.es_simulacion ?? (
                    item.modo_inferencia === 'SIMULACION_PASO_A_PASO'
                    || item.modo === 'SIMULACION' || item.modo === 'PASO_A_PASO'
                  );
                  const totalPasos = item.total_pasos ?? item.paso_visual_actual ?? item.paso_actual;
                  const totalEvaluaciones = item.total_reglas_evaluadas ?? item.reglas_evaluadas?.length;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{fechaFmt}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={esSimulacion ? 'teal' : 'neutral'}
                          className="text-[10px]"
                        >
                          {esSimulacion ? 'Simulación Paso a Paso' : 'Directo'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            item.estado === 'COMPLETADA' || item.estado === 'FINALIZADA'
                              ? 'success'
                              : item.estado !== 'ERROR'
                              ? 'neutral'
                              : 'danger'
                          }
                          className="text-[10px]"
                        >
                          {item.estado}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <div>{totalPasos ?? '—'} {totalPasos === 1 ? 'paso' : 'pasos'}</div>
                        <div className="text-stone-500 mt-1">
                          {totalEvaluaciones ?? '—'} {totalEvaluaciones === 1 ? 'evaluación' : 'evaluaciones'}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-stone-900">
                        {item.conclusion_final ? (
                          <span className="font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {item.conclusion_final}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Sin conclusión</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-medium text-stone-800">
                        {item.factor_certeza_final !== undefined && item.factor_certeza_final !== null
                          ? Number(item.factor_certeza_final).toFixed(2)
                          : '-'}
                      </td>
                      <td className="p-4 text-right">
                        {item.id && puedeExplicacion && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalExplicacionId(item.id || null)}
                            className="text-stone-700 border-stone-200 hover:bg-stone-50 flex items-center gap-1 ml-auto text-xs"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-teal-700" />
                            <span>Explicación</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Explicación */}
      <ExplicacionConclusionModal
        isOpen={puedeExplicacion && Boolean(modalExplicacionId)}
        onClose={() => setModalExplicacionId(null)}
        inferenciaId={modalExplicacionId || undefined}
      />
    </div>
  );
};

export default HistorialInferenciaPage;
