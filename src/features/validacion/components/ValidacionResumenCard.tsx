import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { ResultadoValidacion } from '../types/types';

interface ValidacionResumenCardProps {
  resultado: ResultadoValidacion | null;
  isValidando: boolean;
  onValidar: () => void;
  puedeValidar?: boolean;
}

export const ValidacionResumenCard: React.FC<ValidacionResumenCardProps> = ({
  resultado,
  isValidando,
  onValidar,
  puedeValidar = true,
}) => {
  if (!resultado) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm text-center">
        <ShieldCheck className="w-12 h-12 mx-auto text-stone-300 mb-3" />
        <h3 className="text-base font-bold text-stone-800">
          Base de Conocimiento aún no validada
        </h3>
        <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-5">
          Ejecuta la validación determinista para analizar reglas duplicadas, inconsistencias semánticas, variables huérfanas y reglas incompletas.
        </p>
        <Button
          variant="primary"
          onClick={onValidar}
          loading={isValidando}
          disabled={!puedeValidar}
          className="bg-teal-700 hover:bg-teal-800 text-white"
        >
          <ShieldCheck className="w-4 h-4 mr-1.5" />
          Validar Base de Conocimiento Ahora
        </Button>
      </div>
    );
  }

  const { es_valida, total_errores, total_advertencias, resumen, fecha_validacion } = resultado;
  const fechaFmt = fecha_validacion ? new Date(fecha_validacion).toLocaleString() : 'Reciente';

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition-all ${
        es_valida
          ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200'
          : 'bg-gradient-to-br from-rose-50/60 to-white border-rose-200'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Estado y Diagnóstico */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              es_valida
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {es_valida ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                {es_valida
                  ? 'Base de Conocimiento Consistente'
                  : 'Se detectaron anomalías o inconsistencias'}
              </h3>
              <Badge variant={es_valida ? 'success' : 'danger'} className="text-xs">
                {es_valida ? 'Válida' : 'Requiere Revisión'}
              </Badge>
            </div>

            <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
              {resumen}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Última verificación: {fechaFmt}</span>
            </div>
          </div>
        </div>

        {/* Métricas y Botón Revalidar */}
        <div className="flex items-center gap-4 self-end md:self-center">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-rose-600 text-xs font-semibold mb-0.5">
                <XCircle className="w-3.5 h-3.5" /> Errores
              </div>
              <span className="text-xl font-bold font-mono text-rose-700">
                {total_errores}
              </span>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-semibold mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Advertencias
              </div>
              <span className="text-xl font-bold font-mono text-amber-700">
                {total_advertencias}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onValidar}
            loading={isValidando}
            disabled={!puedeValidar}
            className="flex items-center gap-1.5 text-stone-700 hover:bg-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revalidar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ValidacionResumenCard;
