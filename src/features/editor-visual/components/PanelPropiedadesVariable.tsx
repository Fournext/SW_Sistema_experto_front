import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import type { FlowNode } from '../types/types';

const variablePropsSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO']),
  valor_por_defecto: z.string(),
  descripcion: z.string().optional().or(z.literal('')),
});

type VariablePropsForm = z.infer<typeof variablePropsSchema>;

export interface PanelPropiedadesVariableProps {
  nodo: FlowNode;
  onGuardar: (datos: VariablePropsForm) => void;
  loading?: boolean;
}

export const PanelPropiedadesVariable: React.FC<PanelPropiedadesVariableProps> = ({
  nodo,
  onGuardar,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<VariablePropsForm>({
    resolver: zodResolver(variablePropsSchema),
    defaultValues: {
      nombre: String(nodo.data.nombre || ''),
      tipo: (nodo.data.tipo as 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO') || 'TEXTO',
      valor_por_defecto: String(nodo.data.valor_por_defecto ?? nodo.data.valor_defecto ?? ''),
      descripcion: String(nodo.data.descripcion || ''),
    },
  });

  useEffect(() => {
    reset({
      nombre: String(nodo.data.nombre || ''),
      tipo: (nodo.data.tipo as 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO') || 'TEXTO',
      valor_por_defecto: String(nodo.data.valor_por_defecto ?? nodo.data.valor_defecto ?? ''),
      descripcion: String(nodo.data.descripcion || ''),
    });
  }, [nodo, reset]);
  const tipo = watch('tipo');

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-3.5 text-left">
      <Input
        label="Nombre de Variable"
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <Select
        label="Tipo"
        options={[
          { value: 'TEXTO', label: 'Texto' },
          { value: 'ENTERO', label: 'Entero' },
          { value: 'DECIMAL', label: 'Decimal' },
          { value: 'BOOLEANO', label: 'Booleano' },
        ]}
        error={errors.tipo?.message}
        required
        {...register('tipo')}
      />

      {tipo === 'BOOLEANO' ? (
        <Select
          label="Valor inicial (opcional)"
          options={[
            { value: '', label: 'Sin valor inicial' },
            { value: 'true', label: 'Verdadero (True)' },
            { value: 'false', label: 'Falso (False)' },
          ]}
          {...register('valor_por_defecto')}
        />
      ) : (
        <Input
          label="Valor inicial (opcional)"
          placeholder="Sin valor inicial"
          type={tipo === 'ENTERO' || tipo === 'DECIMAL' ? 'number' : 'text'}
          step={tipo === 'ENTERO' ? '1' : tipo === 'DECIMAL' ? 'any' : undefined}
          {...register('valor_por_defecto')}
        />
      )}

      <Textarea
        label="Descripción"
        rows={2}
        error={errors.descripcion?.message}
        {...register('descripcion')}
      />

      <div className="pt-3">
        <Button type="submit" variant="primary" size="sm" className="w-full" loading={loading}>
          Aplicar Cambios al Nodo
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesVariable;
