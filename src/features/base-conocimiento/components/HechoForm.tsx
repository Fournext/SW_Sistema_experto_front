import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hechoSchema, type HechoFormData } from '../schemas/schemas';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface HechoFormProps {
  initialValues?: Partial<HechoFormData>;
  onSubmit: (data: HechoFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
  submitText?: string;
}

export const HechoForm: React.FC<HechoFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
  submitText = 'Guardar Hecho',
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HechoFormData>({
    resolver: zodResolver(hechoSchema),
    defaultValues: {
      nombre: initialValues?.nombre || '',
      valor: initialValues?.valor || '',
      tipo_dato: initialValues?.tipo_dato || 'TEXTO',
      es_inicial: initialValues?.es_inicial ?? true,
    },
  });

  const tipoDatoSeleccionado = watch('tipo_dato');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
      <Input
        label="Nombre del Hecho / Proposición"
        placeholder="Ej: temperatura, tiene_fiebre, presion_arterial..."
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo de Dato"
          options={[
            { value: 'TEXTO', label: 'Texto (Cualitativo)' },
            { value: 'ENTERO', label: 'Entero (Número entero)' },
            { value: 'DECIMAL', label: 'Decimal (Número real)' },
            { value: 'BOOLEANO', label: 'Booleano (Verdadero / Falso)' },
          ]}
          error={errors.tipo_dato?.message}
          required
          {...register('tipo_dato')}
        />

        {tipoDatoSeleccionado === 'BOOLEANO' ? (
          <Select
            label="Valor del Hecho"
            options={[
              { value: 'true', label: 'Verdadero (True)' },
              { value: 'false', label: 'Falso (False)' },
            ]}
            error={errors.valor?.message}
            required
            {...register('valor')}
          />
        ) : (
          <Input
            label="Valor del Hecho"
            type={tipoDatoSeleccionado === 'ENTERO' || tipoDatoSeleccionado === 'DECIMAL' ? 'number' : 'text'}
            step={tipoDatoSeleccionado === 'ENTERO' ? '1' : tipoDatoSeleccionado === 'DECIMAL' ? 'any' : undefined}
            placeholder={
              tipoDatoSeleccionado === 'ENTERO'
                ? 'Ej: 38'
                : tipoDatoSeleccionado === 'DECIMAL'
                ? 'Ej: 38.5'
                : 'Ej: alta, presente...'
            }
            error={errors.valor?.message}
            required
            {...register('valor')}
          />
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="es_inicial"
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          {...register('es_inicial')}
        />
        <label htmlFor="es_inicial" className="text-sm font-medium text-slate-700 cursor-pointer">
          Es un hecho inicial (ingresado por el usuario o caso de estudio)
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

export default HechoForm;
