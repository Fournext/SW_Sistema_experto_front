import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import type { FlowNode } from '../types/types';

const hechoPropsSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  valor: z.string().min(1, 'El valor es obligatorio'),
  tipo_dato: z.enum(['TEXTO', 'ENTERO', 'DECIMAL', 'BOOLEANO']),
  es_inicial: z.boolean(),
});

type HechoPropsForm = z.infer<typeof hechoPropsSchema>;

export interface PanelPropiedadesHechoProps {
  nodo: FlowNode;
  onGuardar: (datos: HechoPropsForm) => void;
  loading?: boolean;
}

export const PanelPropiedadesHecho: React.FC<PanelPropiedadesHechoProps> = ({
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
  } = useForm<HechoPropsForm>({
    resolver: zodResolver(hechoPropsSchema),
    defaultValues: {
      nombre: String(nodo.data.nombre || ''),
      valor: String(nodo.data.valor || ''),
      tipo_dato: (nodo.data.tipo_dato as 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO') || 'TEXTO',
      es_inicial: nodo.data.es_inicial !== false,
    },
  });

  useEffect(() => {
    reset({
      nombre: String(nodo.data.nombre || ''),
      valor: String(nodo.data.valor || ''),
      tipo_dato: (nodo.data.tipo_dato as 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO') || 'TEXTO',
      es_inicial: nodo.data.es_inicial !== false,
    });
  }, [nodo, reset]);

  const tipoDato = watch('tipo_dato');

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-3.5 text-left">
      <Input
        label="Nombre del Hecho"
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <Select
        label="Tipo de Dato"
        options={[
          { value: 'TEXTO', label: 'Texto' },
          { value: 'ENTERO', label: 'Entero' },
          { value: 'DECIMAL', label: 'Decimal' },
          { value: 'BOOLEANO', label: 'Booleano' },
        ]}
        error={errors.tipo_dato?.message}
        required
        {...register('tipo_dato')}
      />

      {tipoDato === 'BOOLEANO' ? (
        <Select
          label="Valor Asignado"
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
          label="Valor Asignado"
          type={tipoDato === 'ENTERO' || tipoDato === 'DECIMAL' ? 'number' : 'text'}
          step={tipoDato === 'ENTERO' ? '1' : tipoDato === 'DECIMAL' ? 'any' : undefined}
          error={errors.valor?.message}
          required
          {...register('valor')}
        />
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="hecho_es_inicial"
          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
          {...register('es_inicial')}
        />
        <label htmlFor="hecho_es_inicial" className="text-xs font-medium text-slate-700 cursor-pointer">
          Es hecho inicial de entrada
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

export default PanelPropiedadesHecho;
