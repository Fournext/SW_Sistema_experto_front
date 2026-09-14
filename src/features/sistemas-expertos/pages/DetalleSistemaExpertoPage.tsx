import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Network,
  Database,
  PlayCircle,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useSistemaExperto, useSistemaExpertoMutations } from '../hooks/useSistemasExpertos';
import SistemaExpertoForm from '../components/SistemaExpertoForm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { SistemaExpertoFormData } from '../schemas/sistemaExpertoSchema';

export const DetalleSistemaExpertoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sistema, isLoading, isError, error, refetch } = useSistemaExperto(id);
  const { actualizar, eliminar } = useSistemaExpertoMutations();
  const [isEditing, setIsEditing] = useState(false);
  const confirmDialog = useConfirmDialog();

  const handleActualizar = async (data: SistemaExpertoFormData) => {
    if (!id) return;
    try {
      await actualizar.mutateAsync({
        id,
        datos: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          activo: data.activo,
        },
      });
      setIsEditing(false);
    } catch {
      // Manejado por react-query
    }
  };

  const handleEliminar = () => {
    if (!id) return;
    confirmDialog.confirm({
      title: '¿Eliminar sistema experto?',
      message:
        'Esta acción eliminará el sistema experto y todos sus elementos vinculados. No podrás recuperarlo.',
      confirmText: 'Sí, eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await eliminar.mutateAsync(id);
        navigate('/sistemas');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium">Cargando información del sistema experto...</p>
      </div>
    );
  }

  if (isError || !sistema) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/sistemas')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sistemas Expertos
        </button>
        <ErrorMessage
          title="No se pudo cargar el sistema experto"
          message={
            error instanceof Error
              ? error.message
              : 'El sistema experto solicitado no existe o no se pudo comunicar con el backend Django.'
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const fechaCruda = sistema.creado_en || sistema.fecha_creacion || sistema.created_at;
  const fechaCreacion = fechaCruda
    ? new Date(fechaCruda).toLocaleDateString('es-ES', {
        dateStyle: 'long',
      })
    : 'No disponible';

  const esActivo =
    sistema.activo !== false &&
    !sistema.estado?.toLowerCase().includes('borrador');

  return (
    <div className="space-y-6">
      {/* Botón Volver y acciones de cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/sistemas')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sistemas Expertos
        </button>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditing(true)}
            >
              Editar Sistema
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            onClick={handleEliminar}
            className="text-rose-600 hover:bg-rose-50"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Contenido principal o Formulario de edición */}
      {isEditing ? (
        <Card header={<h3 className="text-base font-bold text-slate-900">Editar Sistema Experto</h3>}>
          <SistemaExpertoForm
            initialValues={{
              nombre: sistema.nombre,
              descripcion: sistema.descripcion || '',
              activo: esActivo,
            }}
            onSubmit={handleActualizar}
            loading={actualizar.isPending}
            submitButtonText="Guardar Cambios"
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de Información General */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{sistema.nombre}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={sistema.activo !== false ? 'success' : 'neutral'} dot size="sm">
                        {sistema.activo !== false ? 'Activo para Docencia' : 'Borrador'}
                      </Badge>
                      <span className="text-xs text-slate-400">ID #{sistema.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Descripción y Contexto Docente
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {sistema.descripcion ||
                    'No se ha registrado una descripción para este sistema experto. Puedes pulsar en "Editar Sistema" para agregar información detallada para tus alumnos.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Fecha de creación: <strong className="text-slate-700">{fechaCreacion}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Estado: <strong className="text-slate-700">{sistema.activo !== false ? 'Habilitado' : 'Deshabilitado'}</strong></span>
                </div>
              </div>
            </Card>

            {/* Guía didáctica para el docente */}
            <div className="p-5 bg-gradient-to-r from-indigo-50/70 to-sky-50/70 border border-indigo-100/80 rounded-2xl">
              <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Flujo de Trabajo Recomendado
              </h4>
              <p className="text-xs text-indigo-900/80 leading-relaxed mb-3">
                Para preparar una sesión de aprendizaje completa con este sistema experto:
              </p>
              <ol className="list-decimal list-inside text-xs text-indigo-950 space-y-1.5 font-medium">
                <li>Define los hechos y variables en la <strong>Base de Conocimiento</strong>.</li>
                <li>Diseña las reglas y relaciones gráficas usando el <strong>Editor Visual</strong>.</li>
                <li>Ejecuta y demuestra la resolución de problemas paso a paso en el <strong>Motor de Inferencia</strong>.</li>
              </ol>
            </div>
          </div>

          {/* Panel Lateral de Módulos Interactivos */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Módulos Interactivos
            </h3>

            {/* Módulo Editor Visual */}
            <div
              onClick={() => navigate(`/sistemas/${id}/editor`)}
              className="p-5 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                Editor Visual
              </h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Diseña nodos (Hechos, Reglas, Condiciones) y crea conexiones visuales interactivas en el lienzo.
              </p>
              <div className="mt-4 inline-flex items-center text-xs font-semibold text-sky-600">
                Abrir editor →
              </div>
            </div>

            {/* Módulo Base de Conocimiento */}
            <div
              onClick={() => navigate(`/sistemas/${id}/base-conocimiento`)}
              className="p-5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-2xl shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Base de Conocimiento
              </h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Gestiona tablas de hechos, variables con tipos de datos, y reglas con factores de certeza y prioridades.
              </p>
              <div className="mt-4 inline-flex items-center text-xs font-semibold text-amber-600">
                Gestionar tablas →
              </div>
            </div>

            {/* Módulo Inferencia */}
            <div
              onClick={() => navigate(`/sistemas/${id}/inferencia`)}
              className="p-5 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Motor de Inferencia
              </h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Ejecuta el encadenamiento hacia adelante, evalúa condiciones cumplidas y visualiza la conclusión generada.
              </p>
              <div className="mt-4 inline-flex items-center text-xs font-semibold text-emerald-600">
                Ejecutar inferencia →
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
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

export default DetalleSistemaExpertoPage;
