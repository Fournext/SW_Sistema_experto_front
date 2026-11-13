import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Workflow, Code2, ListFilter } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import {
  extraerAtomosDeExpresion,
  validarSintaxisExpresionLogica,
} from '../utils/evaluadorLogicaPremisas';
import type { FlowNode } from '../types/types';
import type {
  Hecho,
  Variable,
  Regla,
  TipoDato,
  CondicionItemInput,
  ConclusionItemInput,
} from '@/features/base-conocimiento/types/types';

interface CondicionFila {
  id: string;
  variable_nombre: string;
  operador: string;
  valor_esperado: string;
  tipo_dato: TipoDato;
}

interface ConclusionFila {
  id: string;
  variable_nombre: string;
  valor_resultante: string;
  tipo_dato: TipoDato;
}

export interface PanelPropiedadesReglaProps {
  nodo: FlowNode;
  onGuardar: (datos: Record<string, unknown>) => void;
  loading?: boolean;
  variables?: Variable[];
  hechos?: Hecho[];
  reglas?: Regla[];
}

export const PanelPropiedadesRegla: React.FC<PanelPropiedadesReglaProps> = ({
  nodo,
  onGuardar,
  loading = false,
  variables = [],
  hechos = [],
  reglas = [],
}) => {
  const [nombre, setNombre] = useState(String(nodo.data.nombre || ''));
  const [descripcion, setDescripcion] = useState(String(nodo.data.descripcion || ''));
  const [prioridad, setPrioridad] = useState(Number(nodo.data.prioridad ?? 10));
  const [factorCerteza, setFactorCerteza] = useState(Number(nodo.data.factor_certeza ?? 1.0));
  const [activa, setActiva] = useState(nodo.data.activa !== false);

  const [condiciones, setCondiciones] = useState<CondicionFila[]>([]);
  const [conclusiones, setConclusiones] = useState<ConclusionFila[]>([]);
  const [modoPremisa, setModoPremisa] = useState<'SIMPLE' | 'COMPLEJA'>('SIMPLE');
  const [expresionLogica, setExpresionLogica] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sugerencias de variables / hechos ya existentes para autocomplete
  const nombresDisponibles = Array.from(
    new Set([
      ...variables.map((v) => v.nombre),
      ...hechos.map((h) => h.nombre),
    ])
  ).filter(Boolean);

  const detectarTipo = (valor: string, varNombre?: string): TipoDato => {
    if (varNombre) {
      const encontrada = variables.find(
        (v) => v.nombre.trim().toLowerCase() === varNombre.trim().toLowerCase()
      );
      if (encontrada?.tipo_dato) return encontrada.tipo_dato;
      if (encontrada?.tipo) return encontrada.tipo;
    }
    const trimmed = valor.trim().toLowerCase();
    if (trimmed === 'true' || trimmed === 'false' || trimmed === 'si' || trimmed === 'no') {
      return 'BOOLEANO';
    }
    if (trimmed !== '' && !isNaN(Number(trimmed))) {
      return trimmed.includes('.') ? 'DECIMAL' : 'ENTERO';
    }
    return 'TEXTO';
  };

  // Inicializar formulario con los datos de la regla y sus condiciones/conclusiones
  useEffect(() => {
    setNombre(String(nodo.data.nombre || ''));
    setDescripcion(String(nodo.data.descripcion || ''));
    setPrioridad(Number(nodo.data.prioridad ?? 10));
    setFactorCerteza(Number(nodo.data.factor_certeza ?? 1.0));
    setActiva(nodo.data.activa !== false);
    setError(null);

    // Buscar regla en la lista completa para extraer condiciones y conclusiones
    const reglaCompleta = reglas.find((r) => String(r.id) === String(nodo.data.id));

    const exprExistente = reglaCompleta?.expresion_logica || (nodo.data.expresion_logica as string | undefined);
    if (exprExistente && exprExistente.trim()) {
      setModoPremisa('COMPLEJA');
      setExpresionLogica(exprExistente.trim());
    } else {
      setModoPremisa('SIMPLE');
      setExpresionLogica('');
    }

    if (reglaCompleta?.condiciones && reglaCompleta.condiciones.length > 0) {
      setCondiciones(
        reglaCompleta.condiciones.map((c, i) => {
          let varNombre = c.variable_nombre || c.referencia || '';
          if (!varNombre) {
            if (c.variable_id) {
              varNombre = variables.find((v) => String(v.id) === String(c.variable_id))?.nombre || '';
            } else if (c.hecho_id) {
              varNombre = hechos.find((h) => String(h.id) === String(c.hecho_id))?.nombre || '';
            }
          }
          const valEsp = String(c.valor_esperado ?? '');
          return {
            id: String(c.id || `c_${i}`),
            variable_nombre: varNombre,
            operador: c.operador || '=',
            valor_esperado: valEsp,
            tipo_dato: detectarTipo(valEsp, varNombre),
          };
        })
      );
    } else if (Array.isArray(nodo.data.condicionesLista) && nodo.data.condicionesLista.length > 0) {
      setCondiciones(
        (nodo.data.condicionesLista as Array<{ sujeto: string; operador: string; valor: string }>).map((c, i) => ({
          id: `c_${i}`,
          variable_nombre: c.sujeto || '',
          operador: c.operador || '=',
          valor_esperado: c.valor || '',
          tipo_dato: detectarTipo(c.valor || '', c.sujeto),
        }))
      );
    } else {
      setCondiciones([{ id: 'c_init', variable_nombre: '', operador: '=', valor_esperado: '', tipo_dato: 'TEXTO' }]);
    }

    if (reglaCompleta?.conclusiones && reglaCompleta.conclusiones.length > 0) {
      setConclusiones(
        reglaCompleta.conclusiones.map((c, i) => {
          let varNombre = c.variable_nombre || c.destino || '';
          if (!varNombre) {
            if (c.variable_resultante_id) {
              varNombre = variables.find((v) => String(v.id) === String(c.variable_resultante_id))?.nombre || '';
            } else if (c.hecho_resultante_id) {
              varNombre = hechos.find((h) => String(h.id) === String(c.hecho_resultante_id))?.nombre || '';
            }
          }
          const valRes = String(c.valor_resultante ?? '');
          return {
            id: String(c.id || `cl_${i}`),
            variable_nombre: varNombre,
            valor_resultante: valRes,
            tipo_dato: detectarTipo(valRes, varNombre),
          };
        })
      );
    } else if (Array.isArray(nodo.data.conclusionesLista) && nodo.data.conclusionesLista.length > 0) {
      setConclusiones(
        (nodo.data.conclusionesLista as Array<{ destino: string; valor: string }>).map((c, i) => ({
          id: `cl_${i}`,
          variable_nombre: c.destino || '',
          valor_resultante: c.valor || '',
          tipo_dato: detectarTipo(c.valor || '', c.destino),
        }))
      );
    } else {
      setConclusiones([{ id: 'cl_init', variable_nombre: '', valor_resultante: '', tipo_dato: 'TEXTO' }]);
    }
  }, [nodo, reglas, variables, hechos]);

  const agregarCondicion = () => {
    setCondiciones((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}_${Math.random()}`,
        variable_nombre: '',
        operador: '=',
        valor_esperado: '',
        tipo_dato: 'TEXTO',
      },
    ]);
  };

  const eliminarCondicion = (id: string) => {
    if (condiciones.length <= 1) return;
    setCondiciones((prev) => prev.filter((c) => c.id !== id));
  };

  const actualizarCondicion = (id: string, campo: keyof CondicionFila, valor: string) => {
    setCondiciones((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nuevo = { ...c, [campo]: valor };
        if (campo === 'valor_esperado') {
          nuevo.tipo_dato = detectarTipo(valor, nuevo.variable_nombre);
        } else if (campo === 'variable_nombre' && valor.trim()) {
          nuevo.tipo_dato = detectarTipo(nuevo.valor_esperado, valor);
        }
        return nuevo;
      })
    );
  };

  const actualizarConclusion = (id: string, campo: keyof ConclusionFila, valor: string) => {
    setConclusiones((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nuevo = { ...c, [campo]: valor };
        if (campo === 'valor_resultante') {
          nuevo.tipo_dato = detectarTipo(valor, nuevo.variable_nombre);
        } else if (campo === 'variable_nombre' && valor.trim()) {
          nuevo.tipo_dato = detectarTipo(nuevo.valor_resultante, valor);
        }
        return nuevo;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre o identificador de la regla es obligatorio.');
      return;
    }

    let condsFiltradas: CondicionItemInput[] = [];
    let exprLogicaFinal: string | null = null;

    if (modoPremisa === 'COMPLEJA') {
      const exprTrimmed = expresionLogica.trim();
      if (!exprTrimmed) {
        setError('Debes ingresar la expresión lógica de la premisa.');
        return;
      }

      const validacion = validarSintaxisExpresionLogica(exprTrimmed);
      if (!validacion.valida) {
        setError(validacion.error || 'La expresión lógica contiene errores de sintaxis.');
        return;
      }

      exprLogicaFinal = exprTrimmed;
      const atomos = extraerAtomosDeExpresion(exprTrimmed);
      if (atomos.length === 0) {
        setError('No se pudieron extraer condiciones válidas de la expresión lógica.');
        return;
      }

      condsFiltradas = atomos.map((a, index) => ({
        variable_nombre: a.variable_nombre,
        operador: a.operador,
        valor_esperado: a.valor_esperado,
        tipo_dato: detectarTipo(a.valor_esperado, a.variable_nombre),
        orden: index + 1,
      }));
    } else {
      condsFiltradas = condiciones
        .filter((c) => c.variable_nombre.trim() && c.valor_esperado.trim())
        .map((c, index) => ({
          variable_nombre: c.variable_nombre.trim(),
          operador: c.operador,
          valor_esperado: c.valor_esperado.trim(),
          tipo_dato: c.tipo_dato,
          orden: index + 1,
        }));

      if (condsFiltradas.length === 0) {
        setError('Debes especificar al menos una condición válida (IF).');
        return;
      }
    }

    const conclsFiltradas: ConclusionItemInput[] = conclusiones
      .filter((c) => c.variable_nombre.trim() && c.valor_resultante.trim())
      .map((c) => ({
        variable_nombre: c.variable_nombre.trim(),
        valor_resultante: c.valor_resultante.trim(),
        tipo_dato: c.tipo_dato,
      }));

    if (conclsFiltradas.length === 0) {
      setError('Debes especificar al menos una conclusión válida (THEN).');
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      prioridad: Number(prioridad) || 10,
      factor_certeza: Number(factorCerteza) || 1.0,
      activa: Boolean(activa),
      expresion_logica: exprLogicaFinal,
      condiciones: condsFiltradas,
      conclusiones: conclsFiltradas,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && (
        <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Datalist para autocompletar variables existentes */}
      <datalist id="variables-disponibles-propiedades">
        {nombresDisponibles.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {/* Identificador / Nombre */}
      <Input
        label="Identificador / Código de la Regla"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        placeholder="Ej. R1, Regla_Diagnostico"
        className="font-mono font-bold"
      />

      {/* Prioridad y Factor Certeza */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad FWC</label>
          <input
            type="number"
            min="0"
            value={prioridad}
            onChange={(e) => setPrioridad(parseInt(e.target.value, 10) || 0)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Factor Certeza</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={factorCerteza}
            onChange={(e) => setFactorCerteza(parseFloat(e.target.value) || 1.0)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* SECCIÓN SI (IF - Condiciones) */}
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            SI (IF) — Premisas
          </span>

          {/* Selector de Modo de Premisa: Simple (AND) vs Compleja */}
          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-md border border-slate-300/80 text-[10px]">
            <button
              type="button"
              onClick={() => setModoPremisa('SIMPLE')}
              className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                modoPremisa === 'SIMPLE'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-2.5 h-2.5 text-emerald-600" />
              Simple
            </button>
            <button
              type="button"
              onClick={() => {
                setModoPremisa('COMPLEJA');
                if (!expresionLogica.trim() && condiciones.length > 0) {
                  const validas = condiciones.filter((c) => c.variable_nombre.trim());
                  if (validas.length > 0) {
                    setExpresionLogica(
                      validas.map((c) => `${c.variable_nombre}${c.operador}${c.valor_esperado || "''"}`).join(' AND ')
                    );
                  }
                }
              }}
              className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                modoPremisa === 'COMPLEJA'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-2.5 h-2.5 text-amber-600" />
              Compleja
            </button>
          </div>
        </div>

        {modoPremisa === 'COMPLEJA' ? (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-slate-500">
              Fórmula lógica con <strong>AND</strong>, <strong>OR</strong>, <strong>NOT</strong> y paréntesis:
            </p>

            {/* Inserción rápida */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { label: 'OR', val: ' OR ' },
                { label: 'AND', val: ' AND ' },
                { label: 'NOT', val: 'NOT ' },
                { label: '( ... )', val: '(  )' },
                { label: '>=', val: ' >= ' },
                { label: '<=', val: ' <= ' },
                { label: '!=', val: ' != ' },
              ].map((op) => (
                <button
                  key={op.label}
                  type="button"
                  onClick={() => setExpresionLogica((prev) => (prev ? `${prev}${op.val}` : op.val.trim()))}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  {op.label}
                </button>
              ))}
            </div>

            <textarea
              value={expresionLogica}
              onChange={(e) => setExpresionLogica(e.target.value)}
              placeholder="Ej: (A=b AND B=0) OR P>10"
              rows={3}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 text-teal-300 border border-slate-800 rounded-md font-mono focus:ring-1 focus:ring-teal-400 shadow-inner"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={agregarCondicion}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 bg-emerald-100/70 hover:bg-emerald-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                + Condición
              </button>
            </div>
            {condiciones.map((c, index) => (
              <div key={c.id} className="space-y-1">
                {index > 0 && (
                  <div className="flex items-center justify-center py-0.5">
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      AND
                    </span>
                  </div>
                )}
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 space-y-2 shadow-2xs">
                  {/* Fila 1: Variable, operador, valor y eliminar */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      list="variables-disponibles-propiedades"
                      value={c.variable_nombre}
                      onChange={(e) => actualizarCondicion(c.id, 'variable_nombre', e.target.value)}
                      placeholder="Variable"
                      className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <select
                      value={c.operador}
                      onChange={(e) => actualizarCondicion(c.id, 'operador', e.target.value)}
                      className="w-14 px-1 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono font-bold text-center focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                    </select>
                    <input
                      type="text"
                      value={c.valor_esperado}
                      onChange={(e) => actualizarCondicion(c.id, 'valor_esperado', e.target.value)}
                      placeholder="Valor"
                      className="w-20 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    {condiciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarCondicion(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar condición"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Fila 2: Tipo de dato selector */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="font-semibold text-emerald-800">Tipo de atributo:</span>
                    <select
                      value={c.tipo_dato}
                      onChange={(e) => actualizarCondicion(c.id, 'tipo_dato', e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-50 border border-emerald-200/80 rounded-md font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      title="Tipo de dato"
                    >
                      <option value="ENTERO">Entero (numérico)</option>
                      <option value="DECIMAL">Decimal (flotante)</option>
                      <option value="TEXTO">Texto</option>
                      <option value="BOOLEANO">Booleano (Sí/No)</option>
                      <option value="OPCION">Opción múltiple</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN ENTONCES (THEN - Conclusión) */}
      <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-purple-600" />
            ENTONCES (THEN) — Conclusión
          </span>
        </div>

        <div className="space-y-2">
          {conclusiones.slice(0, 1).map((c) => (
            <div key={c.id} className="bg-white p-2.5 rounded-lg border border-purple-200/80 space-y-2 shadow-2xs">
              {/* Fila 1: Variable destino, =, valor resultante */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="variables-disponibles-propiedades"
                  value={c.variable_nombre}
                  onChange={(e) => actualizarConclusion(c.id, 'variable_nombre', e.target.value)}
                  placeholder="Variable destino"
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
                <span className="text-xs font-bold text-slate-400">=</span>
                <input
                  type="text"
                  value={c.valor_resultante}
                  onChange={(e) => actualizarConclusion(c.id, 'valor_resultante', e.target.value)}
                  placeholder="Valor"
                  className="w-20 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Fila 2: Tipo de dato selector */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                <span className="font-semibold text-purple-800">Tipo de atributo:</span>
                <select
                  value={c.tipo_dato}
                  onChange={(e) => actualizarConclusion(c.id, 'tipo_dato', e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-purple-200/80 rounded-md font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  title="Tipo de dato"
                >
                  <option value="ENTERO">Entero</option>
                  <option value="DECIMAL">Decimal</option>
                  <option value="TEXTO">Texto</option>
                  <option value="BOOLEANO">Booleano</option>
                  <option value="OPCION">Opción</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <Textarea
        label="Descripción o justificación pedagógica"
        rows={2}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Opcional: motivo o regla de negocio"
      />

      {/* Checkbox Activa */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="regla_activa_panel"
          checked={activa}
          onChange={(e) => setActiva(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="regla_activa_panel" className="text-xs font-medium text-slate-700 cursor-pointer">
          Regla habilitada / activa para inferencia FWC
        </label>
      </div>

      {/* Botón de Guardar */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
          loading={loading}
        >
          <Workflow className="w-3.5 h-3.5" />
          Aplicar Cambios a la Regla
        </Button>
      </div>
    </form>
  );
};

export default PanelPropiedadesRegla;
