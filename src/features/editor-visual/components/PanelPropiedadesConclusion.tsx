import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Variable as VariableIcon, FileText } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import type { FlowNode, NodoDatosGenerales } from '../types/types';
import type { Hecho, Variable, Regla } from '@/features/base-conocimiento/types/types';

export interface PanelPropiedadesConclusionProps {
  nodo: FlowNode;
  onGuardar: (datos: Partial<NodoDatosGenerales>) => void;
  loading?: boolean;
  variables?: Variable[];
  hechos?: Hecho[];
  reglas?: Regla[];
}

export const PanelPropiedadesConclusion: React.FC<PanelPropiedadesConclusionProps> = ({
  nodo,
  onGuardar,
  loading = false,
  variables = [],
  hechos = [],
  reglas = [],
}) => {
  const isLocal = Boolean(nodo.data?.isLocal || String(nodo.data?.id).startsWith('local_'));

  const [tipoElemento, setTipoElemento] = useState<'VARIABLE' | 'HECHO'>('VARIABLE');
  const [elementoId, setElementoId] = useState<string>('');
  const [reglaId, setReglaId] = useState<string>('');
  const [valorResultante, setValorResultante] = useState<string>('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    const rawHechoId =
      nodo.data.hecho_resultante_id !== undefined && nodo.data.hecho_resultante_id !== null
        ? String(nodo.data.hecho_resultante_id)
        : '';
    const rawVarId =
      nodo.data.variable_resultante_id !== undefined && nodo.data.variable_resultante_id !== null
        ? String(nodo.data.variable_resultante_id)
        : '';

    let tipoInicial: 'VARIABLE' | 'HECHO' = 'VARIABLE';
    let idInicial = '';

    if (rawHechoId) {
      tipoInicial = 'HECHO';
      idInicial = rawHechoId;
    } else if (rawVarId) {
      tipoInicial = 'VARIABLE';
      idInicial = rawVarId;
    } else if (nodo.data.destino) {
      const matchHecho = hechos.find((h) => h.nombre.toLowerCase() === String(nodo.data.destino).toLowerCase());
      if (matchHecho) {
        tipoInicial = 'HECHO';
        idInicial = String(matchHecho.id);
      } else {
        const matchVar = variables.find((v) => v.nombre.toLowerCase() === String(nodo.data.destino).toLowerCase());
        if (matchVar) {
          tipoInicial = 'VARIABLE';
          idInicial = String(matchVar.id);
        }
      }
    } else {
      tipoInicial = variables.length > 0 ? 'VARIABLE' : hechos.length > 0 ? 'HECHO' : 'VARIABLE';
    }

    setTipoElemento(tipoInicial);
    setElementoId(idInicial);

    const rId = nodo.data.reglaId ? String(nodo.data.reglaId) : reglas[0] ? String(reglas[0].id) : '';
    setReglaId(rId);

    const valorActual = String(nodo.data.valor_resultante || '');

    // Identificar el tipo de dato inicial
    const elem =
      tipoInicial === 'VARIABLE'
        ? variables.find((v) => String(v.id) === idInicial)
        : hechos.find((h) => String(h.id) === idInicial);

    const tipoDatoElem = elem
      ? (tipoInicial === 'VARIABLE'
          ? (elem as Variable).tipo || (elem as Variable).tipo_dato || 'TEXTO'
          : (elem as Hecho).tipo_dato || 'TEXTO'
        ).toUpperCase()
      : 'TEXTO';

    if (tipoDatoElem === 'BOOLEANO') {
      const lower = valorActual.toLowerCase().trim();
      setValorResultante(lower === 'false' ? 'false' : 'true');
    } else {
      setValorResultante(valorActual);
    }

    setErrorValidacion(null);
  }, [nodo, variables, hechos, reglas]);

  // Obtener el elemento seleccionado y su tipo de dato
  const elementoSeleccionado =
    tipoElemento === 'VARIABLE'
      ? variables.find((v) => String(v.id) === elementoId)
      : hechos.find((h) => String(h.id) === elementoId);

  const tipoDato = elementoSeleccionado
    ? (
        tipoElemento === 'VARIABLE'
          ? (elementoSeleccionado as Variable).tipo || (elementoSeleccionado as Variable).tipo_dato || 'TEXTO'
          : (elementoSeleccionado as Hecho).tipo_dato || 'TEXTO'
      ).toUpperCase()
    : 'TEXTO';

  // Manejar cambio de elemento seleccionado
  const handleElementoChange = (nuevoId: string) => {
    setElementoId(nuevoId);
    setErrorValidacion(null);

    const elem =
      tipoElemento === 'VARIABLE'
        ? variables.find((v) => String(v.id) === nuevoId)
        : hechos.find((h) => String(h.id) === nuevoId);

    const nuevoTipoDato = elem
      ? (
          tipoElemento === 'VARIABLE'
            ? (elem as Variable).tipo || (elem as Variable).tipo_dato || 'TEXTO'
            : (elem as Hecho).tipo_dato || 'TEXTO'
        ).toUpperCase()
      : 'TEXTO';

    if (nuevoTipoDato === 'BOOLEANO') {
      const lower = valorResultante.toLowerCase().trim();
      setValorResultante(lower === 'false' ? 'false' : 'true');
    } else if (nuevoTipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(valorResultante.trim())) {
        setValorResultante('');
      }
    } else if (nuevoTipoDato === 'DECIMAL') {
      if (isNaN(Number(valorResultante.trim()))) {
        setValorResultante('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!reglaId && reglas.length > 0) {
      setErrorValidacion('Debes asignar esta conclusión a una regla.');
      return;
    }

    if (!elementoId) {
      setErrorValidacion(`Debes seleccionar una ${tipoElemento === 'VARIABLE' ? 'Variable' : 'Hecho'} como resultado.`);
      return;
    }

    const valorTrim = valorResultante.trim();
    if (!valorTrim) {
      setErrorValidacion('Debes ingresar un valor resultante.');
      return;
    }

    // Validación estricta según el tipo de dato
    if (tipoDato === 'BOOLEANO') {
      const lower = valorTrim.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        setErrorValidacion('El valor debe ser "true" o "false" para una variable de tipo Booleano.');
        return;
      }
    } else if (tipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(valorTrim)) {
        setErrorValidacion('El valor debe ser un número entero válido (sin decimales ni texto).');
        return;
      }
    } else if (tipoDato === 'DECIMAL') {
      if (isNaN(Number(valorTrim)) || !/^-?\d+(\.\d+)?$/.test(valorTrim)) {
        setErrorValidacion('El valor debe ser un número decimal válido (ej: 12.5).');
        return;
      }
    }

    const nombreDestino =
      tipoElemento === 'VARIABLE'
        ? variables.find((v) => String(v.id) === elementoId)?.nombre || ''
        : hechos.find((h) => String(h.id) === elementoId)?.nombre || '';

    onGuardar({
      reglaId: reglaId || undefined,
      tipoElemento,
      variable_resultante_id: tipoElemento === 'VARIABLE' ? elementoId : null,
      hecho_resultante_id: tipoElemento === 'HECHO' ? elementoId : null,
      destino: nombreDestino,
      valor_resultante: tipoDato === 'BOOLEANO' ? (valorTrim.toLowerCase() === 'false' ? 'false' : 'true') : valorTrim,
    });
  };

  const opcionesReglas = reglas.map((r) => ({
    value: String(r.id),
    label: `${r.nombre}${r.descripcion ? ` - ${r.descripcion}` : ''}`,
  }));

  const opcionesVariables = [
    { value: '', label: '-- Selecciona una Variable --' },
    ...variables.map((v) => ({
      value: String(v.id),
      label: `${v.nombre} (${(v.tipo || v.tipo_dato || 'TEXTO').toUpperCase()})`,
    })),
  ];

  const opcionesHechos = [
    { value: '', label: '-- Selecciona un Hecho --' },
    ...hechos.map((h) => ({
      value: String(h.id),
      label: `${h.nombre} (${(h.tipo_dato || 'TEXTO').toUpperCase()})`,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Alerta de vinculación pendiente */}
      {(isLocal || (!nodo.data.variable_resultante_id && !nodo.data.hecho_resultante_id)) && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-purple-900">
              {isLocal ? 'Conclusión visual pendiente' : 'Conclusión no vinculada'}
            </p>
            <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
              Para guardarla en la Base de Conocimiento, selecciona la <strong>Variable</strong> o <strong>Hecho</strong> resultante que deducirá esta regla.
            </p>
          </div>
        </div>
      )}

      {errorValidacion && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
          {errorValidacion}
        </div>
      )}

      {/* Selector de Regla */}
      {reglas.length > 0 && (
        <div>
          <Select
            label="Regla Asociada"
            options={opcionesReglas}
            value={reglaId}
            onChange={(e) => setReglaId(e.target.value)}
            required
          />
        </div>
      )}

      {/* Selector de Tipo: Variable vs Hecho */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Elemento Resultante
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipoElemento('VARIABLE');
              setElementoId('');
              setValorResultante('');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              tipoElemento === 'VARIABLE'
                ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-xs ring-1 ring-sky-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <VariableIcon className="w-3.5 h-3.5 text-sky-600" />
            Variable
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoElemento('HECHO');
              setElementoId('');
              setValorResultante('');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              tipoElemento === 'HECHO'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Hecho
          </button>
        </div>
      </div>

      {/* Select según el tipo */}
      {tipoElemento === 'VARIABLE' ? (
        <div>
          <Select
            label="Variable Consecuente"
            options={opcionesVariables}
            value={elementoId}
            onChange={(e) => handleElementoChange(e.target.value)}
            required
          />
          {variables.length === 0 && (
            <p className="text-[11px] text-purple-600 mt-1">
              No hay variables creadas aún. Puedes crear una desde la barra superior.
            </p>
          )}
        </div>
      ) : (
        <div>
          <Select
            label="Hecho Consecuente"
            options={opcionesHechos}
            value={elementoId}
            onChange={(e) => handleElementoChange(e.target.value)}
            required
          />
          {hechos.length === 0 && (
            <p className="text-[11px] text-purple-600 mt-1">
              No hay hechos creados aún. Puedes crear uno desde la barra superior.
            </p>
          )}
        </div>
      )}

      {/* Valor Resultante según el tipo de dato */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Valor Resultante *
          </label>
          {elementoSeleccionado && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono border border-purple-200">
              Tipo: {tipoDato}
            </span>
          )}
        </div>

        {tipoDato === 'BOOLEANO' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setValorResultante('true');
                setErrorValidacion(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                valorResultante !== 'false'
                  ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              true (Verdadero)
            </button>
            <button
              type="button"
              onClick={() => {
                setValorResultante('false');
                setErrorValidacion(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                valorResultante === 'false'
                  ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              false (Falso)
            </button>
          </div>
        ) : tipoDato === 'ENTERO' ? (
          <Input
            type="number"
            step="1"
            value={valorResultante}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^-?\d*$/.test(val)) {
                setValorResultante(val);
                setErrorValidacion(null);
              }
            }}
            placeholder="Ingresa un número entero (ej: 10, 0, -5)"
            required
          />
        ) : tipoDato === 'DECIMAL' ? (
          <Input
            type="number"
            step="any"
            value={valorResultante}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^-?\d*(\.\d*)?$/.test(val)) {
                setValorResultante(val);
                setErrorValidacion(null);
              }
            }}
            placeholder="Ingresa un número decimal (ej: 12.5, 0.75)"
            required
          />
        ) : (
          <Input
            type="text"
            value={valorResultante}
            onChange={(e) => {
              setValorResultante(e.target.value);
              setErrorValidacion(null);
            }}
            placeholder='Ej: "aprobado", "positivo", etc.'
            required
          />
        )}

        <p className="text-[11px] text-slate-500 mt-1">
          {tipoDato === 'BOOLEANO' && 'Selecciona el estado booleano resultante.'}
          {tipoDato === 'ENTERO' && 'Solo se permiten números enteros sin parte decimal.'}
          {tipoDato === 'DECIMAL' && 'Ingresa un valor numérico decimal o entero.'}
          {tipoDato === 'TEXTO' && 'Ingresa el texto que se asignará al deducir esta regla.'}
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full font-semibold shadow-xs"
          loading={loading}
          icon={<CheckCircle className="w-4 h-4" />}
        >
          {isLocal ? 'Guardar y Vincular Conclusión' : 'Aplicar Cambios al Nodo'}
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesConclusion;
