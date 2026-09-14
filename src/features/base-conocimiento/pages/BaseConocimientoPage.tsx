import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Network, PlayCircle } from 'lucide-react';
import { useBaseConocimiento, useHechos, useVariables, useReglas } from '../hooks/useBaseConocimiento';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import TabNavigation, { type TabType } from '../components/TabNavigation';
import HechosTab from '../components/HechosTab';
import VariablesTab from '../components/VariablesTab';
import ReglasTab from '../components/ReglasTab';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import Button from '@/components/ui/Button';

export const BaseConocimientoPage: React.FC = () => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('hechos');

  const { data: sistema } = useSistemaExperto(sistemaId);
  const {
    data: baseConocimiento,
    isLoading: isBaseLoading,
    isError: isBaseError,
    error: baseError,
    refetch: refetchBase,
  } = useBaseConocimiento(sistemaId);

  // El ID para consultar hechos/variables/reglas es baseConocimiento.id o en su defecto sistemaId
  const effectiveBaseId = baseConocimiento?.id || sistemaId;

  const { data: hechos } = useHechos(effectiveBaseId);
  const { data: variables } = useVariables(effectiveBaseId);
  const { data: reglas } = useReglas(effectiveBaseId);

  if (isBaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium">Cargando base de conocimiento...</p>
      </div>
    );
  }

  if (isBaseError) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/sistemas/${sistemaId}`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Sistema Experto
        </button>
        <ErrorMessage
          title="Error al cargar la base de conocimiento"
          message={
            baseError instanceof Error
              ? baseError.message
              : 'No se pudo obtener la base de conocimiento asociada al sistema experto.'
          }
          onRetry={() => refetchBase()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navegación y Cabecera */}
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
            <Database className="w-6 h-6 text-amber-500" />
            Base de Conocimiento
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estructura declarativa de hechos, variables y reglas de producción del sistema.
          </p>
        </div>

        {/* Acceso directo a otros módulos vinculados */}
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
            icon={<PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => navigate(`/sistemas/${sistemaId}/inferencia`)}
          >
            Motor Inferencia
          </Button>
        </div>
      </div>

      {/* Contenedor con Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <TabNavigation
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={{
            hechos: hechos?.length ?? 0,
            variables: variables?.length ?? 0,
            reglas: reglas?.length ?? 0,
          }}
        />

        <div className="p-6">
          {activeTab === 'hechos' && <HechosTab baseConocimientoId={effectiveBaseId} />}
          {activeTab === 'variables' && <VariablesTab baseConocimientoId={effectiveBaseId} />}
          {activeTab === 'reglas' && <ReglasTab baseConocimientoId={effectiveBaseId} />}
        </div>
      </div>
    </div>
  );
};

export default BaseConocimientoPage;
