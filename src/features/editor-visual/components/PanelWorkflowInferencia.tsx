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
  SlidersHorizontal,
  AlertTriangle,
  Layers,
  Lock,
  BookmarkCheck,
  CheckCheck,
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
}) => {
  const [panelMinimizado, setPanelMinimizado] = useState(false);

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

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300">
      {/* Cabecera del Panel Workflow */}
      <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              Simulador de Razonamiento (Forward Chaining)
            </h3>
            <p className="text-[10px] text-slate-400">
              Evaluación determinista de reglas contra la memoria de trabajo (Base de Hechos)
            </p>
          </div>
        </div>

        {/* Selector de Modo: Directo vs Paso a Paso */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => onCambiarModoEjecucion('DIRECTO')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                modoEjecucion === 'DIRECTO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Ejecutar Directo
            </button>
            <button
              type="button"
              onClick={() => onCambiarModoEjecucion('PASO_A_PASO')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                modoEjecucion === 'PASO_A_PASO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⏯️ Paso a Paso
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPanelMinimizado(!panelMinimizado)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={panelMinimizado ? 'Expandir panel' : 'Minimizar panel'}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!panelMinimizado && (
        <div className="p-4 space-y-4">
          {/* Barra de Controles de Simulación */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {modoEjecucion === 'DIRECTO' ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
                  onClick={onEjecutarDirecto}
                  loading={ejecutando}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                  Ejecutar Deducción FWC
                </Button>
                {tienePasos && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={onReiniciar}
                  >
                    Limpiar Resultado
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {!tienePasos ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play className="w-3.5 h-3.5 text-white fill-white" />}
                    onClick={onIniciarPasoAPaso}
                    loading={ejecutando}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    Iniciar Simulación FWC
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<SkipBack className="w-3.5 h-3.5" />}
                      onClick={irPasoAnterior}
                      disabled={pasoActualIndex <= 0}
                      title="Paso anterior"
                    >
                      Anterior
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
                      Siguiente Regla
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

                    <Button
                      variant="outline"
                      size="sm"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={onReiniciar}
                      title="Reiniciar simulación desde el inicio"
                    >
                      Reiniciar
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Contador de Pasos y Vuelta / Pasada */}
            {tienePasos && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Paso: <strong className="text-indigo-600">{pasoActualIndex + 1}</strong> / {totalPasos}
                </span>
                <span className="text-xs font-mono font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-300 flex items-center gap-1 shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  {pasoActual?.pasadaNumero || pasoActual?.vueltaNumero || 1}ª Pasada
                </span>
              </div>
            )}
          </div>

          {/* Tarjeta de Inspección del Paso Actual (Workflow HUD) */}
          {pasoActual ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna Izquierda: Regla en Evaluación o Cierre de Pasada */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-xs">
                {pasoActual.tipoPaso === 'CIERRE_PASADA' ? (
                  /* ========================================================
                     VISTA ESPECIAL: HITO DE CIERRE Y CONSOLIDACIÓN DE PASADA
                     ======================================================== */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-black bg-purple-700 text-white shadow-2xs flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          🏁 Fin de {pasoActual.pasadaNumero}ª Pasada
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                          Base de Hechos Resultante
                        </span>
                      </div>
                    </div>

                    <div className="bg-purple-50/70 rounded-xl p-3 border border-purple-200 text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <BookmarkCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-purple-950 block">Nuevos hechos deducidos en esta pasada:</strong>
                          {pasoActual.nuevosHechosPasada && pasoActual.nuevosHechosPasada.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {pasoActual.nuevosHechosPasada.map((nh, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded font-mono font-bold bg-white text-purple-800 border border-purple-300 text-[11px] shadow-2xs"
                                >
                                  + {nh.nombre} = "{nh.valor}" <span className="text-[10px] text-slate-500 font-sans">({nh.reglaNombre})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic mt-1 block">
                              No se dedujeron nuevos hechos en esta pasada (fin de ciclo).
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-purple-200/70 flex items-start gap-2">
                        <CheckCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 block">Reglas Marcadas (deshabilitadas para siguientes pasadas):</strong>
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

                    {/* Representación de Base de Hecho Resultante idéntica a la pizarra */}
                    <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 font-mono text-xs">
                      <span className="font-bold text-indigo-950 block mb-1">
                        Base de Hecho resultante: BH = &#123; ... &#125;
                      </span>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-200 text-indigo-950 font-black shadow-2xs break-words">
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

                    {/* Si hubo contradicción en esta pasada */}
                    {pasoActual.contradiccion && (
                      <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-950 font-mono text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>¡CONTRADICCIÓN ENCONTRADA EN BASE DE HECHOS!</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-rose-300 text-center font-black text-rose-950">
                          <p className="tracking-wide">
                            BH = &#123;{' '}
                            {pasoActual.bhInicioPasada?.map((h) => `${h.nombre} = ${h.valor}`).join(', ')}
                            , <span className="bg-rose-200 text-rose-950 px-1 py-0.5 rounded border border-rose-400 underline">{pasoActual.contradiccion.variable} = {pasoActual.contradiccion.valorNuevo}</span>{' '}
                            &#125;
                          </p>
                          <p className="text-rose-700 text-sm mt-1">⬇️ ⬇️</p>
                          <p className="text-rose-800 text-sm font-extrabold uppercase">
                            CONTRADICCIÓN EN '{pasoActual.contradiccion.variable}' ({pasoActual.contradiccion.valorAnterior} vs {pasoActual.contradiccion.valorNuevo})
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : pasoActual.estado === 'DESHABILITADA' ? (
                  /* ========================================================
                     VISTA DE REGLA DESHABILITADA / MARCADA EN PASADA PREVIA
                     ======================================================== */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-400 border border-slate-200 line-through">
                          {pasoActual.reglaNombre}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 text-slate-700 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-slate-600" /> Regla Marcada (Deshabilitada)
                        </span>
                      </div>

                      {onEnfocarRegla && (
                        <button
                          type="button"
                          onClick={() => onEnfocarRegla(pasoActual.reglaId)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          title="Centrar vista en el nodo"
                        >
                          <Eye className="w-3 h-3" />
                          Enfocar
                        </button>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        Esta regla ya disparó en una pasada anterior.
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        En el modelo didáctico de Forward Chaining, una vez que una regla dispara y añade su consecuencia a la memoria de trabajo, queda <strong className="text-slate-700">marcada</strong> y se desactiva para las siguientes pasadas para no reevaluarse repetidamente.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ========================================================
                     VISTA ESTÁNDAR: EVALUACIÓN DE PREMISAS DE LA REGLA
                     ======================================================== */
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
                          Enfocar en Lienzo
                        </button>
                      )}
                    </div>

                    {/* Contraste de Premisas contra la Memoria de Trabajo viva */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Contraste de Premisas (IF) vs Memoria de Trabajo (BH):
                        </h4>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          BH Dinámica (Paso #{pasoActual.pasoNumero})
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-600">Premisa:</span>
                              <span className="font-semibold text-indigo-700">{cond.sujeto}</span>
                              <span>{cond.operador}</span>
                              <span>{cond.valorEsperado}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-500 font-sans">
                                Valor en BH: <strong>{cond.valorEnBH !== undefined ? cond.valorEnBH : '∅'}</strong>
                              </span>
                              {cond.cumple ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-600 text-white">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Cumple
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
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
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold ${
                        pasoActual.contradiccion
                          ? 'bg-rose-100/90 border-rose-300 text-rose-950'
                          : pasoActual.estado === 'EJECUTADA'
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {pasoActual.contradiccion ? (
                          <>
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              {pasoActual.contradiccion.tipo === 'CLIENTE_REGLA'
                                ? '¡Contradicción Detectada! (Hecho/Cliente vs Regla)'
                                : '¡Contradicción Detectada! (Regla vs Regla)'}
                            </span>
                          </>
                        ) : pasoActual.estado === 'EJECUTADA' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>¡Regla Disparada! Consecuencia generada.</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-black bg-emerald-200 text-emerald-900 ml-1 border border-emerald-300">
                              Queda marcada
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-400" />
                            <span>Regla no dispara (premisas no satisfechas).</span>
                          </>
                        )}
                      </div>

                      {pasoActual.hechoProducido && (
                        <span
                          className={`font-mono px-2 py-0.5 rounded border shadow-2xs ${
                            pasoActual.contradiccion
                              ? 'text-rose-900 bg-rose-50 border-rose-300 font-bold'
                              : 'text-emerald-800 bg-white border-emerald-300'
                          }`}
                        >
                          + Devuelve: {pasoActual.hechoProducido.nombre} = {pasoActual.hechoProducido.valor}
                        </span>
                      )}
                    </div>

                    {/* Banner detallado si se detecta contradicción en este paso */}
                    {pasoActual.contradiccion && (
                      <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-950 text-xs flex items-start gap-2 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-black bg-rose-200 text-rose-900">
                              {pasoActual.contradiccion.tipo === 'CLIENTE_REGLA'
                                ? 'Incompatibilidad Entrada vs Regla'
                                : 'Conflicto Regla vs Regla'}
                            </span>
                            <span>Sobreposición contradictoria en memoria</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-rose-900">
                            La regla <strong>{pasoActual.reglaNombre}</strong> concluye <strong>{pasoActual.contradiccion.variable} = "{pasoActual.contradiccion.valorNuevo}"</strong>, pero en la memoria de trabajo ya existía el valor <strong>"{pasoActual.contradiccion.valorAnterior}"</strong> (establecido por <em>{pasoActual.contradiccion.origenAnterior}</em>).
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Columna Derecha: Memoria de Trabajo (BH) y Conclusión Final */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      Memoria de Trabajo Actual (BH<sub>{pasoActualIndex + 1}</sub>)
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {pasoActual.memoriaTrabajoSnapshot.length} proposición(es)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1">
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
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                            esConflicto
                              ? 'bg-rose-100 text-rose-900 border-rose-400 shadow-xs ring-2 ring-rose-300 animate-pulse'
                              : esReciente
                              ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs ring-2 ring-purple-300 animate-bounce'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          {esConflicto && <AlertTriangle className="w-3 h-3 text-rose-600 inline shrink-0" />}
                          <span>{h.nombre}</span>
                          <span className="text-slate-400">=</span>
                          <span className="text-slate-900">{h.valor}</span>
                          {esConflicto ? (
                            <span className="text-[9px] font-black uppercase text-rose-700 ml-1">
                              (Conflicto)
                            </span>
                          ) : esReciente ? (
                            <span className="text-[9px] font-black uppercase text-purple-700 ml-1">
                              (Nuevo)
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Banner de Conclusión Final */}
                {conclusionFinal && pasoActualIndex === totalPasos - 1 && (
                  <div className="p-3 bg-teal-50 border border-teal-300 rounded-xl flex items-center justify-between text-teal-950 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-teal-600 shrink-0" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider">
                          Deducción Final Alcanzada
                        </div>
                        <div className="text-xs text-teal-800 font-mono">
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
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">
                Presiona <strong>&quot;Iniciar Simulación FWC&quot;</strong> o <strong>&quot;Ejecutar Deducción FWC&quot;</strong> para analizar las reglas con el vector de hechos iniciales.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PanelWorkflowInferencia;
