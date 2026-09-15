import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { variableSchema, type VariableFormData } from '../schemas/schemas';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export interface VariableFormProps {
  initialValues?: Partial<VariableFormData>;
  onSubmit: (data: VariableFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
  submitText?: string;
}

export const VariableForm: React.FC<VariableFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
  submitText = 'Guardar Variable',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VariableFormData>({
    resolver: zodResolver(variableSchema),
    defaultValues: {
      nombre: initialValues?.nombre || '',
      tipo: initialValues?.tipo || 'TEXTO',
      descripcion: initialValues?.descripcion || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
      <Input
        label="Nombre de la Variable"
        placeholder="Ej: presion, velocidad, edad, nivel_riesgo..."
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <Select
        label="Tipo de Variable"
        options={[
          { value: 'TEXTO', label: 'Texto (Cualitativo / Categórico)' },
          { value: 'ENTERO', label: 'Entero (Integer)' },
          { value: 'DECIMAL', label: 'Decimal (Float / Real)' },
          { value: 'BOOLEANO', label: 'Booleano (Verdadero / Falso)' },
        ]}
        error={errors.tipo?.message}
        required
        {...register('tipo')}
      />

      <Textarea
        label="Descripción pedagógica"
        placeholder="Explica qué representa esta variable y cuál es su rango semántico en el problema..."
        rows={3}
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />

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

export default VariableForm;
