import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { useHechos, useHechosMutations } from '../hooks/useBaseConocimiento';
import type { Hecho } from '../types/types';
import type { HechoFormData } from '../schemas/schemas';
import HechoForm from './HechoForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export interface HechosTabProps {
  baseConocimientoId: number | string | undefined;
}

export const HechosTab: React.FC<HechosTabProps> = ({ baseConocimientoId }) => {
  const { data: hechos, isLoading, isError, error, refetch } = useHechos(baseConocimientoId);
  const { crear, actualizar, eliminar } = useHechosMutations(baseConocimientoId);

  const [modalOpen, setModalOpen] = useState(false);
  const [hechoAEditar, setHechoAEditar] = useState<Hecho | null>(null);
  const confirmDialog = useConfirmDialog();

  const handleCrearOActualizar = async (data: HechoFormData) => {
    if (hechoAEditar) {
      await actualizar.mutateAsync({
        id: hechoAEditar.id,
        datos: data,
      });
    } else {
      await crear.mutateAsync({
        nombre: data.nombre,
        valor: data.valor,
        tipo_dato: data.tipo_dato,
        es_inicial: data.es_inicial,
      });
    }
    setModalOpen(false);
    setHechoAEditar(null);
  };

  const handleEliminar = (hecho: Hecho) => {
    confirmDialog.confirm({
      title: `¿Eliminar hecho "${hecho.nombre}"?`,
      message: 'Este hecho dejará de formar parte de la base de conocimiento y de las premisas evaluadas.',
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await eliminar.mutateAsync(hecho.id);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Spinner size="md" />
        <p className="mt-2 text-xs font-medium">Cargando hechos registrados...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error al cargar hechos"
        message={error instanceof Error ? error.message : 'No se pudieron recuperar los hechos.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Hechos y Proposiciones</h3>
          <p className="text-xs text-slate-500">
            Los hechos representan el estado conocido del mundo en un momento determinado.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setHechoAEditar(null);
            setModalOpen(true);
          }}
        >
          Agregar Hecho
        </Button>
      </div>

      {!hechos || hechos.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-emerald-600" />}
          title="No hay hechos en esta base de conocimiento"
          description="Agrega proposiciones o datos iniciales para comenzar a evaluar el razonamiento del sistema."
          actionText="Crear primer hecho"
          onAction={() => {
            setHechoAEditar(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Nombre</TableHead>
              <TableHead>Valor Asignado</TableHead>
              <TableHead>Tipo de Dato</TableHead>
              <TableHead>Es Inicial</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {hechos.map((hecho) => (
              <TableRow key={hecho.id}>
                <TableCell className="font-semibold text-slate-900">
                  {hecho.nombre}
                </TableCell>
                <TableCell>
                  <code className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-mono">
                    {hecho.valor}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="indigo" size="sm">
                    {hecho.tipo_dato}
                  </Badge>
                </TableCell>
                <TableCell>
                  {hecho.es_inicial ? (
                    <Badge variant="success" size="sm" dot>
                      Inicial
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Deducido
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setHechoAEditar(hecho);
                        setModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      title="Editar hecho"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(hecho)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Eliminar hecho"
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

      {/* Modal Crear / Editar Hecho */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setHechoAEditar(null);
        }}
        title={hechoAEditar ? 'Editar Hecho' : 'Registrar Nuevo Hecho'}
        description="Define la variable y su valor dentro de la base de conocimiento."
      >
        <HechoForm
          initialValues={
            hechoAEditar
              ? {
                  nombre: hechoAEditar.nombre,
                  valor: hechoAEditar.valor,
                  tipo_dato: hechoAEditar.tipo_dato,
                  es_inicial: hechoAEditar.es_inicial,
                }
              : undefined
          }
          onSubmit={handleCrearOActualizar}
          loading={crear.isPending || actualizar.isPending}
          onCancel={() => {
            setModalOpen(false);
            setHechoAEditar(null);
          }}
          submitText={hechoAEditar ? 'Guardar Cambios' : 'Crear Hecho'}
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

export default HechosTab;
