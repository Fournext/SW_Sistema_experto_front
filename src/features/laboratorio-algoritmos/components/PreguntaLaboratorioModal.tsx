import React, { useState } from 'react';
import { HelpCircle, Check, X } from 'lucide-react';
import type { PreguntaPendiente } from '../types/contracts';

interface PreguntaLaboratorioModalProps {
  pregunta: PreguntaPendiente | null;
  onResponder: (valor: string) => void;
  onCancelar: () => void;
}

export const PreguntaLaboratorioModal: React.FC<PreguntaLaboratorioModalProps> = ({
  pregunta,
  onResponder,
  onCancelar,
}) => {
  const [valor, setValor] = useState('');

  if (!pregunta) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valor.trim()) {
      onResponder(valor.trim());
      setValor('');
    }
  };

  const handleCancel = () => {
    onCancelar();
    setValor('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-blue-500/50 bg-slate-900 p-6 shadow-2xl ring-1 ring-blue-500/20 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Consulta en Tiempo Real (Preguntar)
            </h3>
            <p className="text-xs text-slate-400">
              El algoritmo requiere un valor para continuar la inferencia.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Variable Consultada
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-amber-300">
              {pregunta.variable_nombre}
            </div>
            <div className="mt-2 text-xs text-slate-300 leading-relaxed">
              {pregunta.texto}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Valor de Respuesta
            </label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej. Si, No, 85, etc."
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <X className="h-4 w-4 text-slate-400" />
              Cancelar (Devolver null)
            </button>
            <button
              type="submit"
              disabled={!valor.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              Confirmar Respuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

