import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Zap,
  Settings2,
} from 'lucide-react';
import type { EstadoCorrida } from '../types/contracts';

interface ControlesEjecucionProps {
  estado: EstadoCorrida | null;
  enEjecucionAutomatica: boolean;
  velocidadMs: number;
  onCambiarVelocidad: (ms: number) => void;
  onValidar: () => void;
  onIniciar: () => void;
  onPasoLinea: () => void;
  onPlay: () => void;
  onPausa: () => void;
  onReiniciar: () => void;
  onAbrirConfiguracion?: () => void;
  onAbrirAyuda?: () => void;
  cargando?: boolean;
}

export const ControlesEjecucion: React.FC<ControlesEjecucionProps> = ({
  estado,
  enEjecucionAutomatica,
  velocidadMs,
  onCambiarVelocidad,
  onValidar,
  onIniciar,
  onPasoLinea,
  onPlay,
  onPausa,
  onReiniciar,
  onAbrirConfiguracion,
  onAbrirAyuda,
  cargando = false,
}) => {
  const estaActiva =
    estado === 'EJECUTANDO' ||
    estado === 'ESPERANDO_ENTRADA' ||
    estado === 'PAUSADA';

  const renderBadgeEstado = () => {
    if (!estado) {
      return (
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
          En Edición
        </span>
      );
    }
    switch (estado) {
      case 'EJECUTANDO':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Ejecutando
          </span>
        );
      case 'ESPERANDO_ENTRADA':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            Esperando Entrada
          </span>
        );
      case 'FINALIZADA':
        return (
          <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-800">
            Finalizada con Éxito
          </span>
        );
      case 'ERROR':
        return (
          <span className="rounded-full bg-rose-950 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-800">
            Error en Ejecución
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-2.5 shadow">
      {/* Grupo Izquierdo: Botones principales */}
      <div className="flex flex-wrap items-center gap-2">
        {!estaActiva && estado !== 'FINALIZADA' ? (
          <>
            <button
              onClick={onValidar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              Validar Código
            </button>

            <button
              onClick={onIniciar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-blue-500 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              Iniciar Simulación
            </button>
          </>
        ) : (
          <>
            {/* Controles de paso y reproducción */}
            <button
              onClick={onPasoLinea}
              disabled={
                cargando ||
                enEjecucionAutomatica ||
                estado === 'ESPERANDO_ENTRADA' ||
                estado === 'FINALIZADA'
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Avanzar 1 línea de código"
            >
              <StepForward className="h-3.5 w-3.5 text-amber-400" />
              Paso (Línea)
            </button>

            {enEjecucionAutomatica ? (
              <button
                onClick={onPausa}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500"
              >
                <Pause className="h-3.5 w-3.5" />
                Pausar
              </button>
            ) : (
              <button
                onClick={onPlay}
                disabled={
                  cargando ||
                  estado === 'ESPERANDO_ENTRADA' ||
                  estado === 'FINALIZADA'
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="h-3.5 w-3.5" />
                Auto Play
              </button>
            )}

            <button
              onClick={onReiniciar}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
              title="Reiniciar y volver al editor"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Reiniciar
            </button>

            {/* Selector de velocidad de simulación */}
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-3">
              <span className="text-[11px] text-slate-500">Velocidad:</span>
              <select
                value={velocidadMs}
                onChange={(e) => onCambiarVelocidad(Number(e.target.value))}
                className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none"
              >
                <option value={1500}>Lenta (1.5s)</option>
                <option value={800}>Media (0.8s)</option>
                <option value={300}>Rápida (0.3s)</option>
                <option value={100}>Ultra (0.1s)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Grupo Derecho: Configuración, Ayuda y Estado */}
      <div className="flex items-center gap-3">
        {onAbrirConfiguracion && (
          <button
            onClick={onAbrirConfiguracion}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            title="Configurar Base de Conocimiento y parámetros"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        )}

        {onAbrirAyuda && (
          <button
            onClick={onAbrirAyuda}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            title="Guía de sintaxis y funciones de clase"
          >
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Guía</span>
          </button>
        )}

        <div>{renderBadgeEstado()}</div>
      </div>
    </div>
  );
};

