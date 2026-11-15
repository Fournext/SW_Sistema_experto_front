import React from 'react';
import { Cpu, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useIALocalStore, MODELOS_IA_LOCAL } from '../store/useIALocalStore';

export const IALocalHeaderBadge: React.FC = () => {
  const {
    estado,
    backendActivo,
    progresoPct,
    modeloSeleccionadoId,
    modeloCargadoId,
    setModalGestorAbierto,
  } = useIALocalStore();

  const modeloActual =
    MODELOS_IA_LOCAL.find((m) => m.id === (modeloCargadoId || modeloSeleccionadoId)) ||
    MODELOS_IA_LOCAL[0];

  const sufijoBackend = backendActivo === 'cpu' ? 'RAM' : backendActivo === 'gpu' ? 'GPU' : '';

  const renderEstado = () => {
    switch (estado) {
      case 'descargando':
        return {
          clase: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/80',
          icono: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />,
          etiqueta: `Cargando ${sufijoBackend || 'IA'} ${progresoPct}%`,
        };
      case 'listo':
        return {
          clase: 'border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100/80',
          icono: <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />,
          etiqueta: `IA ${sufijoBackend} (${modeloActual.parametros})`,
        };
      case 'generando':
        return {
          clase: 'border-teal-400 bg-teal-50 text-teal-950',
          icono: <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />,
          etiqueta: 'Infiriendo IA...',
        };
      case 'error':
        return {
          clase: 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100/80',
          icono: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
          etiqueta: 'IA Local: Error',
        };
      default:
        return {
          clase: 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:border-stone-300',
          icono: <Cpu className="w-3.5 h-3.5 text-stone-500" />,
          etiqueta: 'IA Local',
        };
    }
  };

  const ui = renderEstado();

  return (
    <button
      type="button"
      onClick={() => setModalGestorAbierto(true)}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${ui.clase}`}
      title="Gestionar modelo de Inteligencia Artificial local en el navegador (WebGPU)"
    >
      {ui.icono}
      <span className="hidden md:inline font-mono tracking-tight">{ui.etiqueta}</span>
    </button>
  );
};

export default IALocalHeaderBadge;

