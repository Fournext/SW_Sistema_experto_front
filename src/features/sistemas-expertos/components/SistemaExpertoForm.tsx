import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sistemaExpertoSchema, type SistemaExpertoFormData } from '../schemas/sistemaExpertoSchema';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export interface SistemaExpertoFormProps {
  initialValues?: Partial<SistemaExpertoFormData>;
  onSubmit: (data: SistemaExpertoFormData) => Promise<void> | void;
  loading?: boolean;
  submitButtonText?: string;
  onCancel?: () => void;
}

export const SistemaExpertoForm: React.FC<SistemaExpertoFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  submitButtonText = 'Guardar Sistema Experto',
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SistemaExpertoFormData>({
    resolver: zodResolver(sistemaExpertoSchema),
    defaultValues: {
      nombre: initialValues?.nombre || '',
      descripcion: initialValues?.descripcion || '',
      activo: initialValues?.activo ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
      <Input
        label="Nombre del Sistema Experto"
        placeholder="Ej: Diagnóstico de Fallas en Redes, Recomendador Académico..."
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <Textarea
        label="Descripción pedagógica"
        placeholder="Explica brevemente el dominio del problema, el objetivo docente o el alcance de este sistema experto..."
        rows={4}
        error={errors.descripcion?.message}
        helperText="Información de utilidad para contextualizar el ejercicio con los estudiantes."
        {...register('descripcion')}
      />

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="activo"
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          {...register('activo')}
        />
        <label htmlFor="activo" className="text-sm font-medium text-slate-700 cursor-pointer">
          Habilitar sistema como activo
        </label>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="outline" size="md" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" loading={loading}>
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
};

export default SistemaExpertoForm;
