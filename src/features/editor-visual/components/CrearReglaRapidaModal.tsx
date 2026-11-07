import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Workflow, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import baseConocimientoService from '@/features/base-conocimiento/services/baseConocimientoService';
import type {
  Regla,
  Variable,
  Hecho,
  CondicionItemInput,
  ConclusionItemInput,
  TipoDato,
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

export interface CrearReglaRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseConocimientoId: string | number;
  onReglaCreada: (regla: Regla) => void;
  variablesExistentes?: Variable[];
  hechosExistentes?: Hecho[];
  siguienteNumeroRegla?: number;
}

export const CrearReglaRapidaModal: React.FC<CrearReglaRapidaModalProps> = ({
  isOpen,
  onClose,
  baseConocimientoId,
  onReglaCreada,
  variablesExistentes = [],
  hechosExistentes = [],
  siguienteNumeroRegla = 1,
}) => {
  const [nombre, setNombre] = useState(`R${siguienteNumeroRegla}`);
  const [prioridad, setPrioridad] = useState(10);
  const [descripcion, setDescripcion] = useState('');
  const [condiciones, setCondiciones] = useState<CondicionFila[]>([
    { id: 'c1', variable_nombre: '', operador: '=', valor_esperado: '', tipo_dato: 'TEXTO' },
  ]);
  const [conclusiones, setConclusiones] = useState<ConclusionFila[]>([
    { id: 'concl1', variable_nombre: '', valor_resultante: '', tipo_dato: 'TEXTO' },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectarTipo = (valor: string, varNombre?: string): TipoDato => {
    if (varNombre) {
      const encontrada = variablesExistentes.find(
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

  useEffect(() => {
    if (isOpen) {
      setNombre(`R${siguienteNumeroRegla}`);
      setPrioridad(10);
      setDescripcion('');
      setCondiciones([{ id: 'c1', variable_nombre: '', operador: '=', valor_esperado: '', tipo_dato: 'TEXTO' }]);
      setConclusiones([{ id: 'concl1', variable_nombre: '', valor_resultante: '', tipo_dato: 'TEXTO' }]);
      setError(null);
    }
  }, [isOpen, siguienteNumeroRegla]);

  if (!isOpen) return null;

  // Sugerencias de variables / hechos ya existentes para autocomplete
  const nombresDisponibles = Array.from(
    new Set([
      ...variablesExistentes.map((v) => v.nombre),
      ...hechosExistentes.map((h) => h.nombre),
    ])
  ).filter(Boolean);

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
        // Auto-detección cuando cambia el valor o el nombre si no se ha seleccionado manualmente
        if (campo === 'valor_esperado') {
          nuevo.tipo_dato = detectarTipo(valor, nuevo.variable_nombre);
        } else if (campo === 'variable_nombre' && valor.trim()) {
          nuevo.tipo_dato = detectarTipo(nuevo.valor_esperado, valor);
        }
        return nuevo;
      })
    );
  };

  const agregarConclusion = () => {
    setConclusiones((prev) => [
      ...prev,
      {
        id: `concl_${Date.now()}_${Math.random()}`,
        variable_nombre: '',
        valor_resultante: '',
        tipo_dato: 'TEXTO',
      },
    ]);
  };

  const eliminarConclusion = (id: string) => {
    if (conclusiones.length <= 1) return;
    setConclusiones((prev) => prev.filter((c) => c.id !== id));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('Debes ingresar un nombre o identificador para la regla (ej. R1).');
      return;
    }

    const condsFiltradas: CondicionItemInput[] = condiciones
      .filter((c) => c.variable_nombre.trim() && c.valor_esperado.trim())
      .map((c, index) => ({
        variable_nombre: c.variable_nombre.trim(),
        operador: c.operador,
        valor_esperado: c.valor_esperado.trim(),
        tipo_dato: c.tipo_dato,
        orden: index + 1,
      }));

    if (condsFiltradas.length === 0) {
      setError('Debes ingresar al menos una condición válida en la sección SI (IF).');
      return;
    }

    const conclsFiltradas: ConclusionItemInput[] = conclusiones
      .filter((c) => c.variable_nombre.trim() && c.valor_resultante.trim())
      .map((c) => ({
        variable_nombre: c.variable_nombre.trim(),
        valor_resultante: c.valor_resultante.trim(),
        tipo_dato: c.tipo_dato,
      }));

    if (conclsFiltradas.length === 0) {
      setError('Debes ingresar al menos una conclusión en la sección ENTONCES (THEN).');
      return;
    }

    setGuardando(true);
    try {
      const nuevaRegla = await baseConocimientoService.crearReglaCompleta(baseConocimientoId, {
        nombre: nombre.trim(),
        prioridad: Number(prioridad) || 10,
        descripcion: descripcion.trim() || undefined,
        activa: true,
        condiciones: condsFiltradas,
        conclusiones: conclsFiltradas,
      });

      onReglaCreada(nuevaRegla);
      onClose();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { mensaje?: string; error?: string } } };
      setError(
        errObj?.response?.data?.mensaje ||
          errObj?.response?.data?.error ||
          'Error al guardar la regla completa. Verifica los campos.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200/90 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left">
        {/* Cabecera del Modal */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-2xs">
              <Workflow className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Crear Regla Rápida (IF-THEN)</h3>
              <p className="text-xs text-slate-400">
                Define la regla completa en un solo paso para tu Base de Conocimiento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {error}
            </div>
          )}

          {/* Fila 1: Nombre / ID y Prioridad */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Identificador / Código <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                  Sugerido: R{siguienteNumeroRegla}
                </span>
              </div>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={`Ej. R${siguienteNumeroRegla}`}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" title="Determina el orden de resolución en FWC">
                Prioridad FWC
              </label>
              <input
                type="number"
                value={prioridad}
                onChange={(e) => setPrioridad(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white font-mono"
                min={0}
              />
            </div>
          </div>

          {/* Datalist para autocompletar variables existentes */}
          <datalist id="variables-disponibles">
            {nombresDisponibles.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          {/* SECCIÓN SI (IF - Condiciones) */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-md p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SI (IF) — Premisas
              </span>
              <button
                type="button"
                onClick={agregarCondicion}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Condición
              </button>
            </div>

            <div className="space-y-2">
              {condiciones.map((c, index) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 w-7">
                    {index === 0 ? 'IF' : 'AND'}
                  </span>
                  <input
                    type="text"
                    list="variables-disponibles"
                    value={c.variable_nombre}
                    onChange={(e) => actualizarCondicion(c.id, 'variable_nombre', e.target.value)}
                    placeholder="Variable (ej. x)"
                    className="flex-1 min-w-[80px] px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900"
                    required
                  />
                  <select
                    value={c.operador}
                    onChange={(e) => actualizarCondicion(c.id, 'operador', e.target.value)}
                    className="w-14 px-1 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono font-bold text-center focus:ring-1 focus:ring-slate-900"
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
                    className="flex-1 min-w-[70px] px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900"
                    required
                  />
                  <select
                    value={c.tipo_dato}
                    onChange={(e) => actualizarCondicion(c.id, 'tipo_dato', e.target.value)}
                    className="w-20 px-1 py-1.5 text-[10px] bg-white border border-slate-200 rounded-md font-medium text-slate-700 focus:ring-1 focus:ring-slate-900 shrink-0"
                    title="Tipo de dato"
                  >
                    <option value="ENTERO">Entero</option>
                    <option value="DECIMAL">Decimal</option>
                    <option value="TEXTO">Texto</option>
                    <option value="BOOLEANO">Bool</option>
                    <option value="OPCION">Opción</option>
                  </select>
                  {condiciones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarCondicion(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar condición"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN ENTONCES (THEN - Conclusiones) */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-md p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                ENTONCES (THEN) — Conclusiones
              </span>
              <button
                type="button"
                onClick={agregarConclusion}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Deducción
              </button>
            </div>

            <div className="space-y-2">
              {conclusiones.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 w-8">
                    THEN
                  </span>
                  <input
                    type="text"
                    list="variables-disponibles"
                    value={c.variable_nombre}
                    onChange={(e) => actualizarConclusion(c.id, 'variable_nombre', e.target.value)}
                    placeholder="Variable destino"
                    className="flex-1 min-w-[80px] px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900"
                    required
                  />
                  <span className="text-xs font-bold text-slate-400">=</span>
                  <input
                    type="text"
                    value={c.valor_resultante}
                    onChange={(e) => actualizarConclusion(c.id, 'valor_resultante', e.target.value)}
                    placeholder="Valor resultante"
                    className="flex-1 min-w-[70px] px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900"
                    required
                  />
                  <select
                    value={c.tipo_dato}
                    onChange={(e) => actualizarConclusion(c.id, 'tipo_dato', e.target.value)}
                    className="w-20 px-1 py-1.5 text-[10px] bg-white border border-slate-200 rounded-md font-medium text-slate-700 focus:ring-1 focus:ring-slate-900 shrink-0"
                    title="Tipo de dato resultante"
                  >
                    <option value="ENTERO">Entero</option>
                    <option value="DECIMAL">Decimal</option>
                    <option value="TEXTO">Texto</option>
                    <option value="BOOLEANO">Bool</option>
                    <option value="OPCION">Opción</option>
                  </select>
                  {conclusiones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarConclusion(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar conclusión"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Opcional: Descripción pedagógica */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Descripción o justificación didáctica (opcional)
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Si x es 0, deducir que la propiedad P adopta el estado a"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={guardando}
              loading={guardando}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1.5"
            >
              <Workflow className="w-3.5 h-3.5" />
              {guardando ? 'Guardando regla...' : `Crear Regla ${nombre}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearReglaRapidaModal;
