import React, { useRef, useEffect } from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import type { EventoTraza } from '../types/contracts';

interface CodigoEjecucionProps {
  codigo: string;
  lineaActiva?: number | null;
  columnaActiva?: number | null;
  eventos?: EventoTraza[];
  salidasTexto?: string[];
}

export const CodigoEjecucion: React.FC<CodigoEjecucionProps> = ({
  codigo,
  lineaActiva,
  salidasTexto = [],
}) => {
  const lineas = codigo.split('\n');
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current && typeof activeLineRef.current.scrollIntoView === 'function') {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [lineaActiva]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900 font-mono text-sm shadow-inner">
      {/* Visor de código con resaltado activo */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-2"
      >
        <div className="min-w-max">
          {lineas.map((lineaTexto, idx) => {
            const numLinea = idx + 1;
            const esActiva = lineaActiva === numLinea;

            return (
              <div
                key={numLinea}
                ref={esActiva ? activeLineRef : null}
                className={`flex items-center h-6 leading-6 px-2 rounded transition-colors duration-150 ${
                  esActiva
                    ? 'bg-amber-500/25 text-amber-200 font-semibold border-l-4 border-amber-400'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                {/* Gutter con número e indicador */}
                <span
                  className={`w-10 select-none text-right pr-3 ${
                    esActiva ? 'text-amber-400 font-bold' : 'text-slate-600'
                  }`}
                >
                  {esActiva ? (
                    <span className="inline-flex items-center gap-1">
                      <ArrowRight className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                      {numLinea}
                    </span>
                  ) : (
                    numLinea
                  )}
                </span>

                {/* Texto de la línea */}
                <span className="whitespace-pre font-mono">{lineaTexto}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salida de consola (println / Mostrar) */}
      <div className="border-t border-slate-800 bg-slate-950 p-3">
        <div className="flex items-center gap-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span>Consola de Ejecución ({salidasTexto.length} mensajes)</span>
        </div>
        <div className="mt-2 max-h-32 overflow-y-auto font-mono text-xs text-emerald-400 space-y-1">
          {salidasTexto.length === 0 ? (
            <span className="italic text-slate-600">// Sin salidas de texto aún...</span>
          ) : (
            salidasTexto.map((salida, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-slate-500">&gt;</span> {salida}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
