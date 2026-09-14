import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reglaSchema, type ReglaFormData } from '../schemas/schemas';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export interface ReglaFormProps {
  initialValues?: Partial<ReglaFormData>;
  onSubmit: (data: ReglaFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
  submitText?: string;
}

export const ReglaForm: React.FC<ReglaFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
  submitText = 'Guardar Regla',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReglaFormData>({
    resolver: zodResolver(reglaSchema),
    defaultValues: {
      nombre: initialValues?.nombre || '',
      descripcion: initialValues?.descripcion || '',
      prioridad: initialValues?.prioridad ?? 10,
      factor_certeza: initialValues?.factor_certeza ?? 1.0,
      activa: initialValues?.activa ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
      <Input
        label="Identificador de la Regla"
        placeholder="Ej: R1_Diagnostico_Gripe, Regla_Prioritaria..."
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Prioridad de Ejecución (>= 0)"
          type="number"
          step="1"
          min="0"
          placeholder="Ej: 10"
          helperText="Mayor número indica mayor prioridad en resolución de conflictos."
          error={errors.prioridad?.message}
          required
          {...register('prioridad')}
        />

        <Input
          label="Factor de Certeza (0.00 a 1.00)"
          type="number"
          step="0.05"
          min="0"
          max="1"
          placeholder="Ej: 0.90"
          helperText="Grado de certeza o confianza en la deducción (1.0 = certeza total)."
          error={errors.factor_certeza?.message}
          required
          {...register('factor_certeza')}
        />
      </div>

      <Textarea
        label="Descripción o Justificación Teórica"
        placeholder="Explica la lógica del antecedente y consecuente para tus estudiantes..."
        rows={3}
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="activa"
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          {...register('activa')}
        />
        <label htmlFor="activa" className="text-sm font-medium text-slate-700 cursor-pointer">
          Regla activa (se evaluará durante la inferencia)
        </label>
      </div>

      <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="outline" size="md" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" loading={loading}>
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default ReglaForm;
