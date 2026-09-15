import React, { useState, useEffect } from 'react';
import { AlertCircle, GitBranch, Variable as VariableIcon, FileText } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import type { FlowNode, NodoDatosGenerales } from '../types/types';
import type { Hecho, Variable, Regla } from '@/features/base-conocimiento/types/types';

export interface PanelPropiedadesCondicionProps {
  nodo: FlowNode;
  onGuardar: (datos: Partial<NodoDatosGenerales>) => void;
  loading?: boolean;
  variables?: Variable[];
  hechos?: Hecho[];
  reglas?: Regla[];
}

export const PanelPropiedadesCondicion: React.FC<PanelPropiedadesCondicionProps> = ({
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
  const [operador, setOperador] = useState<string>('==');
  const [valorEsperado, setValorEsperado] = useState<string>('');
  const [orden, setOrden] = useState<number>(1);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Sincronizar estado con el nodo actual
  useEffect(() => {
    const rawHechoId = nodo.data.hecho_id !== undefined && nodo.data.hecho_id !== null ? String(nodo.data.hecho_id) : '';
    const rawVarId = nodo.data.variable_id !== undefined && nodo.data.variable_id !== null ? String(nodo.data.variable_id) : '';

    let tipoInicial: 'VARIABLE' | 'HECHO' = 'VARIABLE';
    let idInicial = '';

    if (rawHechoId) {
      tipoInicial = 'HECHO';
      idInicial = rawHechoId;
    } else if (rawVarId) {
      tipoInicial = 'VARIABLE';
      idInicial = rawVarId;
    } else if (nodo.data.referencia) {
      const matchHecho = hechos.find((h) => h.nombre.toLowerCase() === String(nodo.data.referencia).toLowerCase());
      if (matchHecho) {
        tipoInicial = 'HECHO';
        idInicial = String(matchHecho.id);
      } else {
        const matchVar = variables.find((v) => v.nombre.toLowerCase() === String(nodo.data.referencia).toLowerCase());
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

    setOperador(String(nodo.data.operador || '=='));

    const valActual = String(nodo.data.valor_esperado || '');
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
      const lower = valActual.toLowerCase().trim();
      setValorEsperado(lower === 'false' ? 'false' : 'true');
    } else {
      setValorEsperado(valActual);
    }

    setOrden(Number(nodo.data.orden ?? 1));
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
      const lower = valorEsperado.toLowerCase().trim();
      setValorEsperado(lower === 'false' ? 'false' : 'true');
    } else if (nuevoTipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(valorEsperado.trim())) {
        setValorEsperado('');
      }
    } else if (nuevoTipoDato === 'DECIMAL') {
      if (isNaN(Number(valorEsperado.trim()))) {
        setValorEsperado('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!reglaId && reglas.length > 0) {
      setErrorValidacion('Debes asignar esta condición a una regla.');
      return;
    }

    if (!elementoId) {
      setErrorValidacion(`Debes seleccionar una ${tipoElemento === 'VARIABLE' ? 'Variable' : 'Hecho'} para relacionar.`);
      return;
    }

    const valTrim = valorEsperado.trim();
    if (!valTrim) {
      setErrorValidacion('Debes ingresar un valor esperado.');
      return;
    }

    // Validación estricta según el tipo de dato
    if (tipoDato === 'BOOLEANO') {
      const lower = valTrim.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        setErrorValidacion('El valor debe ser "true" o "false" para una condición booleana.');
        return;
      }
    } else if (tipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(valTrim)) {
        setErrorValidacion('El valor esperado debe ser un número entero válido.');
        return;
      }
    } else if (tipoDato === 'DECIMAL') {
      if (isNaN(Number(valTrim)) || !/^-?\d+(\.\d+)?$/.test(valTrim)) {
        setErrorValidacion('El valor esperado debe ser un número decimal válido.');
        return;
      }
    }

    const nombreRef =
      tipoElemento === 'VARIABLE'
        ? variables.find((v) => String(v.id) === elementoId)?.nombre || ''
        : hechos.find((h) => String(h.id) === elementoId)?.nombre || '';

    onGuardar({
      reglaId: reglaId || undefined,
      tipoElemento,
      variable_id: tipoElemento === 'VARIABLE' ? elementoId : null,
      hecho_id: tipoElemento === 'HECHO' ? elementoId : null,
      referencia: nombreRef,
      operador,
      valor_esperado: tipoDato === 'BOOLEANO' ? (valTrim.toLowerCase() === 'false' ? 'false' : 'true') : valTrim,
      orden: Number(orden) || 1,
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
      {(isLocal || (!nodo.data.variable_id && !nodo.data.hecho_id)) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">
              {isLocal ? 'Condición visual pendiente' : 'Condición no vinculada'}
            </p>
            <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
              Para guardarla en la Base de Conocimiento, selecciona con qué <strong>Variable</strong> o <strong>Hecho</strong> se relaciona y a qué <strong>Regla</strong> pertenece.
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
          Relacionar con
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipoElemento('VARIABLE');
              setElementoId('');
              setValorEsperado('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
              setValorEsperado('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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

      {/* Select según el tipo con Badge de Tipo de Dato */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {tipoElemento === 'VARIABLE' ? 'Seleccionar Variable *' : 'Seleccionar Hecho *'}
          </label>
          {elementoSeleccionado && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono border border-amber-200">
              Tipo: {tipoDato}
            </span>
          )}
        </div>

        {tipoElemento === 'VARIABLE' ? (
          <div>
            <Select
              options={opcionesVariables}
              value={elementoId}
              onChange={(e) => handleElementoChange(e.target.value)}
              required
            />
            {variables.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No hay variables creadas aún. Puedes crear una desde la barra superior.
              </p>
            )}
          </div>
        ) : (
          <div>
            <Select
              options={opcionesHechos}
              value={elementoId}
              onChange={(e) => handleElementoChange(e.target.value)}
              required
            />
            {hechos.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No hay hechos creados aún. Puedes crear uno desde la barra superior.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Operador (Full Width) */}
      <div>
        <Select
          label="Operador de Comparación"
          options={
            tipoDato === 'BOOLEANO'
              ? [
                  { value: '==', label: '== (Igual a)' },
                  { value: '!=', label: '!= (Diferente de)' },
                ]
              : [
                  { value: '==', label: '== (Igual a)' },
                  { value: '!=', label: '!= (Diferente de)' },
                  { value: '>', label: '> (Mayor que)' },
                  { value: '<', label: '< (Menor que)' },
                  { value: '>=', label: '>= (Mayor o igual que)' },
                  { value: '<=', label: '<= (Menor o igual que)' },
                ]
          }
          value={operador}
          onChange={(e) => setOperador(e.target.value)}
          required
        />
      </div>

      {/* Valor Esperado (Full Width) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Valor Esperado *
        </label>

        {tipoDato === 'BOOLEANO' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setValorEsperado('true');
                setErrorValidacion(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                valorEsperado === 'true'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              true (Verdadero)
            </button>
            <button
              type="button"
              onClick={() => {
                setValorEsperado('false');
                setErrorValidacion(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                valorEsperado === 'false'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-xs'
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
            value={valorEsperado}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^-?\d*$/.test(val)) {
                setValorEsperado(val);
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
            value={valorEsperado}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^-?\d*(\.\d*)?$/.test(val)) {
                setValorEsperado(val);
                setErrorValidacion(null);
              }
            }}
            placeholder="Ingresa un número decimal (ej: 12.5, 0.75)"
            required
          />
        ) : (
          <Input
            type="text"
            value={valorEsperado}
            onChange={(e) => {
              setValorEsperado(e.target.value);
              setErrorValidacion(null);
            }}
            placeholder='Ej: "activo", "urgente"'
            required
          />
        )}

        <p className="text-[11px] text-slate-500 mt-1">
          {tipoDato === 'BOOLEANO' && 'Selecciona si la condición evaluará Verdadero o Falso.'}
          {tipoDato === 'ENTERO' && 'Solo se permiten números enteros sin decimales.'}
          {tipoDato === 'DECIMAL' && 'Ingresa un valor numérico decimal o entero.'}
          {tipoDato === 'TEXTO' && 'Ingresa el texto a comparar.'}
        </p>
      </div>

      {/* Orden */}
      <Input
        label="Orden de Evaluación"
        type="number"
        min="1"
        value={orden}
        onChange={(e) => setOrden(Math.max(1, Number(e.target.value)))}
        required
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full font-semibold shadow-xs"
          loading={loading}
          icon={<GitBranch className="w-4 h-4" />}
        >
          {isLocal ? 'Guardar y Vincular Condición' : 'Aplicar Cambios al Nodo'}
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesCondicion;
