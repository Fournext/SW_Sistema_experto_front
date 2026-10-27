import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  StepForward,
  RotateCcw,
  Square,
  HelpCircle,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { EstadoEjecucion } from '../types/types';

interface ControlesSimulacionBarProps {
  estado: EstadoEjecucion | null;
  pasoActual: number;
  numeroVuelta?: number;
  siguienteRegla?: { id: string; nombre: string; prioridad: number } | null;
  isLoading: boolean;
  puedeIniciar?: boolean;
  puedeControlar?: boolean;
  onIniciar: () => void;
  onAbrirCuestionario?: () => void;
  onAvanzarPaso: () => void;
  onEvaluarRegla: () => void;
  onPausar: () => void;
  onContinuar: () => void;
  onReiniciar: () => void;
  onFinalizar: () => void;
}

export const ControlesSimulacionBar: React.FC<ControlesSimulacionBarProps> = ({
  estado,
  pasoActual,
  numeroVuelta,
  siguienteRegla,
  isLoading,
  puedeIniciar = true,
  puedeControlar = true,
  onIniciar,
  onAbrirCuestionario,
  onAvanzarPaso,
  onEvaluarRegla,
  onPausar,
  onContinuar,
  onReiniciar,
  onFinalizar,
}) => {
  const isActiva = Boolean(estado && estado !== 'INACTIVA');
  const isPausada = estado === 'PAUSADA';
  const isFinalizada = estado === 'FINALIZADA' || estado === 'COMPLETADA';

  const renderBadgeEstado = () => {
    switch (estado) {
      case 'INICIADA':
        return <Badge variant="info" className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Iniciada</Badge>;
      case 'EJECUTANDO':
        return <Badge variant="warning" className="flex items-center gap-1.5 animate-pulse"><Activity className="w-3.5 h-3.5" /> Ejecutando</Badge>;
      case 'PAUSADA':
        return <Badge variant="neutral" className="flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Pausada</Badge>;
      case 'FINALIZADA':
      case 'COMPLETADA':
        return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Finalizada</Badge>;
      case 'ERROR':
        return <Badge variant="danger" className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Error</Badge>;
      default:
        return <Badge variant="neutral">Lista para iniciar</Badge>;
    }
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Información del Estado y Pasos */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
            Estado de Simulación
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {renderBadgeEstado()}
            {isActiva && (
              <span className="text-xs text-stone-600 font-mono bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                Paso actual: <strong className="text-teal-700">{pasoActual}</strong>
              </span>
            )}
            {isActiva && numeroVuelta !== undefined && (
              <span className="text-xs text-stone-500">Vuelta {numeroVuelta}</span>
            )}
          </div>
          {isActiva && !isFinalizada && siguienteRegla && (
            <p className="mt-2 text-xs text-stone-500">
              Siguiente regla: <strong className="font-mono text-stone-800">{siguienteRegla.nombre}</strong>
              <span className="ml-2">Prioridad: {siguienteRegla.prioridad}</span>
            </p>
          )}
        </div>
      </div>

      {/* Controles de Acción */}
      <div className="flex flex-wrap items-center gap-2">
        {!isActiva ? (
          <>
            {onAbrirCuestionario && (
              <Button
                variant="outline"
                onClick={onAbrirCuestionario}
                disabled={isLoading}
                className="flex items-center gap-2 text-stone-700 border-stone-300 hover:bg-stone-50 font-semibold"
              >
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>Responder Preguntas / Caso</span>
              </Button>
            )}
            <Button
              variant="primary"
              onClick={onIniciar}
              loading={isLoading}
              disabled={!puedeIniciar}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Simulación</span>
            </Button>
          </>
        ) : (
          <>
            {/* Botón Paso a Paso */}
            <Button
              variant="primary"
              onClick={onEvaluarRegla}
              disabled={!puedeControlar || isLoading || isFinalizada || isPausada}
              className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
              title="Evaluar una sola regla y continuar el recorrido por prioridad"
            >
              <StepForward className="w-4 h-4" />
              <span>Evaluar siguiente regla</span>
            </Button>
            <Button
              variant="secondary"
              onClick={onAvanzarPaso}
              disabled={!puedeControlar || isLoading || isFinalizada || isPausada}
              className="flex items-center gap-1.5 text-teal-800 border-teal-300 hover:bg-teal-50"
              title="Evaluar todas las reglas pendientes y disparar la ganadora"
            >
              <SkipForward className="w-4 h-4 text-teal-600" />
              <span>Avanzar inferencia</span>
            </Button>

            {/* Pausar / Continuar */}
            {!isFinalizada && (
              <>
                {isPausada ? (
                  <Button
                    variant="secondary"
                    onClick={onContinuar}
                    disabled={!puedeControlar || isLoading}
                    className="flex items-center gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  >
                    <Play className="w-4 h-4 text-emerald-600 fill-current" />
                    <span>Continuar</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={onPausar}
                    disabled={!puedeControlar || isLoading}
                    className="flex items-center gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50"
                  >
                    <Pause className="w-4 h-4 text-amber-600" />
                    <span>Pausar</span>
                  </Button>
                )}
              </>
            )}

            {/* Reiniciar */}
            <Button
              variant="outline"
              onClick={onReiniciar}
              disabled={!puedeControlar || isLoading}
              className="flex items-center gap-1.5 text-stone-700 border-stone-300 hover:bg-stone-50"
              title="Reiniciar la memoria de trabajo a los hechos iniciales"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar</span>
            </Button>

            {/* Finalizar */}
            {!isFinalizada && (
              <Button
                variant="outline"
                onClick={onFinalizar}
                disabled={!puedeControlar || isLoading}
                className="flex items-center gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Finalizar</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ControlesSimulacionBar;
