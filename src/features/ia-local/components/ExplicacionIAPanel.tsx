import React, { useState } from 'react';
import {
  BookOpenCheck,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useIALocalStore } from '../store/useIALocalStore';

export interface ExplicacionIAPanelProps {
  titulo: string;
  subtitulo?: string;
  textoBoton?: string;
  onGenerar: (onToken: (acumulado: string) => void) => Promise<string>;
  compacto?: boolean;
  autoIniciar?: boolean;
}

export const ExplicacionIAPanel: React.FC<ExplicacionIAPanelProps> = ({
  titulo,
  subtitulo,
  textoBoton = 'Generar explicación',
  onGenerar,
  compacto = false,
}) => {
  const { estado, progresoPct, setModalGestorAbierto } = useIALocalStore();
  const [contenido, setContenido] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const ejecutar = async () => {
    setError(null);
    setCargando(true);
    setContenido('');
    try {
      const final = await onGenerar((acumulado) => {
        setContenido(acumulado);
      });
      setContenido(final);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo generar la explicación con el modelo local.'
      );
    } finally {
      setCargando(false);
    }
  };

  const copiarTexto = async () => {
    if (!contenido) return;
    try {
      await navigator.clipboard.writeText(contenido);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Ignorar
    }
  };

  return (
    <div
      className={`rounded-xl border border-stone-200 bg-stone-50/70 ${
        compacto ? 'p-3.5' : 'p-4 sm:p-5'
      } space-y-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900 font-serif">{titulo}</h4>
            {subtitulo && <p className="text-xs text-stone-500">{subtitulo}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {estado === 'no_cargado' && (
            <button
              type="button"
              onClick={() => setModalGestorAbierto(true)}
              className="text-[11px] font-mono text-stone-500 hover:text-teal-800 underline cursor-pointer"
            >
              Configurar modelo
            </button>
          )}
          {contenido && !cargando && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void copiarTexto()}
              icon={copiado ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
          )}
          <Button
            variant={contenido ? 'outline' : 'primary'}
            size="sm"
            loading={cargando}
            icon={contenido ? <RefreshCw className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
            onClick={() => void ejecutar()}
          >
            {cargando
              ? estado === 'descargando'
                ? `Cargando modelo (${progresoPct}%)`
                : 'Redactando...'
              : contenido
              ? 'Regenerar'
              : textoBoton}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {contenido && (
        <div className="p-3.5 rounded-lg bg-white border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
          {contenido}
          {cargando && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-teal-700 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  );
};

export default ExplicacionIAPanel;

