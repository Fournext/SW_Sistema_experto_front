import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Network, PlayCircle, Workflow, FileText, Variable as VariableIcon } from 'lucide-react';
import { useBaseConocimiento, useHechos, useVariables, useReglas } from '../hooks/useBaseConocimiento';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import HechosTab from '../components/HechosTab';
import VariablesSection from '../components/VariablesSection';
import ReglasSection from '../components/ReglasSection';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import Button from '@/components/ui/Button';

export type BCActiveTab = 'reglas' | 'hechos' | 'variables';

export const BaseConocimientoPage: React.FC = () => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BCActiveTab>('reglas');

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
            Estructura declarativa de reglas, base de hechos y variables del sistema.
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

      {/* Contenedor con 3 Pestañas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Barra de Pestañas */}
        <div className="flex border-b border-slate-200 bg-white px-3 pt-2 gap-2 overflow-x-auto">
          {/* Pestaña 1: Reglas de Inferencia */}
          <button
            type="button"
            onClick={() => setActiveTab('reglas')}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer rounded-t-lg select-none whitespace-nowrap ${
              activeTab === 'reglas'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Workflow className={`w-4 h-4 ${activeTab === 'reglas' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Reglas</span>
            {reglas !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  activeTab === 'reglas' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {reglas.length}
              </span>
            )}
          </button>

          {/* Pestaña 2: Base de Hechos */}
          <button
            type="button"
            onClick={() => setActiveTab('hechos')}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer rounded-t-lg select-none whitespace-nowrap ${
              activeTab === 'hechos'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'hechos' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Base de Hechos</span>
            {hechos !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  activeTab === 'hechos' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {hechos.length}
              </span>
            )}
          </button>

          {/* Pestaña 3: Variables */}
          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer rounded-t-lg select-none whitespace-nowrap ${
              activeTab === 'variables'
                ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <VariableIcon className={`w-4 h-4 ${activeTab === 'variables' ? 'text-sky-600' : 'text-slate-400'}`} />
            <span>Variables</span>
            {variables !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  activeTab === 'variables' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {variables.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="p-6">
          {activeTab === 'reglas' && <ReglasSection baseConocimientoId={effectiveBaseId} />}
          {activeTab === 'hechos' && <HechosTab baseConocimientoId={effectiveBaseId} />}
          {activeTab === 'variables' && <VariablesSection baseConocimientoId={effectiveBaseId} />}
        </div>
      </div>
    </div>
  );
};

export default BaseConocimientoPage;
