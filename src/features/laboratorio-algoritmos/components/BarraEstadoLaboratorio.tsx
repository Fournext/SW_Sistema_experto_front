import React from 'react';
import { Terminal, Database, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { EstadoCorrida, ProgramaAlgoritmo } from '../types/contracts';

interface BarraEstadoLaboratorioProps {
  lineaActiva?: number | null;
  columnaActiva?: number | null;
  estadoVM?: EstadoCorrida | null;
  totalPasos?: number;
  totalHechos?: number;
  reglasMarcadas?: number;
  totalReglas?: number;
  programaActivo?: ProgramaAlgoritmo | null;
  salidasCount?: number;
}

export const BarraEstadoLaboratorio: React.FC<BarraEstadoLaboratorioProps> = ({
  lineaActiva,
  columnaActiva,
  estadoVM,
  totalPasos = 0,
  totalHechos = 0,
  reglasMarcadas = 0,
  totalReglas = 0,
  programaActivo,
  salidasCount = 0,
}) => {
  const estaEnSimulacion = Boolean(estadoVM);

  const getEstadoBadge = () => {
    if (!estadoVM) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Terminal className="h-3 w-3" />
          Modo Edición
        </span>
      );
    }
    switch (estadoVM) {
      case 'EJECUTANDO':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            VM: Ejecutando (Paso {totalPasos})
          </span>
        );
      case 'PAUSADA':
      case 'INICIADA':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
            <Clock className="h-3 w-3" />
            VM: Pausada (Paso {totalPasos})
          </span>
        );
      case 'ESPERANDO_ENTRADA':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
            <Clock className="h-3 w-3 animate-spin" />
            VM: Esperando Respuesta
          </span>
        );
      case 'FINALIZADA':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400">
            <CheckCircle className="h-3 w-3" />
            VM: Finalizada ({totalPasos} pasos)
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
            <AlertCircle className="h-3 w-3" />
            VM: Error en tiempo de ejecución
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            VM: {estadoVM}
          </span>
        );
    }
  };

  return (
    <footer className="flex h-6 items-center justify-between border-t border-slate-800 bg-slate-900/95 px-3 text-[11px] text-slate-400 select-none z-10 shrink-0 font-mono">
      {/* Sección Izquierda: Estado de la VM y Ejecución */}
      <div className="flex items-center gap-4">
        {getEstadoBadge()}

        {estaEnSimulacion && (
          <>
            <span className="text-slate-700">|</span>
            <span>
              BH: <strong className="text-slate-200">{totalHechos}</strong> hechos
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Reglas: <strong className="text-slate-200">{reglasMarcadas}</strong>/{totalReglas} marcadas
            </span>
            {salidasCount > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span>
                  Salidas: <strong className="text-slate-200">{salidasCount}</strong>
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Sección Derecha: Posición del Cursor y Persistencia en BD */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-slate-400">
          <Database className="h-3 w-3 text-slate-500" />
          {programaActivo ? (
            <span className="text-slate-300">
              {programaActivo.titulo} (v{programaActivo.version_entero})
            </span>
          ) : (
            <span className="text-slate-500 italic">Borrador local</span>
          )}
        </span>

        <span className="text-slate-700">|</span>

        <span>
          Ln {lineaActiva || 1}, Col {columnaActiva || 1}
        </span>

        <span className="text-slate-700">|</span>

        <span className="text-indigo-400 font-sans font-medium text-[10px] tracking-wide">
          Java SE-1
        </span>
      </div>
    </footer>
  );
};

