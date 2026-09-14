import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { condicionSchema, type CondicionFormData } from '../schemas/schemas';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface CondicionFormProps {
  onSubmit: (data: CondicionFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
}

export const CondicionForm: React.FC<CondicionFormProps> = ({
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CondicionFormData>({
    resolver: zodResolver(condicionSchema),
    defaultValues: {
      referencia: '',
      operador: '==',
      valor_esperado: '',
      orden: 1,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-left">
      <Input
        label="Variable o Hecho a Comparar"
        placeholder="Ej: temperatura, presion, edad..."
        error={errors.referencia?.message}
        required
        {...register('referencia')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Operador"
          options={[
            { value: '==', label: '== (Igual a)' },
            { value: '!=', label: '!= (Diferente de)' },
            { value: '>', label: '> (Mayor que)' },
            { value: '<', label: '< (Menor que)' },
            { value: '>=', label: '>= (Mayor o igual que)' },
            { value: '<=', label: '<= (Menor o igual que)' },
          ]}
          error={errors.operador?.message}
          required
          {...register('operador')}
        />

        <Input
          label="Valor Esperado"
          placeholder="Ej: 38, alta, true..."
          error={errors.valor_esperado?.message}
          required
          {...register('valor_esperado')}
        />
      </div>

      <Input
        label="Orden de Evaluación"
        type="number"
        min="1"
        error={errors.orden?.message}
        required
        {...register('orden')}
      />

      <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          Agregar Condición (IF)
        </Button>
      </div>
    </form>
  );
};

export default CondicionForm;
