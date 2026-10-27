import React, { useState, useEffect } from 'react';
import { HelpCircle, Check, ArrowRight, CornerDownRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import type { TipoDato } from '@/features/base-conocimiento/types/types';

export interface PreguntaEvaluacion {
  reglaNombre: string;
  reglaDescripcion?: string;
  condicionTexto?: string;
  nombreVariable: string;
  pregunta: string;
  tipoDato: TipoDato;
  opciones?: string[];
  valorActual?: string;
  origen: 'VARIABLE' | 'HECHO';
}

export interface PreguntaReglaModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluacion: PreguntaEvaluacion | null;
  onResponder: (nombre: string, valor: string, tipoDato: string, opciones?: string[]) => void;
  loading?: boolean;
  totalPendientes?: number;
  indicePendiente?: number;
}

export const PreguntaReglaModal: React.FC<PreguntaReglaModalProps> = ({
  isOpen,
  onClose,
  evaluacion,
  onResponder,
  loading = false,
  totalPendientes = 1,
  indicePendiente = 1,
}) => {
  const [valor, setValor] = useState('');
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Sincronizar valor cada vez que cambie la pregunta que se evalúa
  useEffect(() => {
    if (evaluacion) {
      if (evaluacion.valorActual !== undefined && evaluacion.valorActual !== '') {
        setValor(evaluacion.valorActual);
      } else if (evaluacion.tipoDato === 'BOOLEANO') {
        setValor('true');
      } else if (evaluacion.tipoDato === 'OPCION' && evaluacion.opciones && evaluacion.opciones.length > 0) {
        setValor(evaluacion.opciones[0]);
      } else {
        setValor('');
      }
      setErrorInput(null);
    }
  }, [evaluacion]);

  if (!evaluacion) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const valTrim = valor.trim();
    if (!valTrim) {
      setErrorInput('Por favor ingrese un valor para continuar con la simulación.');
      return;
    }

    if (evaluacion.tipoDato === 'ENTERO') {
      if (!/^-?\d+$/.test(valTrim)) {
        setErrorInput('El valor debe ser un número entero válido (sin decimales ni letras).');
        return;
      }
    } else if (evaluacion.tipoDato === 'DECIMAL') {
      if (isNaN(Number(valTrim)) || !/^-?\d+(\.\d+)?$/.test(valTrim)) {
        setErrorInput('El valor debe ser un número decimal válido (ej: 38.5).');
        return;
      }
    }

    setErrorInput(null);
    onResponder(
      evaluacion.nombreVariable,
      valTrim,
      evaluacion.tipoDato,
      evaluacion.opciones
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consulta de Inferencia Interactiva"
      description="El motor está evaluando una regla que requiere el valor de una variable inicial."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner de contexto: Regla y Condición evaluada */}
        <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
              Evaluando Regla
            </span>
            {totalPendientes > 1 && (
              <span className="text-[11px] bg-white border border-teal-200 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                Pregunta {indicePendiente} de {totalPendientes}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <strong className="text-sm font-bold text-teal-950 font-mono">
              {evaluacion.reglaNombre}
            </strong>
            {evaluacion.reglaDescripcion && (
              <span className="text-xs text-teal-700/80 line-clamp-1">
                — {evaluacion.reglaDescripcion}
              </span>
            )}
          </div>

          {evaluacion.condicionTexto && (
            <div className="flex items-center gap-1.5 text-xs text-teal-800 pt-1 border-t border-teal-200/60 font-mono">
              <CornerDownRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Condición a verificar: <strong>{evaluacion.condicionTexto}</strong></span>
            </div>
          )}
        </div>

        {/* Tarjeta de la Pregunta */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {evaluacion.origen === 'VARIABLE' ? 'Variable Inicial' : 'Hecho Inicial'}
                </span>
                <Badge variant="teal" size="sm" className="text-[10px]">
                  {evaluacion.tipoDato}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {evaluacion.pregunta}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Identificador: <span className="text-slate-700 font-semibold">{evaluacion.nombreVariable}</span>
              </p>
            </div>
          </div>

          {/* Campo interactivo según Tipo de Dato */}
          <div className="pt-2">
            {evaluacion.tipoDato === 'BOOLEANO' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setValor('true')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    valor.toLowerCase() === 'true'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Sí / Verdadero
                </button>
                <button
                  type="button"
                  onClick={() => setValor('false')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    valor.toLowerCase() === 'false'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  No / Falso
                </button>
              </div>
            ) : evaluacion.tipoDato === 'OPCION' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Seleccione una opción:</label>
                <div className="flex flex-wrap gap-2">
                  {(evaluacion.opciones || []).map((opc) => {
                    const esSeleccionada = valor === opc;
                    return (
                      <button
                        key={opc}
                        type="button"
                        onClick={() => setValor(opc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          esSeleccionada
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opc}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Input
                label="Valor de respuesta"
                type={evaluacion.tipoDato === 'ENTERO' || evaluacion.tipoDato === 'DECIMAL' ? 'number' : 'text'}
                step={evaluacion.tipoDato === 'DECIMAL' ? 'any' : evaluacion.tipoDato === 'ENTERO' ? '1' : undefined}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={`Ingrese ${evaluacion.nombreVariable}...`}
                error={errorInput || undefined}
                autoFocus
              />
            )}

            {errorInput && evaluacion.tipoDato !== 'ENTERO' && evaluacion.tipoDato !== 'DECIMAL' && (
              <p className="text-xs text-rose-600 font-medium mt-2">{errorInput}</p>
            )}
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-sm"
          >
            <span>Responder y Continuar</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PreguntaReglaModal;
