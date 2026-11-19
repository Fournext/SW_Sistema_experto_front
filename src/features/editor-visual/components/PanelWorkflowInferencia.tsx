import React, { useState } from 'react';
import {
  Play,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  Database,
  Target,
  Sparkles,
  Eye,
  AlertTriangle,
  Layers,
  Lock,
  BookmarkCheck,
  CheckCheck,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { HechoVectorItem } from '@/features/inferencia/components/BarraVectorHechos';

export type TipoPasoWorkflow = 'EVALUACION_REGLA' | 'CIERRE_PASADA';

export interface ContradiccionPaso {
  tipo: 'CLIENTE_REGLA' | 'REGLA_REGLA';
  variable: string;
  valorAnterior: string;
  valorNuevo: string;
  origenAnterior: string;
}

export interface PasoWorkflow {
  pasoNumero: number;
  vueltaNumero?: number;
  pasadaNumero: number;
  tipoPaso: TipoPasoWorkflow;
  reglaId: string;
  reglaNombre: string;
  prioridad: number;
  estado: 'ACTIVADA' | 'EJECUTADA' | 'RECHAZADA' | 'DESHABILITADA' | 'CIERRE_PASADA';
  motivoDescarte?: string;
  condicionesEvaluadas: Array<{
    sujeto: string;
    operador: string;
    valorEsperado: string;
    valorEnBH?: string;
    cumple: boolean;
  }>;
  hechoProducido?: {
    nombre: string;
    valor: string;
  };
  nuevosHechosPasada?: Array<{ nombre: string; valor: string; reglaNombre: string }>;
  reglasMarcadas?: string[];
  bhInicioPasada?: HechoVectorItem[];
  memoriaTrabajoSnapshot: HechoVectorItem[];
  contradiccion?: ContradiccionPaso;
  metasAlcanzadas?: boolean;
  metasUnificadas?: Record<string, string>;
  metasPendientes?: string[];
}

export interface PanelWorkflowInferenciaProps {
  pasos: PasoWorkflow[];
  pasoActualIndex: number;
  onCambiarPaso: (index: number) => void;
  onEjecutarDirecto: () => void;
  onIniciarPasoAPaso: () => void;
  onReiniciar: () => void;
  onEnfocarRegla?: (reglaId: string) => void;
  ejecutando?: boolean;
  conclusionFinal?: string | null;
  modoEjecucion: 'DIRECTO' | 'PASO_A_PASO';
  onCambiarModoEjecucion: (modo: 'DIRECTO' | 'PASO_A_PASO') => void;
  metas?: string[];
  onMetasChange?: (metas: string[]) => void;
  variablesDisponibles?: Array<{ id: string; nombre: string }>;
  vectorHechos?: HechoVectorItem[];
  onActualizarVectorHechos?: (hechos: HechoVectorItem[]) => void;
  sugerenciasVariables?: string[];
  totalReglas?: number;
  onCerrarPanel?: () => void;
}

export const PanelWorkflowInferencia: React.FC<PanelWorkflowInferenciaProps> = ({
  pasos,
  pasoActualIndex,
  onCambiarPaso,
  onEjecutarDirecto,
  onIniciarPasoAPaso,
  onReiniciar,
  onEnfocarRegla,
  ejecutando = false,
  conclusionFinal,
  modoEjecucion,
  onCambiarModoEjecucion,
  metas = [],
  onMetasChange,
  variablesDisponibles = [],
  vectorHechos,
  onActualizarVectorHechos,
  sugerenciasVariables = [],
  totalReglas = 0,
  onCerrarPanel,
}) => {
  const [bhColapsada, setBhColapsada] = useState(false);
  const [nuevoNombreHecho, setNuevoNombreHecho] = useState('');
  const [nuevoValorHecho, setNuevoValorHecho] = useState('');

  const pasoActual = pasos[pasoActualIndex];
  const totalPasos = pasos.length;
  const tienePasos = totalPasos > 0;

  const irPasoSiguiente = () => {
    if (pasoActualIndex < totalPasos - 1) {
      onCambiarPaso(pasoActualIndex + 1);
    }
  };

  const irPasoAnterior = () => {
    if (pasoActualIndex > 0) {
      onCambiarPaso(pasoActualIndex - 1);
    }
  };

  const irSiguientePasada = () => {
    if (!pasoActual) return;
    const currentPasada = pasoActual.pasadaNumero || pasoActual.vueltaNumero || 1;
    const nextIdx = pasos.findIndex(
      (p, i) => i > pasoActualIndex && (p.pasadaNumero || p.vueltaNumero || 1) > currentPasada
    );
    if (nextIdx >= 0) {
      onCambiarPaso(nextIdx);
    } else if (pasoActualIndex < totalPasos - 1) {
      onCambiarPaso(totalPasos - 1);
    }
  };

  const agregarHechoBH = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreHecho.trim() || !nuevoValorHecho.trim() || !onActualizarVectorHechos || !vectorHechos) return;
    const nombreLimpio = nuevoNombreHecho.trim();
    const valorLimpio = nuevoValorHecho.trim();
    const filtrados = vectorHechos.filter(
      (h) => h.nombre.toLowerCase() !== nombreLimpio.toLowerCase()
    );
    onActualizarVectorHechos([...filtrados, { nombre: nombreLimpio, valor: valorLimpio }]);
    setNuevoNombreHecho('');
    setNuevoValorHecho('');
  };

  const eliminarHechoBH = (nombre: string) => {
    if (!onActualizarVectorHechos || !vectorHechos) return;
    onActualizarVectorHechos(vectorHechos.filter((h) => h.nombre !== nombre));
  };

  return (
    <aside
      className="w-[440px] md:w-[480px] max-w-[95vw] bg-white border-l border-slate-200 shadow-xl flex flex-col h-full z-20 transition-all duration-300 shrink-0"
      aria-label="Panel del Simulador Forward Chaining"
    >
      {/* Cabecera del Panel Workflow */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              Simulador FWC
            </h3>
            <p className="text-[10px] text-slate-400">
              Inferencia determinista hacia adelante
            </p>
          </div>
        </div>

        {/* Selector de Modo y Botón Cerrar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => onCambiarModoEjecucion('DIRECTO')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                modoEjecucion === 'DIRECTO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Directo
            </button>
            <button
              type="button"
              onClick={() => onCambiarModoEjecucion('PASO_A_PASO')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                modoEjecucion === 'PASO_A_PASO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⏯️ Paso a Paso
            </button>
          </div>

          {onCerrarPanel && (
            <button
              type="button"
              onClick={onCerrarPanel}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ocultar panel del simulador"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cuerpo Scrollable del Simulador */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Sección 1: Base de Hechos Inicial (BH0) */}
        {vectorHechos && onActualizarVectorHechos && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div
              className="p-2.5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
              onClick={() => setBhColapsada(!bhColapsada)}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                  <Database className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                    Base de Hechos Inicial (BH)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {vectorHechos.length}
                  </span>
                </div>
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-700">
                {bhColapsada ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!bhColapsada && (
              <div className="p-2.5 space-y-2">
                {/* Chips de hechos actuales */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {vectorHechos.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic font-mono">
                      BH vacía. Agrega un hecho inicial (ej. Q = 0) para iniciar.
                    </span>
                  ) : (
                    vectorHechos.map((h) => (
                      <span
                        key={h.nombre}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
                      >
                        <span className="font-semibold text-slate-900">{h.nombre}</span>
                        <span className="text-slate-400">=</span>
                        <span className="text-slate-900 font-bold">{h.valor}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarHechoBH(h.nombre);
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5 p-0.5 rounded hover:bg-slate-100 transition-colors"
                          title={`Quitar ${h.nombre}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input para agregar hecho */}
                <form onSubmit={agregarHechoBH} className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <datalist id="sugerencias-hechos-side">
                    {sugerenciasVariables.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>

                  <input
                    type="text"
                    list="sugerencias-hechos-side"
                    placeholder="Atributo (ej. Q)"
                    value={nuevoNombreHecho}
                    onChange={(e) => setNuevoNombreHecho(e.target.value)}
                    className="w-24 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-400">=</span>
                  <input
                    type="text"
                    placeholder="Valor (ej. 0)"
                    value={nuevoValorHecho}
                    onChange={(e) => setNuevoValorHecho(e.target.value)}
                    className="flex-1 min-w-[60px] px-2 py-1 text-xs bg-white border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shrink-0"
                    title="Agregar hecho a la BH"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Sección 2: Metas Objetivo (Early Stopping) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Target className="w-4 h-4 text-teal-600" />
              <span>Metas FWC:</span>
              {metas.length === 0 ? (
                <span className="text-[11px] font-normal text-slate-500">
                  Exhaustivo
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                  {metas.length} activa{metas.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {onMetasChange && (
              <div className="flex items-center gap-1 flex-wrap">
                {variablesDisponibles
                  .filter((v) => !metas.includes(v.nombre))
                  .slice(0, 5)
                  .map((v) => (
                    <button
                      key={v.id || v.nombre}
                      type="button"
                      onClick={() => onMetasChange([...metas, v.nombre])}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 transition-colors cursor-pointer"
                      title={`Agregar '${v.nombre}' como meta`}
                    >
                      +{v.nombre}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {metas.length > 0 && onMetasChange && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {metas.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-100 text-teal-900 border border-teal-300"
                >
                  🎯 {m}
                  <button
                    type="button"
                    onClick={() => onMetasChange(metas.filter((item) => item !== m))}
                    className="text-teal-700 hover:text-teal-950 rounded-full p-0.5 hover:bg-teal-200 cursor-pointer"
                    title="Quitar meta"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => onMetasChange([])}
                className="text-[10px] text-slate-500 hover:text-rose-600 underline cursor-pointer ml-1"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Sección 3: Controles de Simulación */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
          {modoEjecucion === 'DIRECTO' ? (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
                onClick={onEjecutarDirecto}
                loading={ejecutando}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold flex-1"
              >
                Ejecutar Deducción FWC
              </Button>
              {tienePasos && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={onReiniciar}
                  title="Limpiar resultado"
                >
                  Limpiar
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {!tienePasos ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play className="w-3.5 h-3.5 text-white fill-white" />}
                  onClick={onIniciarPasoAPaso}
                  loading={ejecutando}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold w-full"
                >
                  Iniciar Simulación FWC
                </Button>
              ) : (
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<SkipBack className="w-3.5 h-3.5" />}
                      onClick={irPasoAnterior}
                      disabled={pasoActualIndex <= 0}
                      title="Paso anterior"
                    >
                      Ant.
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<SkipForward className="w-3.5 h-3.5 text-white" />}
                      onClick={irPasoSiguiente}
                      disabled={pasoActualIndex >= totalPasos - 1}
                      className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                      title="Siguiente regla en orden de evaluación"
                    >
                      Sig. Regla
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Layers className="w-3.5 h-3.5 text-purple-600" />}
                      onClick={irSiguientePasada}
                      disabled={pasoActualIndex >= totalPasos - 1}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 font-bold"
                      title="Avanzar a la siguiente pasada de inferencia"
                    >
                      Sig. Pasada ⏭️
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={onReiniciar}
                    title="Reiniciar simulación"
                  >
                    Reset
                  </Button>
                </div>
              )}

              {/* Indicadores de Paso y Vuelta/Pasada */}
              {tienePasos && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    Paso: <strong className="text-indigo-600">{pasoActualIndex + 1}</strong> / {totalPasos}
                  </span>
                  <span className="text-xs font-mono font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-300 flex items-center gap-1 shadow-2xs">
                    <Layers className="w-3 h-3 text-purple-600" />
                    {pasoActual?.pasadaNumero || pasoActual?.vueltaNumero || 1}ª Pasada
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección 4: Inspección del Paso Actual (Workflow HUD) */}
        {pasoActual ? (
          <div className="space-y-3">
            {/* Tarjeta 1: Regla en Evaluación o Cierre de Pasada */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3 shadow-xs">
              {pasoActual.tipoPaso === 'CIERRE_PASADA' ? (
                /* Hito de cierre de pasada */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-purple-700 text-white shadow-2xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      🏁 Fin de {pasoActual.pasadaNumero}ª Pasada
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
                      Consolidación
                    </span>
                  </div>

                  <div className="bg-purple-50/70 rounded-xl p-2.5 border border-purple-200 text-xs space-y-2">
                    <div className="flex items-start gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-purple-950 block">Nuevos hechos deducidos:</strong>
                        {pasoActual.nuevosHechosPasada && pasoActual.nuevosHechosPasada.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pasoActual.nuevosHechosPasada.map((nh, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded font-mono font-bold bg-white text-purple-800 border border-purple-300 text-[11px] shadow-2xs"
                              >
                                + {nh.nombre} = "{nh.valor}" <span className="text-[10px] text-slate-500 font-sans">({nh.reglaNombre})</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic mt-0.5 block text-[11px]">
                            No se dedujeron nuevos hechos en esta pasada (fin de ciclo).
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200/70 flex items-start gap-1.5">
                      <CheckCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800 block">Reglas Marcadas:</strong>
                        {pasoActual.reglasMarcadas && pasoActual.reglasMarcadas.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pasoActual.reglasMarcadas.map((r, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-700 text-[10px]"
                              >
                                🔒 {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Ninguna regla marcada aún.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Base de Hechos Resultante */}
                  <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 font-mono text-xs">
                    <span className="font-bold text-indigo-950 block mb-1">
                      BH Resultante de la Pasada:
                    </span>
                    <div className="bg-white p-2 rounded-lg border border-indigo-200 text-indigo-950 font-black shadow-2xs break-words text-[11px]">
                      BH = &#123;{' '}
                      {pasoActual.memoriaTrabajoSnapshot.map((h, i) => (
                        <span key={i}>
                          <span className="text-indigo-700">{h.nombre}</span> = <span className="text-slate-900">"{h.valor}"</span>
                          {i < pasoActual.memoriaTrabajoSnapshot.length - 1 ? ', ' : ''}
                        </span>
                      ))}{' '}
                      &#125;
                    </div>
                  </div>
                </div>
              ) : (
                /* Evaluación estándar de regla */
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {pasoActual.reglaNombre}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Prioridad: P:{pasoActual.prioridad}
                      </span>
                    </div>

                    {onEnfocarRegla && (
                      <button
                        type="button"
                        onClick={() => onEnfocarRegla(pasoActual.reglaId)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        title="Centrar vista en la tarjeta de esta regla"
                      >
                        <Eye className="w-3 h-3" />
                        Enfocar
                      </button>
                    )}
                  </div>

                  {/* Contraste de Premisas contra la Memoria de Trabajo viva */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Premisas (IF) vs Memoria (BH):
                      </h4>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        BH Paso #{pasoActual.pasoNumero}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {pasoActual.condicionesEvaluadas.map((cond, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 font-mono ${
                            cond.cumple
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-rose-50/60 border-rose-200 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-indigo-700">{cond.sujeto}</span>
                            <span>{cond.operador}</span>
                            <span>{cond.valorEsperado}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-500 font-sans">
                              BH: <strong>{cond.valorEnBH !== undefined ? cond.valorEnBH : '∅'}</strong>
                            </span>
                            {cond.cumple ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-600 text-white">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Cumple
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                                <XCircle className="w-2.5 h-2.5" /> Falla
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dictamen del Paso */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold ${
                      pasoActual.contradiccion
                        ? 'bg-rose-100/90 border-rose-300 text-rose-950'
                        : pasoActual.estado === 'EJECUTADA'
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {pasoActual.contradiccion ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>¡Contradicción Detectada!</span>
                        </>
                      ) : pasoActual.estado === 'EJECUTADA' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>¡Regla Disparada!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Premisas no satisfechas.</span>
                        </>
                      )}
                    </div>

                    {pasoActual.hechoProducido && (
                      <span
                        className={`font-mono px-2 py-0.5 rounded border text-[11px] shadow-2xs ${
                          pasoActual.contradiccion
                            ? 'text-rose-900 bg-rose-50 border-rose-300 font-bold'
                            : 'text-emerald-800 bg-white border-emerald-300'
                        }`}
                      >
                        + Devuelve: {pasoActual.hechoProducido.nombre} = {pasoActual.hechoProducido.valor}
                      </span>
                    )}
                  </div>

                  {/* Banner de Metas Alcanzadas (Parada Temprana FWC) */}
                  {pasoActual.metasAlcanzadas && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Target className="w-4 h-4 text-emerald-600" />
                        <span>¡METAS UNIFICADAS! (Parada Temprana)</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        El motor detiene la inferencia al cumplir las metas objetivo.
                      </p>
                    </div>
                  )}

                  {/* Banner detallado si se detecta contradicción */}
                  {pasoActual.contradiccion && (
                    <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-950 text-xs flex items-start gap-2 shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-black bg-rose-200 text-rose-900">
                            Conflicto
                          </span>
                          <span>Sobreposición contradictoria</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-rose-900">
                          La regla <strong>{pasoActual.reglaNombre}</strong> concluye <strong>{pasoActual.contradiccion.variable} = "{pasoActual.contradiccion.valorNuevo}"</strong>, pero en la memoria de trabajo ya existía <strong>"{pasoActual.contradiccion.valorAnterior}"</strong> (por <em>{pasoActual.contradiccion.origenAnterior}</em>).
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tarjeta 2: Memoria de Trabajo (BH) en este instante */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  Memoria de Trabajo (BH<sub>{pasoActualIndex + 1}</sub>)
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {pasoActual.memoriaTrabajoSnapshot.length} proposición(es)
                </span>
              </div>

              <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto p-0.5">
                {pasoActual.memoriaTrabajoSnapshot.map((h, i) => {
                  const esConflicto =
                    pasoActual.contradiccion &&
                    h.nombre.trim().toLowerCase() === pasoActual.contradiccion.variable.trim().toLowerCase();
                  const esReciente =
                    pasoActual.hechoProducido &&
                    pasoActual.hechoProducido.nombre === h.nombre &&
                    pasoActual.hechoProducido.valor === h.valor;

                  return (
                    <div
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-all ${
                        esConflicto
                          ? 'bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-300'
                          : esReciente
                          ? 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      {esConflicto && <AlertTriangle className="w-3 h-3 text-rose-600 inline shrink-0" />}
                      <span>{h.nombre}</span>
                      <span className="text-slate-400">=</span>
                      <span className="text-slate-900">{h.valor}</span>
                    </div>
                  );
                })}
              </div>

              {/* Conclusión Final si existe */}
              {conclusionFinal && pasoActualIndex === totalPasos - 1 && (
                <div className="p-2.5 bg-teal-50 border border-teal-300 rounded-xl flex items-center justify-between text-teal-950 shadow-2xs mt-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-teal-900">
                        Deducción Final Alcanzada
                      </div>
                      <div className="text-xs text-teal-800 font-mono font-bold">
                        {conclusionFinal}
                      </div>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">
              Presiona <strong>&quot;Iniciar Simulación FWC&quot;</strong> o <strong>&quot;Ejecutar Deducción FWC&quot;</strong> para analizar las reglas con el vector de hechos iniciales.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default PanelWorkflowInferencia;
