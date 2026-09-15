import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { conclusionSchema, type ConclusionFormData } from '../schemas/schemas';
import type { Variable, Hecho } from '../types/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface ConclusionFormProps {
  onSubmit: (data: ConclusionFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
  variables?: Variable[];
  hechos?: Hecho[];
}

export const ConclusionForm: React.FC<ConclusionFormProps> = ({
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
        label: `Hecho: ${h.nombre} (${(h.tipo_dato || 'TEXTO').toUpperCase()})`,
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
  } = useForm<ConclusionFormData>({
    resolver: zodResolver(conclusionSchema),
    defaultValues: {
      destino: options[0]?.value || '',
      valor_resultante: '',
    },
  });

  const selectedDestino = watch('destino');
  const valorActual = watch('valor_resultante');

  const tipoDato = useMemo(() => {
    if (!selectedDestino) return 'TEXTO';
    const v = variables?.find((item) => item.nombre === selectedDestino);
    if (v) return (v.tipo || v.tipo_dato || 'TEXTO').toUpperCase();
    const h = hechos?.find((item) => item.nombre === selectedDestino);
    if (h) return (h.tipo_dato || 'TEXTO').toUpperCase();
    return 'TEXTO';
  }, [selectedDestino, variables, hechos]);

  // Si el tipo es booleano, inicializar el valor resultante en 'true' si no es válido
  useEffect(() => {
    if (tipoDato === 'BOOLEANO') {
      if (valorActual !== 'true' && valorActual !== 'false') {
        setValue('valor_resultante', 'true', { shouldValidate: true });
      }
    }
  }, [tipoDato, valorActual, setValue]);

  const onFormSubmit = (data: ConclusionFormData) => {
    const val = data.valor_resultante.trim();
    if (tipoDato === 'BOOLEANO') {
      const lower = val.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        setError('valor_resultante', {
          message: 'El valor debe ser "true" o "false" para un consecuente booleano',
        });
        return;
      }
    } else if (tipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(val)) {
        setError('valor_resultante', {
          message: 'El valor debe ser un número entero válido (sin decimales ni letras)',
        });
        return;
      }
    } else if (tipoDato === 'DECIMAL') {
      if (isNaN(Number(val)) || !/^-?\d+(\.\d+)?$/.test(val)) {
        setError('valor_resultante', {
          message: 'El valor debe ser un número decimal válido (ej: 12.5)',
        });
        return;
      }
    }

    onSubmit({
      ...data,
      valor_resultante: tipoDato === 'BOOLEANO' ? (val.toLowerCase() === 'false' ? 'false' : 'true') : val,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left">
      {options.length > 0 ? (
        <Select
          label="Variable o Hecho Consecuente"
          options={options}
          error={errors.destino?.message}
          required
          {...register('destino', {
            onChange: () => {
              clearErrors('valor_resultante');
            },
          })}
        />
      ) : (
        <Input
          label="Variable o Hecho Consecuente"
          placeholder="Ej: diagnostico, tratamiento, categoria_riesgo..."
          error={errors.destino?.message}
          required
          {...register('destino')}
        />
      )}

      {/* Campo adaptativo para el Valor Resultante */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Valor Resultante / Deducción *
          </label>
          {selectedDestino && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono border border-purple-200">
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
                  setValue('valor_resultante', 'true', { shouldValidate: true });
                  clearErrors('valor_resultante');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  valorActual !== 'false'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                true (Verdadero)
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('valor_resultante', 'false', { shouldValidate: true });
                  clearErrors('valor_resultante');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  valorActual === 'false'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                false (Falso)
              </button>
            </div>
            <input type="hidden" {...register('valor_resultante')} />
          </div>
        ) : (
          <Input
            type={tipoDato === 'ENTERO' || tipoDato === 'DECIMAL' ? 'number' : 'text'}
            step={tipoDato === 'ENTERO' ? '1' : tipoDato === 'DECIMAL' ? 'any' : undefined}
            placeholder={
              tipoDato === 'ENTERO'
                ? 'Ej: 10, 0, -5'
                : tipoDato === 'DECIMAL'
                ? 'Ej: 12.5, 0.75'
                : 'Ej: Infección viral, Requiere aislamiento, Alto...'
            }
            error={errors.valor_resultante?.message}
            required
            {...register('valor_resultante')}
          />
        )}

        <p className="text-[11px] text-slate-500 mt-1">
          {tipoDato === 'BOOLEANO' && 'Selecciona el estado booleano deducido por la regla.'}
          {tipoDato === 'ENTERO' && 'Solo se permiten números enteros sin decimales.'}
          {tipoDato === 'DECIMAL' && 'Ingresa un número decimal o entero.'}
          {tipoDato === 'TEXTO' && 'Ingresa el texto que deducirá la regla.'}
        </p>
      </div>

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
