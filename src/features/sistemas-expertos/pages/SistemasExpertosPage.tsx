import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Layers, BookOpen } from 'lucide-react';
import { useSistemasExpertos, useSistemaExpertoMutations } from '../hooks/useSistemasExpertos';
import SistemaExpertoCard from '../components/SistemaExpertoCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export const SistemasExpertosPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: sistemas, isLoading, isError, error, refetch } = useSistemasExpertos();
  const { eliminar } = useSistemaExpertoMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const confirmDialog = useConfirmDialog();

  const handleEliminar = (id: string | number) => {
    confirmDialog.confirm({
      title: '¿Eliminar sistema experto?',
      message:
        'Esta acción eliminará el sistema experto junto con sus reglas, hechos y conexiones visuales asociadas. Esta operación no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await eliminar.mutateAsync(id);
      },
    });
  };

  const sistemasFiltrados = useMemo(() => {
    if (!sistemas) return [];
    if (!searchTerm.trim()) return sistemas;
    const term = searchTerm.toLowerCase();
    return sistemas.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(term))
    );
  }, [sistemas, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            Sistemas Expertos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Administra los modelos de conocimiento y motores de inferencia para tus clases.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/sistemas/nuevo')}
          className="shrink-0"
        >
          Nuevo Sistema Experto
        </Button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Buscar sistema experto por nombre o temática..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Spinner size="lg" />
          <p className="mt-3 text-sm font-medium">Cargando sistemas expertos...</p>
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Error al cargar sistemas expertos"
          message={
            error instanceof Error
              ? error.message
              : 'No se pudo obtener la lista de sistemas expertos desde el backend Django.'
          }
          onRetry={() => refetch()}
        />
      ) : sistemasFiltrados.length === 0 ? (
        searchTerm ? (
          <EmptyState
            title="Sin resultados"
            description={`No se encontraron sistemas expertos que coincidan con "${searchTerm}".`}
            actionText="Limpiar búsqueda"
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-indigo-600" />}
            title="No tienes sistemas expertos registrados"
            description="Comienza creando tu primer sistema experto para definir hechos, variables, reglas de inferencia y diagramas visuales."
            actionText="Crear primer sistema"
            onAction={() => navigate('/sistemas/nuevo')}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sistemasFiltrados.map((sistema) => (
            <SistemaExpertoCard
              key={sistema.id}
              sistema={sistema}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
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

export default SistemasExpertosPage;
