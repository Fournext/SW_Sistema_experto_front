import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { condicionSchema, type CondicionFormData } from '../schemas/schemas';
import type { Variable, Hecho } from '../types/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface CondicionFormProps {
  onSubmit: (data: CondicionFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
  variables?: Variable[];
  hechos?: Hecho[];
}

export const CondicionForm: React.FC<CondicionFormProps> = ({
  onSubmit,
  loading = false,
  onCancel,
  variables,
  hechos,
}) => {
  const options = useMemo(() => {
    return [
      ...(variables || []).map((v) => ({
        value: v.nombre,
        label: `Variable: ${v.nombre} (${(v.tipo || v.tipo_dato || 'TEXTO').toUpperCase()})`,
      })),
      ...(hechos || []).map((h) => ({
        value: h.nombre,
        label: `Hecho Inicial: ${h.nombre} (${(h.tipo_dato || 'TEXTO').toUpperCase()})`,
      })),
    ];
  }, [variables, hechos]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CondicionFormData>({
    resolver: zodResolver(condicionSchema),
    defaultValues: {
      referencia: options[0]?.value || '',
      operador: '==',
      valor_esperado: '',
      orden: 1,
    },
  });

  const selectedReferencia = watch('referencia');
  const valorActual = watch('valor_esperado');
  const operadorActual = watch('operador');

  const tipoDato = useMemo(() => {
    if (!selectedReferencia) return 'TEXTO';
    const v = variables?.find((item) => item.nombre === selectedReferencia);
    if (v) return (v.tipo || v.tipo_dato || 'TEXTO').toUpperCase();
    const h = hechos?.find((item) => item.nombre === selectedReferencia);
    if (h) return (h.tipo_dato || 'TEXTO').toUpperCase();
    return 'TEXTO';
  }, [selectedReferencia, variables, hechos]);

  // Si cambia a booleano, asegurar operador '==' o '!=' y valor 'true' o 'false'
  useEffect(() => {
    if (tipoDato === 'BOOLEANO') {
      if (operadorActual !== '==' && operadorActual !== '!=') {
        setValue('operador', '==');
      }
      if (valorActual !== 'true' && valorActual !== 'false') {
        setValue('valor_esperado', 'true', { shouldValidate: true });
      }
    }
  }, [tipoDato, operadorActual, valorActual, setValue]);

  const onFormSubmit = (data: CondicionFormData) => {
    const val = data.valor_esperado.trim();
    if (tipoDato === 'BOOLEANO') {
      const lower = val.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        setError('valor_esperado', {
          message: 'El valor esperado debe ser "true" o "false" para una condición booleana',
        });
        return;
      }
    } else if (tipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(val)) {
        setError('valor_esperado', {
          message: 'El valor esperado debe ser un número entero válido (sin decimales ni letras)',
        });
        return;
      }
    } else if (tipoDato === 'DECIMAL') {
      if (isNaN(Number(val)) || !/^-?\d+(\.\d+)?$/.test(val)) {
        setError('valor_esperado', {
          message: 'El valor esperado debe ser un número decimal válido (ej: 38.5)',
        });
        return;
      }
    }

    onSubmit({
      ...data,
      valor_esperado: tipoDato === 'BOOLEANO' ? (val.toLowerCase() === 'false' ? 'false' : 'true') : val,
    });
  };

  const opcionesOperadores = useMemo(() => {
    if (tipoDato === 'BOOLEANO') {
      return [
        { value: '==', label: '== (Igual a)' },
        { value: '!=', label: '!= (Diferente de)' },
      ];
    }
    return [
      { value: '==', label: '== (Igual a)' },
      { value: '!=', label: '!= (Diferente de)' },
      { value: '>', label: '> (Mayor que)' },
      { value: '<', label: '< (Menor que)' },
      { value: '>=', label: '>= (Mayor o igual que)' },
      { value: '<=', label: '<= (Menor o igual que)' },
    ];
  }, [tipoDato]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left">
      {options.length > 0 ? (
        <Select
          label="Variable o Hecho a Comparar"
          options={options}
          error={errors.referencia?.message}
          required
          {...register('referencia', {
            onChange: () => {
              clearErrors('valor_esperado');
            },
          })}
        />
      ) : (
        <Input
          label="Variable o Hecho a Comparar"
          placeholder="Ej: temperatura, presion, edad..."
          error={errors.referencia?.message}
          required
          {...register('referencia')}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Select
          label="Operador"
          options={opcionesOperadores}
          error={errors.operador?.message}
          required
          {...register('operador')}
        />

        {/* Campo adaptativo para el Valor Esperado */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Valor Esperado *
            </label>
            {selectedReferencia && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono border border-amber-200">
                Tipo: {tipoDato}
              </span>
            )}
          </div>

          {tipoDato === 'BOOLEANO' ? (
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('valor_esperado', 'true', { shouldValidate: true });
                    clearErrors('valor_esperado');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    valorActual !== 'false'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  true (Verdadero)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('valor_esperado', 'false', { shouldValidate: true });
                    clearErrors('valor_esperado');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    valorActual === 'false'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  false (Falso)
                </button>
              </div>
              <input type="hidden" {...register('valor_esperado')} />
            </div>
          ) : (
            <Input
              type={tipoDato === 'ENTERO' || tipoDato === 'DECIMAL' ? 'number' : 'text'}
              step={tipoDato === 'ENTERO' ? '1' : tipoDato === 'DECIMAL' ? 'any' : undefined}
              placeholder={
                tipoDato === 'ENTERO'
                  ? 'Ej: 38, 100'
                  : tipoDato === 'DECIMAL'
                  ? 'Ej: 38.5, 0.5'
                  : 'Ej: alta, normal...'
              }
              error={errors.valor_esperado?.message}
              required
              {...register('valor_esperado')}
            />
          )}
        </div>
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
