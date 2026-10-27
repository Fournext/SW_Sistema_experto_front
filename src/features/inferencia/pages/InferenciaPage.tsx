import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useActividadNavigate } from '@/hooks/useActividadNavigate';
import {
  Play,
  RotateCcw,
  ArrowLeft,
  Cpu,
  History,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import type { Hecho, TipoDato } from '@/features/base-conocimiento/types/types';
import type { EntradaTrabajo } from '@/features/actividades/types/trabajo';
import { useQueryClient } from '@tanstack/react-query';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';
import {
  useBaseConocimiento,
  useHechos,
  useVariables,
  useReglas,
  HECHOS_KEY,
  BASE_CONOCIMIENTO_KEY,
} from '@/features/base-conocimiento/hooks/useBaseConocimiento';
import {
  useEjecutarInferencia,
  useInferencia,
  useDetallesInferencia,
  useIniciarSimulacion,
  useAvanzarPasoSimulacion,
  useControlarSimulacion,
  useConflictosInferencia,
  useHechosInferidos,
  INFERENCIA_DETALLES_KEY,
  INFERENCIA_CONFLICTOS_KEY,
  INFERENCIA_HECHOS_KEY,
} from '../hooks/useInferencia';
import type { DetalleInferencia, EjecucionInferencia, HechoDeducido, ModoAvanceSimulacion } from '../types/types';

import HechosGeneradosPanel from '../components/HechosGeneradosPanel';
import ConflictosPanel from '../components/ConflictosPanel';
import ControlesSimulacionBar from '../components/ControlesSimulacionBar';
import ExplicacionConclusionModal from '../components/ExplicacionConclusionModal';
import ReglasEvaluadasPanel from '../components/ReglasEvaluadasPanel';
import ReglasActivadasPanel from '../components/ReglasActivadasPanel';
import ConclusionFinalPanel from '../components/ConclusionFinalPanel';
import TrazabilidadFlow from '../components/TrazabilidadFlow';
import PreguntaReglaModal, { type PreguntaEvaluacion } from '../components/PreguntaReglaModal';
import CuestionarioConsultaModal from '../components/CuestionarioConsultaModal';
import ValidacionPreviaModal, { type BloqueoValidacion } from '../components/ValidacionPreviaModal';
import { useValidarBase } from '@/features/validacion/hooks/useValidacion';

import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/feedback/ErrorMessage';
import { Permisos, usePuede } from '@/config/permisos';

type RespuestasEvaluacion = Record<string, {
  nombre: string;
  valor: string;
  tipo_dato?: string;
  opciones?: string[];
}>;

export const InferenciaPage: React.FC<{ entradasActividad?: EntradaTrabajo[] }> = ({ entradasActividad }) => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useActividadNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const puedeEjecutar = usePuede(Permisos.INFERENCIA_EJECUTAR);
  const puedeIniciar = usePuede(Permisos.SIMULACION_INICIAR);
  const puedeControlar = usePuede(Permisos.SIMULACION_CONTROLAR);
  const puedeHistorial = usePuede(Permisos.INFERENCIA_HISTORIAL_VER);
  const puedeTrazabilidad = usePuede(Permisos.INFERENCIA_TRAZABILIDAD_VER);
  const puedeExplicacion = usePuede(Permisos.INFERENCIA_EXPLICACION_VER);
  const puedeValidacion = usePuede(Permisos.VALIDACION_VER);

  const { data: sistema, isLoading: isSistemaLoading } = useSistemaExperto(sistemaId);
  const { data: baseConocimiento } = useBaseConocimiento(sistemaId);
  const effectiveBaseId = baseConocimiento?.id ? String(baseConocimiento.id) : sistemaId;
  const { data: hechosBC = [] } = useHechos(entradasActividad === undefined ? effectiveBaseId : undefined);
  const { data: variables = [] } = useVariables(entradasActividad === undefined ? effectiveBaseId : undefined);
  const { data: reglas = [] } = useReglas(entradasActividad === undefined ? effectiveBaseId : undefined);
  const hechosIniciales: Hecho[] = useMemo(() => entradasActividad === undefined ? hechosBC : entradasActividad.map((entrada) => ({
    ...entrada, id: entrada.id ?? entrada.nombre, valor: String(entrada.valor ?? ''), es_inicial: true,
  })), [entradasActividad, hechosBC]);

  // Detectar variables y hechos iniciales (o con pregunta) verificados por las condiciones de las reglas
  const variablesOHechosInicialesEnReglas = useMemo(() => {
    if (entradasActividad !== undefined) return new Set(entradasActividad.map((e) => e.nombre.trim().toLowerCase()));
    const varsMap = new Map<string, typeof variables[0]>();
    variables.forEach((v) => {
      if (v.es_inicial || Boolean(v.pregunta && v.pregunta.trim())) {
        varsMap.set(String(v.id), v);
        varsMap.set(v.nombre.toLowerCase().trim(), v);
      }
    });

    const hechosMap = new Map<string, typeof hechosIniciales[0]>();
    hechosIniciales.forEach((h) => {
      if (h.es_inicial !== false || Boolean(h.pregunta && h.pregunta.trim())) {
        hechosMap.set(String(h.id), h);
        hechosMap.set(h.nombre.toLowerCase().trim(), h);
      }
    });

    const conjunto = new Set<string>();

    reglas.forEach((r) => {
      if (!r.activa) return;
      (r.condiciones || []).forEach((c) => {
        const ref = (c.referencia || c.variable_nombre || c.hecho_nombre || '').toLowerCase().trim();
        const varDirecta = c.variable_id ? varsMap.get(String(c.variable_id)) : null;
        const varRef = ref ? varsMap.get(ref) : null;
        const v = varDirecta || varRef;
        if (v) {
          conjunto.add(v.nombre.toLowerCase().trim());
        }

        const hechoDirecto = c.hecho_id ? hechosMap.get(String(c.hecho_id)) : null;
        const hechoRef = ref ? hechosMap.get(ref) : null;
        const h = hechoDirecto || hechoRef;
        if (h) {
          conjunto.add(h.nombre.toLowerCase().trim());
        }
      });
    });

    return conjunto;
  }, [reglas, variables, hechosIniciales, entradasActividad]);

  const hayVariablesInicialesEnReglas = variablesOHechosInicialesEnReglas.size > 0;

  // Selector de Modo: Directo o Simulación Interactiva
  const [esModoSimulacion, setEsModoSimulacion] = useState<boolean>(puedeIniciar);

  // Mutaciones
  const ejecutarInferencia = useEjecutarInferencia(sistemaId);
  const iniciarSimulacion = useIniciarSimulacion(sistemaId);
  const avanzarPasoSimulacion = useAvanzarPasoSimulacion();
  const controlarSimulacion = useControlarSimulacion();
  const validarBase = useValidarBase();
  const [validandoBC, setValidandoBC] = useState(false);
  const validacionEnCurso = useRef(false);
  const [bloqueoValidacion, setBloqueoValidacion] = useState<BloqueoValidacion | null>(null);

  const validarAntesDeInferir = async (): Promise<boolean> => {
    if (validacionEnCurso.current) return false;
    if (!baseConocimiento?.id) {
      setBloqueoValidacion({ mensaje: 'No se pudo identificar la base de conocimiento. Espera a que termine de cargar e inténtalo nuevamente.' });
      return false;
    }
    validacionEnCurso.current = true;
    setValidandoBC(true);
    try {
      const resultado = await validarBase.mutateAsync(String(baseConocimiento.id));
      if (!resultado.es_valida || resultado.total_errores > 0) {
        setBloqueoValidacion({
          mensaje: 'La base de conocimiento contiene errores. Corrígelos antes de iniciar la inferencia.',
          resultado,
        });
        return false;
      }
      setBloqueoValidacion(null);
      return true;
    } catch {
      setBloqueoValidacion({ mensaje: 'No se pudo validar la base de conocimiento. Inténtalo nuevamente antes de iniciar la inferencia.' });
      return false;
    } finally {
      validacionEnCurso.current = false;
      setValidandoBC(false);
    }
  };

  // Estado local de la sesión activa
  const [resultadoInferencia, setResultadoInferencia] = useState<EjecucionInferencia | null>(null);
  const [inferenciaIdActual, setInferenciaIdActual] = useState<string | null>(() => searchParams.get('simulacion'));
  const [restaurandoId, setRestaurandoId] = useState<string | null>(() => searchParams.get('simulacion'));
  const restauracion = useInferencia(restaurandoId || undefined);
  const [modalExplicacionAbierto, setModalExplicacionAbierto] = useState<boolean>(false);
  const [modalPreguntaReglaAbierto, setModalPreguntaReglaAbierto] = useState<boolean>(false);
  const [modalCuestionarioDirectoAbierto, setModalCuestionarioDirectoAbierto] = useState<boolean>(false);
  const [preguntaReglaActiva, setPreguntaReglaActiva] = useState<PreguntaEvaluacion | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<'INICIAR' | 'AVANZAR' | null>(null);
  const [respuestasAcumuladas, setRespuestasAcumuladas] = useState<
    Record<string, { nombre: string; valor: string; tipo_dato?: string; opciones?: string[] }>
  >({});
  // Respuestas recogidas durante el avance actual, aún no enviadas al motor.
  const respuestasPendientesPaso = useRef<RespuestasEvaluacion>({});
  const modoAvancePendiente = useRef<ModoAvanceSimulacion>('COMPLETO');

  const recordarSimulacion = (id: string | null) => {
    setSearchParams((actuales) => {
      const parametros = new URLSearchParams(actuales);
      if (id) parametros.set('simulacion', id);
      else parametros.delete('simulacion');
      return parametros;
    }, { replace: true });
  };

  useEffect(() => {
    if (!restaurandoId || !restauracion.data) return;
    setResultadoInferencia(restauracion.data);
    const respuestas: RespuestasEvaluacion = {};
    for (const hecho of restauracion.data.hechos_iniciales_snapshot || []) {
      respuestas[hecho.nombre.trim().toLowerCase()] = {
        ...hecho, valor: String(hecho.valor ?? ''),
      };
    }
    setRespuestasAcumuladas(respuestas);
    setRestaurandoId(null);
  }, [restaurandoId, restauracion.data]);

  // Queries reactivas para detalles, conflictos y hechos inferidos
  const { data: detallesApi = [] } = useDetallesInferencia(puedeTrazabilidad ? inferenciaIdActual || undefined : undefined);
  const { data: conflictosApi = [] } = useConflictosInferencia(puedeTrazabilidad ? inferenciaIdActual || undefined : undefined);
  const { data: hechosInferidosApi = [] } = useHechosInferidos(inferenciaIdActual || undefined);

  // Trazabilidad combinada
  const detallesCombinados: DetalleInferencia[] =
    (resultadoInferencia?.reglas_evaluadas && resultadoInferencia.reglas_evaluadas.length > 0
      ? resultadoInferencia.reglas_evaluadas
      : null) ||
    (resultadoInferencia?.detalles && resultadoInferencia.detalles.length > 0
      ? resultadoInferencia.detalles
      : null) ||
    (detallesApi && detallesApi.length > 0
      ? detallesApi
      : []) ||
    [];

  // Ordenar reglas activas por prioridad descendente (las de mayor prioridad se analizan primero)
  const reglasOrdenadas = useMemo(() => {
    return [...reglas]
      .filter((r) => r.activa)
      .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));
  }, [reglas]);

  // Buscar si una regla específica tiene alguna condición cuya variable o hecho sea inicial y esté pendiente
  const buscarPreguntaPendienteEnRegla = (
    regla: typeof reglas[0],
    respuestasActuales: Record<string, { nombre: string; valor: string; tipo_dato?: string; opciones?: string[] }>
  ): PreguntaEvaluacion | null => {
    const varsMap = new Map<string, typeof variables[0]>();
    variables.forEach((v) => {
      varsMap.set(String(v.id), v);
      varsMap.set(v.nombre.toLowerCase().trim(), v);
    });

    const hechosMap = new Map<string, typeof hechosIniciales[0]>();
    hechosIniciales.forEach((h) => {
      hechosMap.set(String(h.id), h);
      hechosMap.set(h.nombre.toLowerCase().trim(), h);
    });

    for (const c of regla.condiciones || []) {
      const ref = (c.referencia || c.variable_nombre || c.hecho_nombre || '').toLowerCase().trim();
      const varDirecta = c.variable_id ? varsMap.get(String(c.variable_id)) : null;
      const varRef = ref ? varsMap.get(ref) : null;
      const v = varDirecta || varRef;

      const hechoDirecto = c.hecho_id ? hechosMap.get(String(c.hecho_id)) : null;
      const hechoRef = ref ? hechosMap.get(ref) : null;
      const h = hechoDirecto || hechoRef;

      const esVarInicial = Boolean(v && (v.es_inicial || (v.pregunta && v.pregunta.trim())));
      const esHechoInicial = Boolean(h && (h.es_inicial !== false || (h.pregunta && h.pregunta.trim())));

      if (esVarInicial || esHechoInicial) {
        const nombre = v ? v.nombre : (h?.nombre || ref);
        const normKey = nombre.toLowerCase().trim();

        // Si ya fue respondida en esta sesión, no está pendiente
        if (respuestasActuales[normKey]) {
          continue;
        }

        const preguntaTexto =
          (v?.pregunta && v.pregunta.trim())
            ? v.pregunta
            : (h?.pregunta && h.pregunta.trim())
            ? h.pregunta
            : `¿Cuál es el valor para ${nombre}?`;

        const op = c.operador || '=';
        const valEsp = c.valor_esperado || '';
        const condicionTexto = `${nombre} ${op} ${valEsp}`;

        return {
          reglaNombre: regla.nombre,
          reglaDescripcion: regla.descripcion,
          condicionTexto,
          nombreVariable: nombre,
          pregunta: preguntaTexto,
          tipoDato: ((v?.tipo || v?.tipo_dato || h?.tipo_dato || 'TEXTO') as TipoDato),
          opciones: v?.opciones || h?.opciones,
          valorActual:
            v?.valor_por_defecto ||
            v?.valor_defecto ||
            (h?.valor !== undefined && h?.valor !== null ? String(h.valor) : ''),
          origen: v ? 'VARIABLE' : 'HECHO',
        };
      }
    }

    return null;
  };

  const buscarPreguntaPendiente = (
    respuestas: RespuestasEvaluacion,
    excluirEjecutadas = false
  ): PreguntaEvaluacion | null => {
    if (entradasActividad !== undefined) {
      const entrada = entradasActividad.find((e) => !respuestas[e.nombre.trim().toLowerCase()]);
      return entrada ? {
        reglaNombre: 'Datos iniciales de la actividad', nombreVariable: entrada.nombre,
        pregunta: entrada.pregunta || `¿Cuál es el valor para ${entrada.nombre}?`,
        tipoDato: entrada.tipo_dato, opciones: entrada.opciones,
        valorActual: String(entrada.valor ?? ''), origen: 'HECHO',
      } : null;
    }
    const ejecutadas = new Set<string>();
    if (excluirEjecutadas) {
      detallesCombinados.forEach((d) => {
        if (d.estado !== 'EJECUTADA') return;
        const nombre = (typeof d.regla === 'string' ? d.regla : d.regla?.nombre)
          || d.nombre_regla || d.regla_nombre;
        if (nombre) ejecutadas.add(nombre.toLowerCase().trim());
      });
    }
    for (const regla of reglasOrdenadas) {
      if (ejecutadas.has(regla.nombre.toLowerCase().trim())) continue;
      const pregunta = buscarPreguntaPendienteEnRegla(regla, respuestas);
      if (pregunta) return pregunta;
    }
    return null;
  };

  const avanzarConRespuestasPendientes = async () => {
    if (!inferenciaIdActual || !puedeControlar) return;
    const hechosNuevos = Object.values(respuestasPendientesPaso.current);
    try {
      const resp = await avanzarPasoSimulacion.mutateAsync({
        simulacionId: inferenciaIdActual,
        ...(hechosNuevos.length || modoAvancePendiente.current === 'POR_REGLA' ? {
          datos: {
            ...(hechosNuevos.length ? { hechos_nuevos: hechosNuevos } : {}),
            ...(modoAvancePendiente.current === 'POR_REGLA' ? { modo_evaluacion: 'POR_REGLA' } : {}),
          },
        } : {}),
      });
      respuestasPendientesPaso.current = {};
      setResultadoInferencia(resp);
    } catch {
      // Conservar las respuestas para reintentar sin volver a preguntarlas.
    }
  };

  // Ejecución con las respuestas acumuladas y hechos de la base
  const ejecutarConRespuestas = async (
    respuestas: Record<string, { nombre: string; valor: string; tipo_dato?: string; opciones?: string[] }>,
    esSimulacion: boolean
  ) => {
    if (!await validarAntesDeInferir()) return;
    const listaRespuestas = Object.values(respuestas);
    const nombresRespuestas = new Set(listaRespuestas.map((r) => r.nombre.trim().toLowerCase()));
    const hechosRestantes = hechosIniciales
      .filter((h) => !nombresRespuestas.has(h.nombre.trim().toLowerCase()))
      .map((h) => ({
        nombre: h.nombre,
        valor: String(h.valor ?? ''),
        tipo_dato: h.tipo_dato,
        opciones: h.opciones,
      }));
    const payloadFinal = [...listaRespuestas, ...hechosRestantes];

    try {
      if (esSimulacion) {
        if (!puedeIniciar) return;
        const resp = await iniciarSimulacion.mutateAsync({
          hechos_iniciales: payloadFinal,
        });
        setResultadoInferencia(resp);
        const idEjecucion = resp?.id || resp?.ejecucion_id;
        if (idEjecucion) {
          setInferenciaIdActual(String(idEjecucion));
          recordarSimulacion(String(idEjecucion));
        }
      } else {
        if (!puedeEjecutar) return;
        const resp = await ejecutarInferencia.mutateAsync({
          hechos_iniciales: payloadFinal,
        });
        setResultadoInferencia(resp);
        const idEjecucion = resp?.id || resp?.ejecucion_id;
        if (idEjecucion) setInferenciaIdActual(String(idEjecucion));
      }
    } catch {
      // Error manejado en UI
    }
  };

  // Handlers para Modo Directo: permite responder todas las preguntas de golpe
  const handleEjecutarDirecto = async () => {
    if (!puedeEjecutar) return;

    // Si existen variables o hechos iniciales con preguntas en las reglas y aún no se han respondido:
    if (hayVariablesInicialesEnReglas && Object.keys(respuestasAcumuladas).length === 0) {
      if (!await validarAntesDeInferir()) return;
      setModalCuestionarioDirectoAbierto(true);
      return;
    }

    // Si ya fueron respondidas o no hay preguntas, ejecutar directamente
    await ejecutarConRespuestas(respuestasAcumuladas, false);
  };

  const handleConfirmarCuestionarioDirecto = async (
    respuestas: Array<{ nombre: string; valor: string; tipo_dato?: string; opciones?: string[] }>
  ) => {
    const mapaActualizado = { ...respuestasAcumuladas };
    respuestas.forEach((r) => {
      mapaActualizado[r.nombre.toLowerCase().trim()] = r;
    });
    setRespuestasAcumuladas(mapaActualizado);
    setModalCuestionarioDirectoAbierto(false);

    // Dispara inmediatamente la inferencia directa con todas las respuestas recopiladas de golpe
    await ejecutarConRespuestas(mapaActualizado, false);
  };

  // Recoger los datos iniciales de todas las reglas antes de iniciar la simulación.
  const handleIniciarSimulacion = async () => {
    if (!puedeIniciar) return;

    const preguntaPendiente = buscarPreguntaPendiente(respuestasAcumuladas);

    // Preguntar en orden de prioridad, reutilizando los datos compartidos entre reglas.
    if (preguntaPendiente) {
      if (!await validarAntesDeInferir()) return;
      setAccionPendiente('INICIAR');
      setPreguntaReglaActiva(preguntaPendiente);
      setModalPreguntaReglaAbierto(true);
      return;
    }

    // Iniciar solo cuando no queden preguntas pendientes.
    await ejecutarConRespuestas(respuestasAcumuladas, true);
  };

  // Avanzar Paso en Simulación: analiza todas las reglas activables, resuelve el conflicto determinísticamente
  // y dispara paso a paso la regla ganadora hasta agotar reglas activables.
  const handleAvanzarPaso = async (modo: ModoAvanceSimulacion = 'COMPLETO') => {
    if (!inferenciaIdActual || !puedeControlar) return;
    modoAvancePendiente.current = modo;

    const preguntaPendiente = buscarPreguntaPendiente(respuestasAcumuladas, true);

    // Completar todas las entradas antes de que el motor evalúe el conjunto de reglas.
    if (preguntaPendiente) {
      setAccionPendiente('AVANZAR');
      setPreguntaReglaActiva(preguntaPendiente);
      setModalPreguntaReglaAbierto(true);
      return;
    }

    await avanzarConRespuestasPendientes();
  };

  // Al responder la pregunta del modal de la regla en evaluación
  const handleResponderPreguntaRegla = async (
    nombre: string,
    valor: string,
    tipoDato: string,
    opciones?: string[]
  ) => {
    const hechoRespondido = {
      nombre,
      valor,
      tipo_dato: tipoDato,
      opciones,
    };
    const nuevasRespuestas = {
      ...respuestasAcumuladas,
      [nombre.toLowerCase().trim()]: hechoRespondido,
    };
    setRespuestasAcumuladas(nuevasRespuestas);
    setModalPreguntaReglaAbierto(false);
    setPreguntaReglaActiva(null);

    const accion = accionPendiente;
    setAccionPendiente(null);

    if (accion === 'AVANZAR') {
      respuestasPendientesPaso.current[nombre.toLowerCase().trim()] = hechoRespondido;
    }

    const otraPregunta = accion
      ? buscarPreguntaPendiente(nuevasRespuestas, accion === 'AVANZAR')
      : null;
    if (otraPregunta) {
      setAccionPendiente(accion);
      setPreguntaReglaActiva(otraPregunta);
      setModalPreguntaReglaAbierto(true);
      return;
    }

    if (accion === 'INICIAR') {
      await ejecutarConRespuestas(nuevasRespuestas, esModoSimulacion);
    } else if (accion === 'AVANZAR' && inferenciaIdActual) {
      await avanzarConRespuestasPendientes();
    }
  };

  const handlePausar = async () => {
    if (!inferenciaIdActual || !puedeControlar) return;
    try {
      const resp = await controlarSimulacion.mutateAsync({
        simulacionId: inferenciaIdActual,
        accion: 'PAUSAR',
      });
      setResultadoInferencia(resp);
    } catch {
      // Error manejado en UI
    }
  };

  const handleContinuar = async () => {
    if (!inferenciaIdActual || !puedeControlar) return;
    try {
      const resp = await controlarSimulacion.mutateAsync({
        simulacionId: inferenciaIdActual,
        accion: 'CONTINUAR',
      });
      setResultadoInferencia(resp);
    } catch {
      // Error manejado en UI
    }
  };

  const handleReiniciarSimulacion = async () => {
    if (!puedeControlar) return;
    try {
      if (inferenciaIdActual) {
        await controlarSimulacion.mutateAsync({
          simulacionId: inferenciaIdActual,
          accion: 'REINICIAR',
        });
      }
    } catch {
      // Ignorar para garantizar reseteo visual
    } finally {
      // Reiniciar completamente el estado como si se recargara la página desde 0
      setResultadoInferencia(null);
      setInferenciaIdActual(null);
      recordarSimulacion(null);
      setRestaurandoId(null);
      setRespuestasAcumuladas({});
      respuestasPendientesPaso.current = {};
      setPreguntaReglaActiva(null);
      setModalPreguntaReglaAbierto(false);
      setModalExplicacionAbierto(false);
      setAccionPendiente(null);

      // Limpiar caches de queries para eliminar hechos inferidos, conflictos y detalles previos
      queryClient.removeQueries({ queryKey: [INFERENCIA_DETALLES_KEY] });
      queryClient.removeQueries({ queryKey: [INFERENCIA_CONFLICTOS_KEY] });
      queryClient.removeQueries({ queryKey: [INFERENCIA_HECHOS_KEY] });
      queryClient.invalidateQueries({ queryKey: [HECHOS_KEY, effectiveBaseId] });
      queryClient.invalidateQueries({ queryKey: [BASE_CONOCIMIENTO_KEY, sistemaId] });
    }
  };

  const handleFinalizarSimulacion = async () => {
    if (!inferenciaIdActual || !puedeControlar) return;
    try {
      const resp = await controlarSimulacion.mutateAsync({
        simulacionId: inferenciaIdActual,
        accion: 'FINALIZAR',
      });
      setResultadoInferencia(resp);
    } catch {
      // Error manejado en UI
    }
  };

  const handleAbrirPreguntaActual = async () => {
    if (!inferenciaIdActual && !await validarAntesDeInferir()) return;
    const pregunta = buscarPreguntaPendiente(respuestasAcumuladas, Boolean(inferenciaIdActual));

    if (pregunta) {
      setAccionPendiente(inferenciaIdActual ? 'AVANZAR' : 'INICIAR');
      setPreguntaReglaActiva(pregunta);
      setModalPreguntaReglaAbierto(true);
    }
  };

  const handleReiniciarTodo = () => {
    setResultadoInferencia(null);
    setInferenciaIdActual(null);
    recordarSimulacion(null);
    setRestaurandoId(null);
    setRespuestasAcumuladas({});
    respuestasPendientesPaso.current = {};
    setPreguntaReglaActiva(null);
    setModalPreguntaReglaAbierto(false);
    setAccionPendiente(null);
  };

  if (restaurandoId && restauracion.isError) {
    return <ErrorMessage
      title="No se pudo recuperar la simulación"
      message={restauracion.error instanceof Error ? restauracion.error.message : 'Reintenta cargar la sesión.'}
      onRetry={() => restauracion.refetch()}
    />;
  }

  if (isSistemaLoading || restaurandoId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium">Cargando motor de inferencia...</p>
      </div>
    );
  }

  const reglasActivadas: DetalleInferencia[] = (() => {
    if (resultadoInferencia?.reglas_activadas && resultadoInferencia.reglas_activadas.length > 0) {
      return resultadoInferencia.reglas_activadas;
    }
    const activadasMap = new Map<string, DetalleInferencia>();
    for (const d of detallesCombinados) {
      if (d.estado === 'ACTIVADA' || d.estado === 'EJECUTADA') {
        const key = String(
          (typeof d.regla === 'string' ? d.regla : d.regla?.nombre) ||
          d.regla_id ||
          d.nombre_regla ||
          d.regla_nombre ||
          d.id
        );
        activadasMap.set(key, d);
      }
    }
    return Array.from(activadasMap.values());
  })();

  // Lista de hechos combinados para el panel de hechos
  const hechosEnMemoria: HechoDeducido[] = (() => {
    const list: HechoDeducido[] = hechosIniciales
      .filter((h) => h.valor != null && String(h.valor).trim() !== '')
      .map((h) => ({
      nombre: h.nombre,
      valor: h.valor,
      procedencia: 'INICIAL',
    }));

    const inferidos = hechosInferidosApi.length > 0
      ? hechosInferidosApi
      : (resultadoInferencia?.hechos_generados || []);

    for (const inf of inferidos) {
      list.push({
        ...inf,
        procedencia: 'INFERIDO',
      });
    }
    return list;
  })();

  const pasoActual = resultadoInferencia?.paso_visual_actual ?? resultadoInferencia?.paso_actual ?? 0;
  const estadoActual = resultadoInferencia?.estado || null;
  const isLoading =
    validandoBC ||
    ejecutarInferencia.isPending ||
    iniciarSimulacion.isPending ||
    avanzarPasoSimulacion.isPending ||
    controlarSimulacion.isPending;

  return (
    <div className="space-y-6">
      {/* Header y Acciones de Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistemaId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a {sistema?.nombre || 'Detalle del Sistema'}
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5 font-serif">
            <Cpu className="w-6 h-6 text-teal-700" />
            Motor de Inferencia Simbólica
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Encadenamiento hacia adelante con resolución determinista de conflictos y explicabilidad.
          </p>
        </div>

        {/* Botones de navegación contextual */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle de Modo */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setEsModoSimulacion(true);
                handleReiniciarTodo();
              }}
              disabled={!puedeIniciar || isLoading}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                esModoSimulacion
                  ? 'bg-white text-teal-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Simulación Paso a Paso
            </button>
            <button
              type="button"
              onClick={() => {
                setEsModoSimulacion(false);
                handleReiniciarTodo();
              }}
              disabled={!puedeEjecutar || isLoading}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                !esModoSimulacion
                  ? 'bg-white text-teal-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Modo Directo
            </button>
          </div>

          {hayVariablesInicialesEnReglas && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAbrirPreguntaActual}
              disabled={isLoading}
              className="text-stone-700 border-stone-200"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1 text-teal-700" />
              Preguntas de Evaluación
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sistemas/${sistemaId}/historial`)}
            disabled={!puedeHistorial}
            className="text-stone-700 border-stone-200"
          >
            <History className="w-3.5 h-3.5 mr-1" />
            Historial
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/sistemas/${sistemaId}/validacion`)}
            disabled={!puedeValidacion}
            className="text-stone-700 border-stone-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Validar BC
          </Button>
        </div>
      </div>

      {/* Barra de Controles según el Modo */}
      {validandoBC && <p role="status" className="text-sm text-teal-800">Validando la base de conocimiento antes de iniciar…</p>}
      {esModoSimulacion ? (
        <ControlesSimulacionBar
          estado={estadoActual}
          pasoActual={pasoActual}
          numeroVuelta={resultadoInferencia?.numero_vuelta}
          siguienteRegla={puedeTrazabilidad ? resultadoInferencia?.siguiente_regla : undefined}
          isLoading={isLoading}
          puedeIniciar={puedeIniciar}
          puedeControlar={puedeControlar}
          onIniciar={handleIniciarSimulacion}
          onAbrirCuestionario={handleAbrirPreguntaActual}
          onAvanzarPaso={() => handleAvanzarPaso('COMPLETO')}
          onEvaluarRegla={() => handleAvanzarPaso('POR_REGLA')}
          onPausar={handlePausar}
          onContinuar={handleContinuar}
          onReiniciar={handleReiniciarSimulacion}
          onFinalizar={handleFinalizarSimulacion}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {hayVariablesInicialesEnReglas && (
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  if (await validarAntesDeInferir()) setModalCuestionarioDirectoAbierto(true);
                }}
                disabled={!puedeEjecutar || isLoading}
                className="text-stone-700 border-stone-300 hover:bg-stone-50 flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>Responder Preguntas / Cuestionario</span>
              </Button>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleEjecutarDirecto}
              disabled={!puedeEjecutar}
              loading={ejecutarInferencia.isPending || validandoBC}
              className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ejecutar Directo (Hechos Actuales)</span>
            </Button>

            {resultadoInferencia && (
              <Button
                variant="outline"
                size="md"
                onClick={handleReiniciarTodo}
                className="flex items-center gap-1.5 text-stone-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium">Estado:</span>
            {ejecutarInferencia.isPending ? (
              <Badge variant="warning" className="animate-pulse">En progreso...</Badge>
            ) : resultadoInferencia ? (
              <Badge variant="success">Completada</Badge>
            ) : (
              <Badge variant="neutral">Listo para ejecutar</Badge>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante para consultar la Explicación si se alcanzó conclusión */}
      {resultadoInferencia?.conclusion_final && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-teal-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-teal-950">
                Conclusión alcanzada: {resultadoInferencia.conclusion_final}
              </h4>
              <p className="text-xs text-teal-700">
                Consulte la cadena determinista de razonamiento y condiciones que la demostraron.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setModalExplicacionAbierto(true)}
            disabled={!puedeExplicacion}
            className="bg-teal-800 hover:bg-teal-900 text-white text-xs flex items-center gap-1.5"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Explicar Conclusión</span>
          </Button>
        </div>
      )}

      {/* Flujo de trazabilidad global */}
      {puedeTrazabilidad && <TrazabilidadFlow
        totalHechos={hechosEnMemoria.length}
        totalEvaluadas={detallesCombinados.length}
        totalActivadas={reglasActivadas.length}
        tieneConclusion={Boolean(resultadoInferencia?.conclusion_final)}
      />}

      {/* Grid principal con Paneles de Memoria, Reglas y Conflictos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Panel de Hechos en Memoria */}
          <HechosGeneradosPanel hechos={hechosEnMemoria} pasoActual={pasoActual} />

          {/* Panel de Reglas Evaluadas */}
          {puedeTrazabilidad && <ReglasEvaluadasPanel
            detalles={detallesCombinados}
            pasoActual={resultadoInferencia?.paso_visual_actual}
            reglas={reglas}
            variables={variables}
            hechos={hechosIniciales}
          />}
        </div>

        <div className="space-y-6">
          {/* Panel de Resolución de Conflictos */}
          {puedeTrazabilidad && <ConflictosPanel conflictos={conflictosApi} pasoActual={pasoActual} />}

          {/* Panel de Reglas Activadas */}
          {puedeTrazabilidad && <ReglasActivadasPanel reglasActivadas={reglasActivadas} />}

          {/* Conclusión Final */}
          <ConclusionFinalPanel
            conclusion={resultadoInferencia?.conclusion_final}
            factorCerteza={resultadoInferencia?.factor_certeza_final}
            estado={resultadoInferencia ? 'COMPLETADA' : 'INACTIVA'}
          />
        </div>
      </div>

      {/* Modal de Pregunta de la Regla en Evaluación */}
      <PreguntaReglaModal
        isOpen={modalPreguntaReglaAbierto}
        onClose={() => setModalPreguntaReglaAbierto(false)}
        evaluacion={preguntaReglaActiva}
        onResponder={handleResponderPreguntaRegla}
        loading={isLoading}
        totalPendientes={1}
        indicePendiente={1}
      />

      {/* Modal de Explicación de Conclusión */}
      <ExplicacionConclusionModal
        isOpen={puedeExplicacion && modalExplicacionAbierto}
        onClose={() => setModalExplicacionAbierto(false)}
        inferenciaId={inferenciaIdActual || undefined}
      />

      <ValidacionPreviaModal
        bloqueo={bloqueoValidacion}
        onClose={() => setBloqueoValidacion(null)}
        onIrValidacion={puedeValidacion && sistemaId ? () => navigate(`/sistemas/${sistemaId}/validacion`) : undefined}
      />

      {/* Modal de Cuestionario Completo para Modo Directo (todas las preguntas de golpe) */}
      <CuestionarioConsultaModal
        isOpen={modalCuestionarioDirectoAbierto}
        onClose={() => setModalCuestionarioDirectoAbierto(false)}
        hechos={hechosIniciales}
        variables={variables}
        nombresEnReglas={variablesOHechosInicialesEnReglas}
        onConfirmar={handleConfirmarCuestionarioDirecto}
        loading={ejecutarInferencia.isPending || validandoBC}
        tituloAccion="Ejecutar Inferencia con Respuestas"
      />
    </div>
  );
};

export default InferenciaPage;
