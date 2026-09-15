import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, GitBranch, CheckCircle2, ArrowRight, ArrowLeft, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import type { Regla, Variable, Hecho, TipoDato } from '../types/types';
import { useReglas, useReglasMutations, useVariablesMutations } from '../hooks/useBaseConocimiento';
import baseConocimientoService from '../services/baseConocimientoService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';

export interface ReglaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  regla: Regla | null; // null si es crear nueva regla
  baseConocimientoId: number | string | undefined;
  variables?: Variable[];
  hechos?: Hecho[];
  defaultNextNumber?: number;
}

interface ItemCondicion {
  id?: number | string;
  referencia: string;
  variable_id?: number | string | null;
  hecho_id?: number | string | null;
  operador: string;
  valor_esperado: string;
  tipoDato: TipoDato;
  esNuevaVariable?: boolean;
}

interface ItemConclusion {
  id?: number | string;
  destino: string;
  variable_resultante_id?: number | string | null;
  hecho_resultante_id?: number | string | null;
  valor_resultante: string;
  tipoDato: TipoDato;
  esNuevaVariable?: boolean;
}

export const ReglaEditorModal: React.FC<ReglaEditorModalProps> = ({
  isOpen,
  onClose,
  regla,
  baseConocimientoId,
  variables = [],
  hechos = [],
  defaultNextNumber = 1,
}) => {
  const { data: todasLasReglas } = useReglas(baseConocimientoId);

  // Derivar regla activa y reactiva desde la query global
  const reglaActiva = useMemo(() => {
    if (!regla) return null;
    const found = todasLasReglas?.find((r) => String(r.id) === String(regla.id));
    return found || regla;
  }, [regla, todasLasReglas]);

  const { crear, actualizar, agregarCondicion, eliminarCondicion, agregarConclusion, eliminarConclusion } =
    useReglasMutations(baseConocimientoId);
  const { crear: crearVariableMut } = useVariablesMutations(baseConocimientoId);

  // Campos principales de la regla
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<number>(10);
  const [factorCerteza, setFactorCerteza] = useState<number>(1.0);
  const [activa, setActiva] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'propiedades' | 'condiciones' | 'conclusiones'>('propiedades');

  // Para nueva regla: guardamos las condiciones y conclusiones en borrador
  const [draftCondiciones, setDraftCondiciones] = useState<ItemCondicion[]>([]);
  const [draftConclusiones, setDraftConclusiones] = useState<ItemConclusion[]>([]);

  // Mini-formulario para agregar condición
  const [condRefSeleccionada, setCondRefSeleccionada] = useState<string>('');
  const [condNuevaVarNombre, setCondNuevaVarNombre] = useState<string>('');
  const [condNuevaVarTipo, setCondNuevaVarTipo] = useState<TipoDato>('ENTERO');
  const [condOperador, setCondOperador] = useState<string>('==');
  const [condValor, setCondValor] = useState<string>('');
  const [condError, setCondError] = useState<string | null>(null);

  // Mini-formulario para agregar conclusión
  const [conclDestSeleccionada, setConclDestSeleccionada] = useState<string>('');
  const [conclNuevaVarNombre, setConclNuevaVarNombre] = useState<string>('');
  const [conclNuevaVarTipo, setConclNuevaVarTipo] = useState<TipoDato>('ENTERO');
  const [conclValor, setConclValor] = useState<string>('');
  const [conclError, setConclError] = useState<string | null>(null);

  // Estados para retraer / expandir los formularios
  const [mostrarFormCondicion, setMostrarFormCondicion] = useState<boolean>(false);
  const [mostrarFormConclusion, setMostrarFormConclusion] = useState<boolean>(false);

  // Inicializar valores al abrir o cambiar de regla
  useEffect(() => {
    if (isOpen) {
      setActiveTab('propiedades');
      setMostrarFormCondicion(false);
      setMostrarFormConclusion(false);
      if (regla) {
        setNombre(regla.nombre || '');
        setDescripcion(regla.descripcion || '');
        setPrioridad(regla.prioridad ?? 10);
        setFactorCerteza(Number(regla.factor_certeza ?? 1.0));
        setActiva(regla.activa !== false);
        setDraftCondiciones([]);
        setDraftConclusiones([]);
      } else {
        setNombre(`R${defaultNextNumber}`);
        setDescripcion('');
        setPrioridad(10);
        setFactorCerteza(1.0);
        setActiva(true);
        setDraftCondiciones([]);
        setDraftConclusiones([]);
      }
      setFormError(null);
      resetCondForm();
      resetConclForm();
    }
  }, [isOpen, regla, defaultNextNumber]);

  const resetCondForm = () => {
    setCondRefSeleccionada('');
    setCondNuevaVarNombre('');
    setCondNuevaVarTipo('ENTERO');
    setCondOperador('==');
    setCondValor('');
    setCondError(null);
  };

  const resetConclForm = () => {
    setConclDestSeleccionada('');
    setConclNuevaVarNombre('');
    setConclNuevaVarTipo('ENTERO');
    setConclValor('');
    setConclError(null);
  };

  // Opciones de referencia para condiciones y conclusiones
  const opcionesReferencia = useMemo(() => {
    const list: { value: string; label: string }[] = [];

    if (variables.length > 0) {
      variables.forEach((v) => {
        list.push({
          value: `var:${v.id}:${v.nombre}`,
          label: `Variable: ${v.nombre} (${(v.tipo || v.tipo_dato || 'TEXTO').toUpperCase()})`,
        });
      });
    }

    if (hechos.length > 0) {
      hechos.forEach((h) => {
        list.push({
          value: `hecho:${h.id}:${h.nombre}`,
          label: `Hecho: ${h.nombre} (${(h.tipo_dato || 'TEXTO').toUpperCase()})`,
        });
      });
    }

    list.push({
      value: '__NUEVA_VARIABLE__',
      label: '✨ + Crear nueva variable...',
    });

    return list;
  }, [variables, hechos]);

  // Si no hay seleccionada ninguna referencia por defecto, setear la primera si existe
  useEffect(() => {
    if (!condRefSeleccionada && opcionesReferencia.length > 0) {
      setCondRefSeleccionada(opcionesReferencia[0].value);
    }
    if (!conclDestSeleccionada && opcionesReferencia.length > 0) {
      setConclDestSeleccionada(opcionesReferencia[0].value);
    }
  }, [opcionesReferencia, condRefSeleccionada, conclDestSeleccionada]);

  // Tipo de dato para la condición en curso
  const tipoDatoCondicion: TipoDato = useMemo(() => {
    if (condRefSeleccionada === '__NUEVA_VARIABLE__') {
      return condNuevaVarTipo;
    }
    if (condRefSeleccionada.startsWith('var:')) {
      const parts = condRefSeleccionada.split(':');
      const v = variables.find((item) => String(item.id) === parts[1]);
      return (v?.tipo || v?.tipo_dato || 'TEXTO') as TipoDato;
    }
    if (condRefSeleccionada.startsWith('hecho:')) {
      const parts = condRefSeleccionada.split(':');
      const h = hechos.find((item) => String(item.id) === parts[1]);
      return (h?.tipo_dato || 'TEXTO') as TipoDato;
    }
    return 'ENTERO';
  }, [condRefSeleccionada, condNuevaVarTipo, variables, hechos]);

  // Ajustar operador y valor si tipo de dato es booleano o si cambia a no booleano
  useEffect(() => {
    if (tipoDatoCondicion === 'BOOLEANO') {
      if (condOperador !== '==' && condOperador !== '!=') {
        setCondOperador('==');
      }
      if (condValor !== 'true' && condValor !== 'false') {
        setCondValor('true');
      }
    } else {
      if (condValor === 'true' || condValor === 'false') {
        setCondValor('');
      }
    }
  }, [tipoDatoCondicion, condOperador, condValor]);

  // Tipo de dato para la conclusión en curso
  const tipoDatoConclusion: TipoDato = useMemo(() => {
    if (conclDestSeleccionada === '__NUEVA_VARIABLE__') {
      return conclNuevaVarTipo;
    }
    if (conclDestSeleccionada.startsWith('var:')) {
      const parts = conclDestSeleccionada.split(':');
      const v = variables.find((item) => String(item.id) === parts[1]);
      return (v?.tipo || v?.tipo_dato || 'TEXTO') as TipoDato;
    }
    if (conclDestSeleccionada.startsWith('hecho:')) {
      const parts = conclDestSeleccionada.split(':');
      const h = hechos.find((item) => String(item.id) === parts[1]);
      return (h?.tipo_dato || 'TEXTO') as TipoDato;
    }
    return 'ENTERO';
  }, [conclDestSeleccionada, conclNuevaVarTipo, variables, hechos]);

  useEffect(() => {
    if (tipoDatoConclusion === 'BOOLEANO') {
      if (conclValor !== 'true' && conclValor !== 'false') {
        setConclValor('true');
      }
    } else {
      if (conclValor === 'true' || conclValor === 'false') {
        setConclValor('');
      }
    }
  }, [tipoDatoConclusion, conclValor]);

  // Validar valor según tipo
  const validarValor = (valor: string, tipo: TipoDato): string | null => {
    const v = valor.trim();
    if (!v) return 'El valor es obligatorio';
    if (tipo === 'BOOLEANO') {
      if (v.toLowerCase() !== 'true' && v.toLowerCase() !== 'false') {
        return 'El valor debe ser "true" o "false"';
      }
    } else if (tipo === 'ENTERO') {
      if (!/^-?\d+$/.test(v)) {
        return 'Debe ser un número entero válido (ej: 0, 5, -2)';
      }
    } else if (tipo === 'DECIMAL') {
      if (isNaN(Number(v)) || !/^-?\d+(\.\d+)?$/.test(v)) {
        return 'Debe ser un número decimal válido (ej: 12.5)';
      }
    }
    return null;
  };

  // Helper para resolver nombre en UI
  const resolverNombreVarHecho = (idVar?: string | number | null, idHecho?: string | number | null, fallback?: string) => {
    if (idVar) {
      const v = variables.find((item) => String(item.id) === String(idVar));
      if (v) return v.nombre;
    }
    if (idHecho) {
      const h = hechos.find((item) => String(item.id) === String(idHecho));
      if (h) return h.nombre;
    }
    return fallback || 'Entidad';
  };

  // ================= ACCIONES CONDICIONES =================
  const handleAddCondicion = async () => {
    setCondError(null);
    let nombreVarRef = '';
    let varId: string | number | null = null;
    let hechoId: string | number | null = null;
    let esNueva = false;

    if (condRefSeleccionada === '__NUEVA_VARIABLE__') {
      if (!condNuevaVarNombre.trim()) {
        setCondError('Ingresa el nombre de la nueva variable');
        return;
      }
      nombreVarRef = condNuevaVarNombre.trim();
      esNueva = true;
    } else if (condRefSeleccionada.startsWith('var:')) {
      const parts = condRefSeleccionada.split(':');
      varId = parts[1];
      nombreVarRef = parts[2];
    } else if (condRefSeleccionada.startsWith('hecho:')) {
      const parts = condRefSeleccionada.split(':');
      hechoId = parts[1];
      nombreVarRef = parts[2];
    } else {
      setCondError('Selecciona una variable o hecho');
      return;
    }

    const errorVal = validarValor(condValor, tipoDatoCondicion);
    if (errorVal) {
      setCondError(errorVal);
      return;
    }

    if (reglaActiva) {
      // Regla existente: persistir inmediatamente
      try {
        setIsSubmitting(true);
        if (esNueva && baseConocimientoId) {
          const createdVar = await crearVariableMut.mutateAsync({
            nombre: nombreVarRef,
            tipo: condNuevaVarTipo,
            descripcion: 'Variable generada desde regla',
          });
          varId = createdVar.id;
        }

        await agregarCondicion.mutateAsync({
          reglaId: reglaActiva.id,
          datos: {
            referencia: nombreVarRef,
            operador: condOperador,
            valor_esperado: condValor.trim(),
            variable_id: varId,
            hecho_id: hechoId,
            orden: (reglaActiva.condiciones?.length || 0) + 1,
          },
        });
        resetCondForm();
      } catch (err: unknown) {
        setCondError(err instanceof Error ? err.message : 'Error al agregar condición');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Nueva regla: guardar en borrador
      const nuevoDraft: ItemCondicion = {
        referencia: nombreVarRef,
        variable_id: varId,
        hecho_id: hechoId,
        operador: condOperador,
        valor_esperado: condValor.trim(),
        tipoDato: tipoDatoCondicion,
        esNuevaVariable: esNueva,
      };
      setDraftCondiciones((prev) => [...prev, nuevoDraft]);
      resetCondForm();
    }
  };

  const handleDeleteCondicion = async (item: ItemCondicion, index: number) => {
    if (reglaActiva && item.id) {
      try {
        await eliminarCondicion.mutateAsync(item.id);
      } catch (err: unknown) {
        console.warn('Condición ya no existe en backend:', err);
      }
    } else {
      setDraftCondiciones((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ================= ACCIONES CONCLUSIONES =================
  const handleAddConclusion = async () => {
    setConclError(null);
    let nombreDest = '';
    let varId: string | number | null = null;
    let hechoId: string | number | null = null;
    let esNueva = false;

    if (conclDestSeleccionada === '__NUEVA_VARIABLE__') {
      if (!conclNuevaVarNombre.trim()) {
        setConclError('Ingresa el nombre de la nueva variable');
        return;
      }
      nombreDest = conclNuevaVarNombre.trim();
      esNueva = true;
    } else if (conclDestSeleccionada.startsWith('var:')) {
      const parts = conclDestSeleccionada.split(':');
      varId = parts[1];
      nombreDest = parts[2];
    } else if (conclDestSeleccionada.startsWith('hecho:')) {
      const parts = conclDestSeleccionada.split(':');
      hechoId = parts[1];
      nombreDest = parts[2];
    } else {
      setConclError('Selecciona una variable o hecho consecuente');
      return;
    }

    const errorVal = validarValor(conclValor, tipoDatoConclusion);
    if (errorVal) {
      setConclError(errorVal);
      return;
    }

    if (reglaActiva) {
      // Regla existente: persistir inmediatamente
      try {
        setIsSubmitting(true);
        if (esNueva && baseConocimientoId) {
          const createdVar = await crearVariableMut.mutateAsync({
            nombre: nombreDest,
            tipo: conclNuevaVarTipo,
            descripcion: 'Variable generada desde regla',
          });
          varId = createdVar.id;
        }

        await agregarConclusion.mutateAsync({
          reglaId: reglaActiva.id,
          datos: {
            destino: nombreDest,
            valor_resultante: conclValor.trim(),
            variable_resultante_id: varId,
            hecho_resultante_id: hechoId,
          },
        });
        resetConclForm();
      } catch (err: unknown) {
        setConclError(err instanceof Error ? err.message : 'Error al agregar conclusión');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Nueva regla: guardar en borrador
      const nuevoDraft: ItemConclusion = {
        destino: nombreDest,
        variable_resultante_id: varId,
        hecho_resultante_id: hechoId,
        valor_resultante: conclValor.trim(),
        tipoDato: tipoDatoConclusion,
        esNuevaVariable: esNueva,
      };
      setDraftConclusiones((prev) => [...prev, nuevoDraft]);
      resetConclForm();
    }
  };

  const handleDeleteConclusion = async (item: ItemConclusion, index: number) => {
    if (reglaActiva && item.id) {
      try {
        await eliminarConclusion.mutateAsync(item.id);
      } catch (err: unknown) {
        console.warn('Conclusión ya no existe en backend:', err);
      }
    } else {
      setDraftConclusiones((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ================= GUARDAR REGLA =================
  const handleGuardarRegla = async () => {
    if (!nombre.trim()) {
      setFormError('El identificador o nombre de la regla es obligatorio');
      return;
    }

    if (!baseConocimientoId) {
      setFormError('No se encontró el ID de la base de conocimiento');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (reglaActiva) {
        // Actualizar datos de la regla
        await actualizar.mutateAsync({
          id: reglaActiva.id,
          datos: {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            prioridad: Number(prioridad),
            factor_certeza: Number(factorCerteza),
            activa,
          },
        });
        onClose();
      } else {
        // Crear nueva regla con todos sus borradores
        // 1. Crear variables que sean nuevas
        const mapaNuevasVars: Record<string, string | number> = {};

        // Recolectar variables nuevas de condiciones
        for (const c of draftCondiciones) {
          if (c.esNuevaVariable && !mapaNuevasVars[c.referencia]) {
            const vCreated = await baseConocimientoService.crearVariable(baseConocimientoId, {
              nombre: c.referencia,
              tipo: c.tipoDato,
              descripcion: 'Variable generada automáticamente',
            });
            mapaNuevasVars[c.referencia] = vCreated.id;
          }
        }

        // Recolectar variables nuevas de conclusiones
        for (const conc of draftConclusiones) {
          if (conc.esNuevaVariable && !mapaNuevasVars[conc.destino]) {
            const vCreated = await baseConocimientoService.crearVariable(baseConocimientoId, {
              nombre: conc.destino,
              tipo: conc.tipoDato,
              descripcion: 'Variable generada automáticamente',
            });
            mapaNuevasVars[conc.destino] = vCreated.id;
          }
        }

        // 2. Crear la regla
        const nuevaRegla = await crear.mutateAsync({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          prioridad: Number(prioridad),
          factor_certeza: Number(factorCerteza),
          activa,
        });

        // 3. Crear todas las condiciones
        for (let i = 0; i < draftCondiciones.length; i++) {
          const cond = draftCondiciones[i];
          const varId = cond.esNuevaVariable ? mapaNuevasVars[cond.referencia] : cond.variable_id;
          await baseConocimientoService.agregarCondicion(nuevaRegla.id, {
            referencia: cond.referencia,
            operador: cond.operador,
            valor_esperado: cond.valor_esperado,
            variable_id: varId,
            hecho_id: cond.hecho_id,
            orden: i + 1,
          });
        }

        // 4. Crear todas las conclusiones
        for (const conc of draftConclusiones) {
          const varId = conc.esNuevaVariable ? mapaNuevasVars[conc.destino] : conc.variable_resultante_id;
          await baseConocimientoService.agregarConclusion(nuevaRegla.id, {
            destino: conc.destino,
            valor_resultante: conc.valor_resultante,
            variable_resultante_id: varId,
            hecho_resultante_id: conc.hecho_resultante_id,
          });
        }

        onClose();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Ocurrió un error al guardar la regla');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Condiciones actuales a mostrar
  const condicionesActuales: ItemCondicion[] = reglaActiva
    ? (reglaActiva.condiciones || []).map((c) => {
        const raw = c as unknown as Record<string, unknown>;
        return {
          id: c.id,
          referencia: c.referencia || String(raw.campo || raw.nombre || 'Premisa'),
          variable_id: c.variable_id ?? (raw.variable_id as string | number),
          hecho_id: c.hecho_id ?? (raw.hecho_id as string | number),
          operador: c.operador === '=' ? '==' : c.operador || '==',
          valor_esperado: c.valor_esperado,
          tipoDato: 'TEXTO',
        };
      })
    : draftCondiciones;

  // Conclusiones actuales a mostrar
  const conclusionesActuales: ItemConclusion[] = reglaActiva
    ? (reglaActiva.conclusiones || []).map((c) => {
        const raw = c as unknown as Record<string, unknown>;
        return {
          id: c.id,
          destino: c.destino || String(raw.variable_nombre || raw.nombre || 'Resultado'),
          variable_resultante_id: c.variable_resultante_id ?? (raw.variable_resultante_id as string | number),
          hecho_resultante_id: c.hecho_resultante_id ?? (raw.hecho_resultante_id as string | number),
          valor_resultante: c.valor_resultante,
          tipoDato: 'TEXTO',
        };
      })
    : draftConclusiones;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reglaActiva ? `Editar Regla ${reglaActiva.nombre}` : 'Crear Nueva Regla de Inferencia'}
      description="Define las premisas (IF) unidas con AND y las consecuencias (THEN) generadas por la regla."
      size="lg"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 text-left">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {formError}
          </div>
        )}

        {/* Pestañas de navegación interna dentro del modal */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('propiedades')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'propiedades'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Propiedades</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('condiciones')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'condiciones'
                ? 'bg-white text-amber-800 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Premisas (IF)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'condiciones'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {condicionesActuales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conclusiones')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'conclusiones'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Consecuencias (THEN)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'conclusiones'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {conclusionesActuales.length}
            </span>
          </button>
        </div>

        {/* ================= PESTAÑA 1: METADATOS DE LA REGLA ================= */}
        {activeTab === 'propiedades' && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Propiedades de la Regla
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nombre / Identificador"
                placeholder="Ej: R1, R2, Regla_Gripe"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <Input
                label="Prioridad (>= 0)"
                type="number"
                step="1"
                min="0"
                value={prioridad}
                onChange={(e) => setPrioridad(Number(e.target.value))}
                helperText="Mayor número = mayor prioridad"
                required
              />
              <Input
                label="Factor Certeza (0 a 1)"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={factorCerteza}
                onChange={(e) => setFactorCerteza(Number(e.target.value))}
                helperText="1.00 = 100% de certeza"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <Textarea
                  label="Descripción (opcional)"
                  placeholder="Explicación lógica o justificación teórica de esta regla..."
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="modal_regla_activa"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="modal_regla_activa"
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                >
                  Regla Activa
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab('condiciones')}
              >
                Siguiente: Premisas (IF)
              </Button>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 2: CONDICIONES (IF) ================= */}
        {activeTab === 'condiciones' && (
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-amber-600" />
                Premisas / Condiciones (SI... / IF)
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
                Unidas por AND estático
              </span>
            </div>

            {/* Lista de condiciones actuales */}
            {condicionesActuales.length === 0 ? (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-amber-200">
                <p className="text-xs text-slate-500 italic mb-2">
                  Aún no hay premisas agregadas para esta regla.
                </p>
                {!mostrarFormCondicion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setMostrarFormCondicion(true)}
                    className="text-amber-900 border-amber-300 hover:bg-amber-50"
                  >
                    Agregar primera condición (IF)
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {condicionesActuales.map((cond, idx) => {
                  const nombreItem = resolverNombreVarHecho(cond.variable_id, cond.hecho_id, cond.referencia);
                  const esPrimer = idx === 0;

                  return (
                    <div
                      key={cond.id || idx}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            esPrimer
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {esPrimer ? 'IF' : 'AND'}
                        </span>
                        <span className="font-semibold text-slate-900">{nombreItem}</span>
                        <span className="font-bold text-amber-700">{cond.operador}</span>
                        <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold text-slate-900">
                          {cond.valor_esperado}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCondicion(cond, idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Eliminar condición"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulario retraíble para agregar condición */}
            <div className="bg-white rounded-xl border border-amber-200 shadow-2xs overflow-hidden mt-2">
              <button
                type="button"
                onClick={() => setMostrarFormCondicion((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 bg-amber-50/50 hover:bg-amber-100/60 transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1 rounded-md transition-colors ${
                      mostrarFormCondicion ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Plus
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mostrarFormCondicion ? 'rotate-45' : ''
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {mostrarFormCondicion ? 'Ocultar formulario de condición' : '+ Agregar Condición (IF)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                  <span>{mostrarFormCondicion ? 'Plegar' : 'Desplegar'}</span>
                  {mostrarFormCondicion ? (
                    <ChevronUp className="w-4 h-4 text-amber-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-amber-700" />
                  )}
                </div>
              </button>

              {mostrarFormCondicion && (
                <div className="p-3 border-t border-amber-200/80 space-y-3">
                  {condError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {condError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <Select
                        label="Variable o Hecho"
                        options={opcionesReferencia}
                        value={condRefSeleccionada}
                        onChange={(e) => {
                          setCondRefSeleccionada(e.target.value);
                          setCondError(null);
                        }}
                      />
                    </div>

                    <div>
                      <Select
                        label="Operador"
                        options={
                          tipoDatoCondicion === 'BOOLEANO'
                            ? [
                                { value: '==', label: '== (Igual a)' },
                                { value: '!=', label: '!= (Diferente de)' },
                              ]
                            : [
                                { value: '==', label: '== (Igual a)' },
                                { value: '!=', label: '!= (Diferente de)' },
                                { value: '>', label: '> (Mayor)' },
                                { value: '<', label: '< (Menor)' },
                                { value: '>=', label: '>= (Mayor o igual)' },
                                { value: '<=', label: '<= (Menor o igual)' },
                              ]
                        }
                        value={condOperador}
                        onChange={(e) => setCondOperador(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Si eligió crear nueva variable */}
                  {condRefSeleccionada === '__NUEVA_VARIABLE__' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-amber-50/60 rounded-lg border border-amber-200">
                      <Input
                        label="Nombre de la nueva variable"
                        placeholder="Ej: D, nivel_glucosa..."
                        value={condNuevaVarNombre}
                        onChange={(e) => setCondNuevaVarNombre(e.target.value)}
                        required
                      />
                      <Select
                        label="Tipo de Dato"
                        options={[
                          { value: 'ENTERO', label: 'ENTERO (0, 1, 2...)' },
                          { value: 'DECIMAL', label: 'DECIMAL (0.5, 38.2...)' },
                          { value: 'BOOLEANO', label: 'BOOLEANO (true / false)' },
                          { value: 'TEXTO', label: 'TEXTO' },
                        ]}
                        value={condNuevaVarTipo}
                        onChange={(e) => setCondNuevaVarTipo(e.target.value as TipoDato)}
                      />
                    </div>
                  )}

                  {/* Input adaptativo del valor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Valor Esperado *
                      </label>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        Tipo: {tipoDatoCondicion}
                      </span>
                    </div>

                    {tipoDatoCondicion === 'BOOLEANO' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCondValor('true')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            condValor !== 'false'
                              ? 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          true (Verdadero)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCondValor('false')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            condValor === 'false'
                              ? 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          false (Falso)
                        </button>
                      </div>
                    ) : (
                      <Input
                        type={tipoDatoCondicion === 'ENTERO' || tipoDatoCondicion === 'DECIMAL' ? 'number' : 'text'}
                        step={tipoDatoCondicion === 'ENTERO' ? '1' : tipoDatoCondicion === 'DECIMAL' ? 'any' : undefined}
                        placeholder={
                          tipoDatoCondicion === 'ENTERO'
                            ? 'Ej: 0, 10'
                            : tipoDatoCondicion === 'DECIMAL'
                            ? 'Ej: 0.5, 38.5'
                            : 'Ej: alto, normal...'
                        }
                        value={condValor}
                        onChange={(e) => setCondValor(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarFormCondicion(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddCondicion}
                      disabled={isSubmitting}
                      className="text-amber-900 border-amber-300 hover:bg-amber-50"
                    >
                      Añadir Condición (IF)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-amber-200/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab('propiedades')}
              >
                Propiedades
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab('conclusiones')}
              >
                Siguiente: Consecuencias (THEN)
              </Button>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 3: CONCLUSIONES (THEN) ================= */}
        {activeTab === 'conclusiones' && (
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Consecuencias / Deducciones (ENTONCES... / THEN)
              </span>
            </div>

            {/* Lista de conclusiones actuales */}
            {conclusionesActuales.length === 0 ? (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-emerald-200">
                <p className="text-xs text-slate-500 italic mb-2">
                  Aún no hay consecuencias. Agrega el resultado que deducirá esta regla.
                </p>
                {!mostrarFormConclusion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setMostrarFormConclusion(true)}
                    className="text-emerald-900 border-emerald-300 hover:bg-emerald-50"
                  >
                    Agregar primera consecuencia (THEN)
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {conclusionesActuales.map((concl, idx) => {
                  const nombreItem = resolverNombreVarHecho(
                    concl.variable_resultante_id,
                    concl.hecho_resultante_id,
                    concl.destino
                  );
                  const esPrimer = idx === 0;

                  return (
                    <div
                      key={concl.id || idx}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                            esPrimer
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {esPrimer ? 'THEN' : 'AND'}
                        </span>
                        <span className="font-semibold text-slate-900">{nombreItem}</span>
                        <span className="font-bold text-emerald-700">=</span>
                        <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold text-emerald-950">
                          {concl.valor_resultante}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteConclusion(concl, idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Eliminar conclusión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulario retraíble para agregar conclusión */}
            <div className="bg-white rounded-xl border border-emerald-200 shadow-2xs overflow-hidden mt-2">
              <button
                type="button"
                onClick={() => setMostrarFormConclusion((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors cursor-pointer text-left select-none"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1 rounded-md transition-colors ${
                      mostrarFormConclusion ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Plus
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mostrarFormConclusion ? 'rotate-45' : ''
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {mostrarFormConclusion ? 'Ocultar formulario de consecuencia' : '+ Agregar Consecuencia (THEN)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                  <span>{mostrarFormConclusion ? 'Plegar' : 'Desplegar'}</span>
                  {mostrarFormConclusion ? (
                    <ChevronUp className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
              </button>

              {mostrarFormConclusion && (
                <div className="p-3 border-t border-emerald-200/80 space-y-3">
                  {conclError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {conclError}
                    </p>
                  )}

                  <div>
                    <Select
                      label="Variable o Hecho Consecuente"
                      options={opcionesReferencia}
                      value={conclDestSeleccionada}
                      onChange={(e) => {
                        setConclDestSeleccionada(e.target.value);
                        setConclError(null);
                      }}
                    />
                  </div>

                  {/* Si eligió crear nueva variable */}
                  {conclDestSeleccionada === '__NUEVA_VARIABLE__' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-200">
                      <Input
                        label="Nombre de la nueva variable"
                        placeholder="Ej: F, diagnostico..."
                        value={conclNuevaVarNombre}
                        onChange={(e) => setConclNuevaVarNombre(e.target.value)}
                        required
                      />
                      <Select
                        label="Tipo de Dato"
                        options={[
                          { value: 'ENTERO', label: 'ENTERO (0, 1, 2...)' },
                          { value: 'DECIMAL', label: 'DECIMAL (0.5, 38.2...)' },
                          { value: 'BOOLEANO', label: 'BOOLEANO (true / false)' },
                          { value: 'TEXTO', label: 'TEXTO' },
                        ]}
                        value={conclNuevaVarTipo}
                        onChange={(e) => setConclNuevaVarTipo(e.target.value as TipoDato)}
                      />
                    </div>
                  )}

                  {/* Input adaptativo del valor resultante */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Valor Resultante / Deducción *
                      </label>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                        Tipo: {tipoDatoConclusion}
                      </span>
                    </div>

                    {tipoDatoConclusion === 'BOOLEANO' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setConclValor('true')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            conclValor !== 'false'
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          true (Verdadero)
                        </button>
                        <button
                          type="button"
                          onClick={() => setConclValor('false')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            conclValor === 'false'
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          false (Falso)
                        </button>
                      </div>
                    ) : (
                      <Input
                        type={tipoDatoConclusion === 'ENTERO' || tipoDatoConclusion === 'DECIMAL' ? 'number' : 'text'}
                        step={tipoDatoConclusion === 'ENTERO' ? '1' : tipoDatoConclusion === 'DECIMAL' ? 'any' : undefined}
                        placeholder={
                          tipoDatoConclusion === 'ENTERO'
                            ? 'Ej: 0, 10'
                            : tipoDatoConclusion === 'DECIMAL'
                            ? 'Ej: 0.5, 38.5'
                            : 'Ej: Faringitis, Requiere aislamiento...'
                        }
                        value={conclValor}
                        onChange={(e) => setConclValor(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarFormConclusion(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddConclusion}
                      disabled={isSubmitting}
                      className="text-emerald-900 border-emerald-300 hover:bg-emerald-50"
                    >
                      Añadir Conclusión (THEN)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-start pt-3 border-t border-emerald-200/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab('condiciones')}
              >
                Anterior: Premisas (IF)
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción del Modal */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Resumen: <strong className="text-slate-800">{condicionesActuales.length}</strong> premisa(s) ·{' '}
            <strong className="text-slate-800">{conclusionesActuales.length}</strong> consecuencia(s)
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleGuardarRegla}
              loading={isSubmitting}
            >
              {reglaActiva ? 'Guardar Cambios' : 'Crear Regla'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReglaEditorModal;
