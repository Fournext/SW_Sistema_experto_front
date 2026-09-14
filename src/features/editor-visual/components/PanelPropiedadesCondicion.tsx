import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import type { FlowNode } from '../types/types';

const condicionPropsSchema = z.object({
  referencia: z.string().min(1, 'La referencia es obligatoria'),
  operador: z.enum(['==', '!=', '>', '<', '>=', '<=']),
  valor_esperado: z.string().min(1, 'El valor esperado es obligatorio'),
  orden: z.coerce.number().min(1, 'Orden >= 1'),
});

type CondicionPropsForm = z.infer<typeof condicionPropsSchema>;

export interface PanelPropiedadesCondicionProps {
  nodo: FlowNode;
  onGuardar: (datos: CondicionPropsForm) => void;
  loading?: boolean;
}

export const PanelPropiedadesCondicion: React.FC<PanelPropiedadesCondicionProps> = ({
  nodo,
  onGuardar,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CondicionPropsForm>({
    resolver: zodResolver(condicionPropsSchema),
    defaultValues: {
      referencia: String(nodo.data.referencia || ''),
      operador: (nodo.data.operador as '==' | '!=' | '>' | '<' | '>=' | '<=') || '==',
      valor_esperado: String(nodo.data.valor_esperado || ''),
      orden: Number(nodo.data.orden ?? 1),
    },
  });

  useEffect(() => {
    reset({
      referencia: String(nodo.data.referencia || ''),
      operador: (nodo.data.operador as '==' | '!=' | '>' | '<' | '>=' | '<=') || '==',
      valor_esperado: String(nodo.data.valor_esperado || ''),
      orden: Number(nodo.data.orden ?? 1),
    });
  }, [nodo, reset]);

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-3.5 text-left">
      <Input
        label="Referencia / Variable"
        error={errors.referencia?.message}
        required
        {...register('referencia')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Operador"
          options={[
            { value: '==', label: '==' },
            { value: '!=', label: '!=' },
            { value: '>', label: '>' },
            { value: '<', label: '<' },
            { value: '>=', label: '>=' },
            { value: '<=', label: '<=' },
          ]}
          error={errors.operador?.message}
          required
          {...register('operador')}
        />

        <Input
          label="Valor Esperado"
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

      <div className="pt-3">
        <Button type="submit" variant="primary" size="sm" className="w-full" loading={loading}>
          Aplicar Cambios al Nodo
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesCondicion;
