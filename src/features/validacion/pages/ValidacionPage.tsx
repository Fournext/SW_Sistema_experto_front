import React from 'react';
import { useParams } from 'react-router-dom';
import { useActividadNavigate } from '@/hooks/useActividadNavigate';
import { ShieldCheck, ArrowLeft, Database, Cpu } from 'lucide-react';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import { useBaseConocimiento } from '@/features/base-conocimiento/hooks/useBaseConocimiento';
import { useUltimaValidacion, useValidarBase } from '../hooks/useValidacion';
import ValidacionResumenCard from '../components/ValidacionResumenCard';
import IncidenciasTable from '../components/IncidenciasTable';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Permisos, usePuede } from '@/config/permisos';

export const ValidacionPage: React.FC = () => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useActividadNavigate();
  const puedeValidar = usePuede(Permisos.VALIDACION_EJECUTAR);
  const puedeBase = usePuede(Permisos.BASE_CONOCIMIENTO_VER);
  const puedeEditor = usePuede(Permisos.EDITOR_VER);
  const puedeInferencia = usePuede(Permisos.INFERENCIA_EJECUTAR);

  const { data: sistema, isLoading: isSistemaLoading } = useSistemaExperto(sistemaId);
  const { data: baseConocimiento, isLoading: isBaseLoading } = useBaseConocimiento(sistemaId);

  const baseId = baseConocimiento?.id ? String(baseConocimiento.id) : sistemaId;
  const { data: ultimaValidacion } = useUltimaValidacion(baseId);
  const validarBase = useValidarBase();

  const handleValidar = async () => {
    if (!baseId || !puedeValidar) return;
    try {
      await validarBase.mutateAsync(baseId);
    } catch {
      // Manejado en UI
    }
  };

  const handleIrAEntidad = (entidadTipo: string) => {
    if (entidadTipo.toLowerCase().includes('regla') && puedeBase) {
      navigate(`/sistemas/${sistemaId}/base-conocimiento`);
    } else if (puedeEditor) {
      navigate(`/sistemas/${sistemaId}/editor`);
    }
  };

  if (isSistemaLoading || isBaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium">Cargando base de conocimiento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistemaId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a {sistema?.nombre || 'Detalle del Sistema'}
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5 font-serif">
            <ShieldCheck className="w-6 h-6 text-teal-700" />
            Validación de Base de Conocimiento
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Verificación estática y semántica independiente del motor de inferencia.
          </p>
        </div>

        {/* Acceso a otros submódulos */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
            disabled={!puedeBase}
            className="text-stone-700 border-stone-200"
          >
            <Database className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Base de Conocimiento
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sistemas/${sistemaId}/inferencia`)}
            disabled={!puedeInferencia}
            className="text-stone-700 border-stone-200"
          >
            <Cpu className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Simulador
          </Button>
        </div>
      </div>

      {/* Tarjeta de Resumen */}
      <ValidacionResumenCard
        resultado={ultimaValidacion || null}
        isValidando={validarBase.isPending}
        onValidar={handleValidar}
        puedeValidar={puedeValidar}
      />

      {/* Tabla de Reporte de Incidencias */}
      {ultimaValidacion && (
        <IncidenciasTable
          incidencias={ultimaValidacion.incidencias || []}
          onIrAEntidad={handleIrAEntidad}
        />
      )}
    </div>
  );
};

export default ValidacionPage;
