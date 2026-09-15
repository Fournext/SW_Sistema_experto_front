import React, { useState, useMemo } from 'react';
import { Plus, Workflow } from 'lucide-react';
import { useReglas, useVariables, useHechos, useReglasMutations } from '../hooks/useBaseConocimiento';
import type { Regla } from '../types/types';
import ReglaCard from './ReglaCard';
import ReglaEditorModal from './ReglaEditorModal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export interface ReglasSectionProps {
  baseConocimientoId: number | string | undefined;
}

export const ReglasSection: React.FC<ReglasSectionProps> = ({ baseConocimientoId }) => {
  const { data: reglas, isLoading, isError, error, refetch } = useReglas(baseConocimientoId);
  const { data: variables } = useVariables(baseConocimientoId);
  const { data: hechos } = useHechos(baseConocimientoId);
  const { eliminar } = useReglasMutations(baseConocimientoId);

  const [modalOpen, setModalOpen] = useState(false);
  const [reglaAEditarId, setReglaAEditarId] = useState<string | number | null>(null);
  const confirmDialog = useConfirmDialog();

  // Derivar regla seleccionada directamente desde la query de reglas para reactividad total
  const reglaAEditar = useMemo(() => {
    if (!reglaAEditarId || !reglas) return null;
    return reglas.find((r) => String(r.id) === String(reglaAEditarId)) || null;
  }, [reglaAEditarId, reglas]);

  const handleEditar = (regla: Regla) => {
    setReglaAEditarId(regla.id);
    setModalOpen(true);
  };

  const handleCrear = () => {
    setReglaAEditarId(null);
    setModalOpen(true);
  };

  const handleEliminar = (regla: Regla) => {
    confirmDialog.confirm({
      title: `¿Eliminar regla "${regla.nombre}"?`,
      message: 'Esta regla y todas sus condiciones y conclusiones asociadas serán eliminadas permanentemente.',
      confirmText: 'Sí, eliminar regla',
      variant: 'danger',
      onConfirm: async () => {
        await eliminar.mutateAsync(regla.id);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Spinner size="md" />
        <p className="mt-2 text-xs font-medium">Cargando reglas de inferencia...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error al cargar reglas"
        message={error instanceof Error ? error.message : 'No se pudieron recuperar las reglas registradas.'}
        onRetry={() => refetch()}
      />
    );
  }

  const nextNumber = (reglas?.length || 0) + 1;

  return (
    <div className="space-y-4">
      {/* Cabecera de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-600" />
            Reglas de Inferencia (IF - THEN)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reglas de producción con premisas evaluadas y consecuencias deducidas por el motor de inferencia.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleCrear}
        >
          Crear Regla
        </Button>
      </div>

      {/* Lista de Reglas o Empty State */}
      {!reglas || reglas.length === 0 ? (
        <EmptyState
          icon={<Workflow className="w-8 h-8 text-indigo-500" />}
          title="No hay reglas de inferencia creadas"
          description="Crea reglas de producción con premisas (IF) y consecuencias (THEN) para razonar sobre los hechos."
          actionText="Crear primera regla"
          onAction={handleCrear}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reglas.map((regla) => (
            <ReglaCard
              key={regla.id}
              regla={regla}
              variables={variables}
              hechos={hechos}
              onEdit={handleEditar}
              onDelete={handleEliminar}
            />
          ))}
        </div>
      )}

      {/* Modal Unificado de Creación y Edición */}
      <ReglaEditorModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReglaAEditarId(null);
        }}
        regla={reglaAEditar}
        baseConocimientoId={baseConocimientoId}
        variables={variables}
        hechos={hechos}
        defaultNextNumber={nextNumber}
      />

      {/* Confirmación para eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.close}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        loading={confirmDialog.loading}
      />
    </div>
  );
};

export default ReglasSection;
