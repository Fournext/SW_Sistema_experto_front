import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { FlowNode } from '../types/types';

const conclusionPropsSchema = z.object({
  destino: z.string().min(1, 'El destino es obligatorio'),
  valor_resultante: z.string().min(1, 'El valor resultante es obligatorio'),
});

type ConclusionPropsForm = z.infer<typeof conclusionPropsSchema>;

export interface PanelPropiedadesConclusionProps {
  nodo: FlowNode;
  onGuardar: (datos: ConclusionPropsForm) => void;
  loading?: boolean;
}

export const PanelPropiedadesConclusion: React.FC<PanelPropiedadesConclusionProps> = ({
  nodo,
  onGuardar,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConclusionPropsForm>({
    resolver: zodResolver(conclusionPropsSchema),
    defaultValues: {
      destino: String(nodo.data.destino || ''),
      valor_resultante: String(nodo.data.valor_resultante || ''),
    },
  });

  useEffect(() => {
    reset({
      destino: String(nodo.data.destino || ''),
      valor_resultante: String(nodo.data.valor_resultante || ''),
    });
  }, [nodo, reset]);

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-3.5 text-left">
      <Input
        label="Variable o Hecho Consecuente"
        error={errors.destino?.message}
        required
        {...register('destino')}
      />

      <Input
        label="Valor Resultante"
        error={errors.valor_resultante?.message}
        required
        {...register('valor_resultante')}
      />

      <div className="pt-3">
        <Button type="submit" variant="primary" size="sm" className="w-full" loading={loading}>
          Aplicar Cambios al Nodo
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesConclusion;
