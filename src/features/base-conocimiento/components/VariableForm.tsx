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
    watch,
    formState: { errors },
  } = useForm<VariableFormData>({
    resolver: zodResolver(variableSchema),
    defaultValues: {
      nombre: initialValues?.nombre || '',
      tipo: initialValues?.tipo || 'TEXTO',
      valor_por_defecto: initialValues?.valor_por_defecto ?? '',
      pregunta: initialValues?.pregunta || '',
      es_inicial: initialValues?.es_inicial ?? false,
      descripcion: initialValues?.descripcion || '',
    },
  });

  const esInicial = watch('es_inicial');
  const tipo = watch('tipo');

  const handleFormSubmit = (data: VariableFormData) => {
    if (!data.es_inicial) {
      data.pregunta = '';
    }
    return onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4 text-left">
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
          { value: 'OPCION', label: 'Opción (Selección cualitativa)' },
          { value: 'ENTERO', label: 'Entero (Integer)' },
          { value: 'DECIMAL', label: 'Decimal (Float / Real)' },
          { value: 'BOOLEANO', label: 'Booleano (Verdadero / Falso)' },
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
          error={errors.valor_por_defecto?.message}
          {...register('valor_por_defecto')}
        />
      ) : (
        <Input
          label="Valor inicial (opcional)"
          placeholder="Sin valor inicial"
          type={tipo === 'ENTERO' || tipo === 'DECIMAL' ? 'number' : 'text'}
          step={tipo === 'ENTERO' ? '1' : tipo === 'DECIMAL' ? 'any' : undefined}
          error={errors.valor_por_defecto?.message}
          {...register('valor_por_defecto')}
        />
      )}

      <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="var_es_inicial"
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            {...register('es_inicial')}
          />
          <label htmlFor="var_es_inicial" className="text-sm font-semibold text-slate-800 cursor-pointer">
            Es una variable inicial (solicitada al usuario o caso de estudio)
          </label>
        </div>

        {esInicial && (
          <div className="pt-2 border-t border-slate-200/70 animate-fadeIn">
            <Input
              label="Pregunta para el Usuario (Opcional)"
              placeholder="Ej: ¿Cuál es el nivel de presión?, ¿Qué edad tiene el paciente?..."
              helperText="Pregunta que se le presentará al usuario para solicitar este valor durante la consulta experta."
              error={errors.pregunta?.message}
              {...register('pregunta')}
            />
          </div>
        )}
      </div>

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
