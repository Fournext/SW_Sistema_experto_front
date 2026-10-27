import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, ListFilter } from 'lucide-react';
import { hechoSchema, type HechoFormData } from '../schemas/schemas';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface HechoFormProps {
  initialValues?: Partial<HechoFormData>;
  onSubmit: (data: HechoFormData) => Promise<void> | void;
  loading?: boolean;
  onCancel?: () => void;
  submitText?: string;
}

export const HechoForm: React.FC<HechoFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
  submitText = 'Guardar Hecho',
}) => {
  const [nuevaOpcion, setNuevaOpcion] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HechoFormData>({
    resolver: zodResolver(hechoSchema),
    defaultValues: {
      nombre: initialValues?.nombre || '',
      valor: initialValues?.valor || '',
      tipo_dato: initialValues?.tipo_dato || 'TEXTO',
      opciones: initialValues?.opciones || [],
      pregunta: initialValues?.pregunta || '',
      es_inicial: initialValues?.es_inicial ?? true,
    },
  });

  const tipoDatoSeleccionado = watch('tipo_dato');
  const opcionesActuales = watch('opciones') || [];
  const valorActual = watch('valor') || '';
  const esInicial = watch('es_inicial');

  const handleFormSubmit = (data: HechoFormData) => {
    if (!data.es_inicial) {
      data.pregunta = '';
    }
    return onSubmit(data);
  };

  const handleAgregarOpcion = () => {
    const texto = nuevaOpcion.trim();
    if (!texto) return;

    // Soporte para separar por comas si el usuario pega o escribe varias
    const fragmentos = texto
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const actualizadas = [...opcionesActuales];
    for (const frag of fragmentos) {
      if (!actualizadas.includes(frag)) {
        actualizadas.push(frag);
      }
    }

    setValue('opciones', actualizadas, { shouldValidate: true });
    setNuevaOpcion('');

  };

  const handleEliminarOpcion = (opcionAEliminar: string) => {
    const actualizadas = opcionesActuales.filter((o) => o !== opcionAEliminar);
    setValue('opciones', actualizadas, { shouldValidate: true });

    if (valorActual === opcionAEliminar) {
      setValue('valor', '', { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4 text-left">
      <Input
        label="Nombre del Hecho / Proposición"
        placeholder="Ej: temperatura, tiene_fiebre, presion_arterial, severidad..."
        error={errors.nombre?.message}
        required
        {...register('nombre')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo de Dato"
          options={[
            { value: 'TEXTO', label: 'Texto (Cualitativo libre)' },
            { value: 'OPCION', label: 'Opción (Selección cualitativa)' },
            { value: 'ENTERO', label: 'Entero (Número entero)' },
            { value: 'DECIMAL', label: 'Decimal (Número real)' },
            { value: 'BOOLEANO', label: 'Booleano (Verdadero / Falso)' },
          ]}
          error={errors.tipo_dato?.message}
          required
          {...register('tipo_dato')}
        />

        {tipoDatoSeleccionado === 'BOOLEANO' ? (
          <Select
            label="Valor del Hecho"
            options={[
              { value: '', label: 'Sin valor inicial' },
              { value: 'true', label: 'Verdadero (True)' },
              { value: 'false', label: 'Falso (False)' },
            ]}
            error={errors.valor?.message}
            {...register('valor')}
          />
        ) : tipoDatoSeleccionado === 'OPCION' ? (
          <Select
            label="Valor del Hecho (Selección)"
            options={[
              { value: '', label: 'Sin valor inicial' },
              ...opcionesActuales.map((opc) => ({ value: opc, label: opc })),
            ]}
            error={errors.valor?.message}
            disabled={opcionesActuales.length === 0}
            {...register('valor')}
          />
        ) : (
          <Input
            label="Valor del Hecho"
            type={tipoDatoSeleccionado === 'ENTERO' || tipoDatoSeleccionado === 'DECIMAL' ? 'number' : 'text'}
            step={tipoDatoSeleccionado === 'ENTERO' ? '1' : tipoDatoSeleccionado === 'DECIMAL' ? 'any' : undefined}
            placeholder={
              tipoDatoSeleccionado === 'ENTERO'
                ? 'Ej: 38'
                : tipoDatoSeleccionado === 'DECIMAL'
                ? 'Ej: 38.5'
                : 'Ej: alta, presente...'
            }
            error={errors.valor?.message}
            {...register('valor')}
          />
        )}
      </div>

      {tipoDatoSeleccionado === 'OPCION' && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
              Opciones Cualitativas Disponibles
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              {opcionesActuales.length} {opcionesActuales.length === 1 ? 'opción' : 'opciones'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevaOpcion}
              onChange={(e) => setNuevaOpcion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAgregarOpcion();
                }
              }}
              placeholder="Escribe una opción (o varias separadas por coma, ej: leve, moderado, severo)"
              className="flex-1 text-xs sm:text-sm bg-white rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAgregarOpcion}
              disabled={!nuevaOpcion.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>

          {errors.opciones?.message && (
            <p className="text-xs text-rose-600 font-medium">{errors.opciones.message}</p>
          )}

          {opcionesActuales.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {opcionesActuales.map((opc) => {
                const esSeleccionada = valorActual === opc;
                return (
                  <span
                    key={opc}
                    className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      esSeleccionada
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold ring-1 ring-indigo-400'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{opc}</span>
                    {esSeleccionada && (
                      <span className="text-[10px] bg-indigo-600 text-white rounded-full px-1.5 py-0.2">
                        activo
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEliminarOpcion(opc)}
                      className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={`Eliminar opción "${opc}"`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Aún no has agregado opciones. Escribe al menos una arriba para habilitar la selección del valor.
            </p>
          )}
        </div>
      )}

      <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="es_inicial"
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            {...register('es_inicial')}
          />
          <label htmlFor="es_inicial" className="text-sm font-semibold text-slate-800 cursor-pointer">
            Es un hecho inicial (ingresado por el usuario o caso de estudio)
          </label>
        </div>

        {esInicial && (
          <div className="pt-2 border-t border-slate-200/70 animate-fadeIn">
            <Input
              label="Pregunta para el Usuario (Opcional)"
              placeholder="Ej: ¿El paciente presenta fiebre?, ¿Cuál es el tamaño del equipo?..."
              helperText="Pregunta que se le presentará al usuario para solicitar este valor durante la consulta experta."
              error={errors.pregunta?.message}
              {...register('pregunta')}
            />
          </div>
        )}
      </div>

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

export default HechoForm;
