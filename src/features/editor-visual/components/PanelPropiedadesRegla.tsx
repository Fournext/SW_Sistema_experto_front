import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import type { FlowNode } from '../types/types';

const reglaPropsSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().or(z.literal('')),
  prioridad: z.coerce.number().min(0, 'Prioridad >= 0'),
  factor_certeza: z.coerce.number().min(0).max(1, 'Entre 0.0 y 1.0'),
  activa: z.boolean(),
});

type ReglaPropsForm = z.infer<typeof reglaPropsSchema>;

export interface PanelPropiedadesReglaProps {
  nodo: FlowNode;
  onGuardar: (datos: ReglaPropsForm) => void;
  loading?: boolean;
}

export const PanelPropiedadesRegla: React.FC<PanelPropiedadesReglaProps> = ({
  nodo,
  onGuardar,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReglaPropsForm>({
    resolver: zodResolver(reglaPropsSchema),
    defaultValues: {
      nombre: String(nodo.data.nombre || ''),
      descripcion: String(nodo.data.descripcion || ''),
      prioridad: Number(nodo.data.prioridad ?? 10),
      factor_certeza: Number(nodo.data.factor_certeza ?? 1.0),
      activa: nodo.data.activa !== false,
    },
  });

  useEffect(() => {
    reset({
      nombre: String(nodo.data.nombre || ''),
      descripcion: String(nodo.data.descripcion || ''),
      prioridad: Number(nodo.data.prioridad ?? 10),
      factor_certeza: Number(nodo.data.factor_certeza ?? 1.0),
      activa: nodo.data.activa !== false,
    });
  }, [nodo, reset]);

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-3.5 text-left">
      <Input
        label="Nombre / Código de la Regla"
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prioridad"
          type="number"
          min="0"
          error={errors.prioridad?.message}
          required
          {...register('prioridad')}
        />

        <Input
          label="Factor Certeza"
          type="number"
          step="0.05"
          min="0"
          max="1"
          error={errors.factor_certeza?.message}
          required
          {...register('factor_certeza')}
        />
      </div>

      <Textarea
        label="Descripción"
        rows={2}
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="regla_activa"
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          {...register('activa')}
        />
        <label htmlFor="regla_activa" className="text-xs font-medium text-slate-700 cursor-pointer">
          Regla habilitada / activa
        </label>
      </div>

      <div className="pt-3">
        <Button type="submit" variant="primary" size="sm" className="w-full" loading={loading}>
          Aplicar Cambios al Nodo
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesRegla;
