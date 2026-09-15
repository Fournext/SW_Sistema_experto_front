import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Variable as VariableIcon } from 'lucide-react';
import { useVariables, useVariablesMutations } from '../hooks/useBaseConocimiento';
import type { Variable } from '../types/types';
import type { VariableFormData } from '../schemas/schemas';
import VariableForm from './VariableForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export interface VariablesSectionProps {
  baseConocimientoId: number | string | undefined;
}

export const VariablesSection: React.FC<VariablesSectionProps> = ({ baseConocimientoId }) => {
  const { data: variables, isLoading, isError, error, refetch } = useVariables(baseConocimientoId);
  const { crear, actualizar, eliminar } = useVariablesMutations(baseConocimientoId);

  const [modalOpen, setModalOpen] = useState(false);
  const [variableAEditar, setVariableAEditar] = useState<Variable | null>(null);
  const confirmDialog = useConfirmDialog();

  const handleCrearOActualizar = async (data: VariableFormData) => {
    if (variableAEditar) {
      await actualizar.mutateAsync({
        id: variableAEditar.id,
        datos: data,
      });
    } else {
      await crear.mutateAsync({
        nombre: data.nombre,
        tipo: data.tipo,
        descripcion: data.descripcion,
      });
    }
    setModalOpen(false);
    setVariableAEditar(null);
  };

  const handleEliminar = (variable: Variable) => {
    confirmDialog.confirm({
      title: `¿Eliminar variable "${variable.nombre}"?`,
      message: 'Esta variable y su definición serán eliminadas de la base de conocimiento.',
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await eliminar.mutateAsync(variable.id);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Spinner size="md" />
        <p className="mt-2 text-xs font-medium">Cargando variables del dominio...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error al cargar variables"
        message={error instanceof Error ? error.message : 'No se pudieron recuperar las variables.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 font-serif">
            <VariableIcon className="w-5 h-5 text-teal-700" />
            Variables del Dominio
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Atributos y conceptos que forman parte de las condiciones y conclusiones del sistema.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setVariableAEditar(null);
            setModalOpen(true);
          }}
        >
          Agregar Variable
        </Button>
      </div>

      {!variables || variables.length === 0 ? (
        <EmptyState
          icon={<VariableIcon className="w-8 h-8 text-teal-700" />}
          title="No hay variables registradas"
          description="Crea variables para definir los atributos que serán evaluados en tus reglas de inferencia."
          actionText="Crear primera variable"
          onAction={() => {
            setVariableAEditar(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo de Dato</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => (
              <TableRow key={variable.id}>
                <TableCell className="font-semibold text-stone-900 font-mono text-xs">
                  {variable.nombre}
                </TableCell>
                <TableCell>
                  <Badge variant="teal" size="sm">
                    {variable.tipo || variable.tipo_dato || 'TEXTO'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-stone-600">
                  {variable.descripcion || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVariableAEditar(variable);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-stone-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar variable"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(variable)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar variable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal Crear / Editar Variable */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setVariableAEditar(null);
        }}
        title={variableAEditar ? 'Editar Variable' : 'Registrar Nueva Variable'}
        description="Establece el nombre y tipo de dato del atributo."
      >
        <VariableForm
          initialValues={
            variableAEditar
              ? {
                  nombre: variableAEditar.nombre,
                  tipo: variableAEditar.tipo || variableAEditar.tipo_dato || 'TEXTO',
                  descripcion: variableAEditar.descripcion,
                }
              : undefined
          }
          onSubmit={handleCrearOActualizar}
          loading={crear.isPending || actualizar.isPending}
          onCancel={() => {
            setModalOpen(false);
            setVariableAEditar(null);
          }}
          submitText={variableAEditar ? 'Guardar Cambios' : 'Crear Variable'}
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

export default VariablesSection;
