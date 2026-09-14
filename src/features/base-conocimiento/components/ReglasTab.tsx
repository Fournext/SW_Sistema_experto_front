import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Workflow } from 'lucide-react';
import { useReglas, useReglasMutations } from '../hooks/useBaseConocimiento';
import type { Regla } from '../types/types';
import type { ReglaFormData } from '../schemas/schemas';
import ReglaForm from './ReglaForm';
import ReglaDetalle from './ReglaDetalle';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export interface ReglasTabProps {
  baseConocimientoId: number | string | undefined;
}

export const ReglasTab: React.FC<ReglasTabProps> = ({ baseConocimientoId }) => {
  const { data: reglas, isLoading, isError, error, refetch } = useReglas(baseConocimientoId);
  const { crear, actualizar, eliminar } = useReglasMutations(baseConocimientoId);

  const [modalOpen, setModalOpen] = useState(false);
  const [reglaAEditar, setReglaAEditar] = useState<Regla | null>(null);
  const [expandedReglaId, setExpandedReglaId] = useState<number | null>(null);
  const confirmDialog = useConfirmDialog();

  const toggleExpand = (id: number) => {
    setExpandedReglaId((prev) => (prev === id ? null : id));
  };

  const handleCrearOActualizar = async (data: ReglaFormData) => {
    if (reglaAEditar) {
      await actualizar.mutateAsync({
        id: reglaAEditar.id,
        datos: data,
      });
    } else {
      await crear.mutateAsync({
        nombre: data.nombre,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        factor_certeza: data.factor_certeza,
        activa: data.activa,
      });
    }
    setModalOpen(false);
    setReglaAEditar(null);
  };

  const handleEliminar = (regla: Regla) => {
    confirmDialog.confirm({
      title: `¿Eliminar regla "${regla.nombre}"?`,
      message: 'Esta regla y todas sus condiciones y conclusiones serán eliminadas.',
      confirmText: 'Sí, eliminar regla',
      variant: 'danger',
      onConfirm: async () => {
        await eliminar.mutateAsync(regla.id);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Spinner size="md" />
        <p className="mt-2 text-xs font-medium">Cargando reglas de inferencia...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error al cargar reglas"
        message={error instanceof Error ? error.message : 'No se pudieron recuperar las reglas.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Reglas de Inferencia (IF-THEN)</h3>
          <p className="text-xs text-slate-500">
            Reglas de producción con condiciones, conclusiones, factor de certeza y prioridad de ejecución.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setReglaAEditar(null);
            setModalOpen(true);
          }}
        >
          Agregar Regla
        </Button>
      </div>

      {!reglas || reglas.length === 0 ? (
        <EmptyState
          icon={<Workflow className="w-8 h-8 text-indigo-600" />}
          title="No existen reglas en esta base de conocimiento"
          description="Las reglas permiten al motor de inferencia deducir nuevos hechos a partir de las premisas conocidas."
          actionText="Crear primera regla"
          onAction={() => {
            setReglaAEditar(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {reglas.map((regla) => {
            const isExpanded = expandedReglaId === regla.id;
            const cantCondiciones = regla.condiciones?.length || 0;
            const cantConclusiones = regla.conclusiones?.length || 0;

            return (
              <div
                key={regla.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all hover:border-slate-300"
              >
                {/* Cabecera de la fila de la regla */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(regla.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title={isExpanded ? 'Ocultar cláusulas' : 'Ver cláusulas'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{regla.nombre}</span>
                        <Badge variant={regla.activa ? 'success' : 'neutral'} size="sm" dot>
                          {regla.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      {regla.descripcion && (
                        <p className="text-xs text-slate-500 mt-0.5">{regla.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                        Prioridad: <strong>{regla.prioridad}</strong>
                      </span>
                      <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[11px] font-semibold">
                        FC: <strong>{(regla.factor_certeza * 100).toFixed(0)}%</strong>
                      </span>
                      <span className="text-xs text-slate-400">
                        ({cantCondiciones} IF / {cantConclusiones} THEN)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReglaAEditar(regla);
                          setModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        title="Editar regla"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(regla)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vista expandida de cláusulas IF-THEN */}
                {isExpanded && (
                  <ReglaDetalle regla={regla} baseConocimientoId={baseConocimientoId} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Regla */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReglaAEditar(null);
        }}
        title={reglaAEditar ? 'Editar Regla de Inferencia' : 'Nueva Regla de Inferencia'}
        description="Establece los metadatos, prioridad y factor de certeza de la regla."
      >
        <ReglaForm
          initialValues={
            reglaAEditar
              ? {
                  nombre: reglaAEditar.nombre,
                  descripcion: reglaAEditar.descripcion,
                  prioridad: reglaAEditar.prioridad,
                  factor_certeza: reglaAEditar.factor_certeza,
                  activa: reglaAEditar.activa,
                }
              : undefined
          }
          onSubmit={handleCrearOActualizar}
          loading={crear.isPending || actualizar.isPending}
          onCancel={() => {
            setModalOpen(false);
            setReglaAEditar(null);
          }}
          submitText={reglaAEditar ? 'Guardar Cambios' : 'Crear Regla'}
        />
      </Modal>

      {/* Confirmación de eliminación */}
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

export default ReglasTab;
