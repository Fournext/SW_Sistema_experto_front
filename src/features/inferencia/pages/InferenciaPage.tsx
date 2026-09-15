import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, RotateCcw, ArrowLeft, Network, Database, Cpu } from 'lucide-react';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import { useBaseConocimiento, useHechos } from '@/features/base-conocimiento/hooks/useBaseConocimiento';
import { useEjecutarInferencia, useDetallesInferencia } from '../hooks/useInferencia';
import type { EjecucionInferencia, DetalleInferencia } from '../types/types';

import HechosInicialesPanel from '../components/HechosInicialesPanel';
import ReglasEvaluadasPanel from '../components/ReglasEvaluadasPanel';
import ReglasActivadasPanel from '../components/ReglasActivadasPanel';
import ConclusionFinalPanel from '../components/ConclusionFinalPanel';
import TrazabilidadFlow from '../components/TrazabilidadFlow';

import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';

export const InferenciaPage: React.FC = () => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: sistema, isLoading: isSistemaLoading } = useSistemaExperto(sistemaId);
  const { data: baseConocimiento } = useBaseConocimiento(sistemaId);
  const effectiveBaseId = baseConocimiento?.id || sistemaId;
  const { data: hechosIniciales = [] } = useHechos(effectiveBaseId);

  const ejecutarInferencia = useEjecutarInferencia(sistemaId);

  const [resultadoInferencia, setResultadoInferencia] = useState<EjecucionInferencia | null>(null);
  const [inferenciaIdActual, setInferenciaIdActual] = useState<string | number | null>(null);

  const { data: detallesApi = [] } = useDetallesInferencia(inferenciaIdActual || undefined);

  const handleEjecutar = async () => {
    try {
      const resp = await ejecutarInferencia.mutateAsync({
        hechos_iniciales: hechosIniciales.map((h) => ({
          nombre: h.nombre,
          valor: String(h.valor),
        })),
      });

      setResultadoInferencia(resp);
      const idEjecucion = resp?.id || resp?.ejecucion_id;
      if (idEjecucion) {
        setInferenciaIdActual(String(idEjecucion));
      }
    } catch {
      // Manejado por react-query
    }
  };

  const handleReiniciar = () => {
    setResultadoInferencia(null);
    setInferenciaIdActual(null);
  };

  if (isSistemaLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium">Cargando motor de inferencia...</p>
      </div>
    );
  }

  // Reglas evaluadas y activadas obtenidas del backend o de la respuesta directa
  const detallesCombinados: DetalleInferencia[] =
    (resultadoInferencia?.reglas_evaluadas && resultadoInferencia.reglas_evaluadas.length > 0
      ? resultadoInferencia.reglas_evaluadas
      : null) ||
    (resultadoInferencia?.detalles && resultadoInferencia.detalles.length > 0
      ? resultadoInferencia.detalles
      : null) ||
    (detallesApi && detallesApi.length > 0
      ? detallesApi
      : []) ||
    [];

  const reglasActivadas: DetalleInferencia[] = (() => {
    if (resultadoInferencia?.reglas_activadas && resultadoInferencia.reglas_activadas.length > 0) {
      return resultadoInferencia.reglas_activadas;
    }
    const activadasMap = new Map<string, DetalleInferencia>();
    for (const d of detallesCombinados) {
      if (d.estado === 'ACTIVADA' || d.estado === 'EJECUTADA') {
        const key = String(
          (typeof d.regla === 'string' ? d.regla : d.regla?.nombre) ||
          d.regla_id ||
          d.nombre_regla ||
          d.regla_nombre ||
          d.id
        );
        activadasMap.set(key, d);
      }
    }
    return Array.from(activadasMap.values());
  })();

  const estadoEjecucion = ejecutarInferencia.isPending
    ? 'EN_PROGRESO'
    : resultadoInferencia
    ? 'COMPLETADA'
    : 'INACTIVA';

  return (
    <div className="space-y-6">
      {/* Cabecera y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistemaId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a {sistema?.nombre || 'Detalle del Sistema'}
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-emerald-600" />
            Motor de Inferencia Hacia Adelante
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ejecución paso a paso del ciclo de inferencia y resolución de conflictos.
          </p>
        </div>

        {/* Acceso a otros submódulos */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Network className="w-3.5 h-3.5 text-sky-600" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/editor`)}
          >
            Editor Visual
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Database className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
          >
            Base C.
          </Button>
        </div>
      </div>

      {/* Barra de control y estado de ejecución */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            icon={<Play className="w-5 h-5 fill-current" />}
            onClick={handleEjecutar}
            loading={ejecutarInferencia.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200"
          >
            {ejecutarInferencia.isPending ? 'Ejecutando Inferencia...' : 'Ejecutar Inferencia'}
          </Button>

          {resultadoInferencia && (
            <Button
              variant="outline"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleReiniciar}
            >
              Reiniciar Ciclo
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Estado del Motor:</span>
          {estadoEjecucion === 'EN_PROGRESO' && (
            <Badge variant="warning" dot size="md">
              EN PROGRESO...
            </Badge>
          )}
          {estadoEjecucion === 'COMPLETADA' && (
            <Badge variant="success" dot size="md">
              INFERENCIA COMPLETADA
            </Badge>
          )}
          {estadoEjecucion === 'INACTIVA' && (
            <Badge variant="neutral" dot size="md">
              LISTO PARA EJECUTAR
            </Badge>
          )}
        </div>
      </div>

      {/* Error si la ejecución falla */}
      {ejecutarInferencia.isError && (
        <ErrorMessage
          title="Error al ejecutar inferencia"
          message={
            ejecutarInferencia.error instanceof Error
              ? ejecutarInferencia.error.message
              : 'Ocurrió un error al procesar el motor de inferencia en el backend Django.'
          }
          onRetry={handleEjecutar}
        />
      )}

      {/* Trazabilidad visual tipo Pipeline didáctico */}
      <TrazabilidadFlow
        totalHechos={hechosIniciales.length + (resultadoInferencia?.hechos_generados?.length || 0)}
        totalEvaluadas={detallesCombinados.length}
        totalActivadas={reglasActivadas.length}
        tieneConclusion={Boolean(resultadoInferencia?.conclusion_final)}
      />

      {/* Grid con las etapas de inferencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 1. Hechos iniciales y generados */}
          <HechosInicialesPanel
            hechos={hechosIniciales}
            hechosGenerados={resultadoInferencia?.hechos_generados}
          />

          {/* 2. Reglas evaluadas */}
          <ReglasEvaluadasPanel detalles={detallesCombinados} />
        </div>

        <div className="space-y-6">
          {/* 3. Reglas activadas */}
          <ReglasActivadasPanel reglasActivadas={reglasActivadas} />

          {/* 4. Conclusión final */}
          <ConclusionFinalPanel
            conclusion={resultadoInferencia?.conclusion_final}
            factorCerteza={resultadoInferencia?.factor_certeza_final}
            estado={estadoEjecucion}
          />
        </div>
      </div>
    </div>
  );
};

export default InferenciaPage;
