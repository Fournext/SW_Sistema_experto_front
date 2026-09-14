import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { conclusionSchema, type ConclusionFormData } from '../schemas/schemas';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface ConclusionFormProps {
  onSubmit: (data: ConclusionFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
}

export const ConclusionForm: React.FC<ConclusionFormProps> = ({
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConclusionFormData>({
    resolver: zodResolver(conclusionSchema),
    defaultValues: {
      destino: '',
      valor_resultante: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-left">
      <Input
        label="Variable o Hecho Consecuente"
        placeholder="Ej: diagnostico, tratamiento, categoria_riesgo..."
        error={errors.destino?.message}
        required
        {...register('destino')}
      />

      <Input
        label="Valor Resultante / Deducción"
        placeholder="Ej: Infección viral, Requiere aislamiento, Alto..."
        error={errors.valor_resultante?.message}
        required
        {...register('valor_resultante')}
      />

      <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          Agregar Conclusión (THEN)
        </Button>
      </div>
    </form>
  );
};

export default ConclusionForm;
