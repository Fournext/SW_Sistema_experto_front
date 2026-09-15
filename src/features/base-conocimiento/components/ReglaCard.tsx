import React from 'react';
import { Edit2, Trash2, ArrowRight } from 'lucide-react';
import type { Regla, Variable, Hecho, Condicion, Conclusion } from '../types/types';
import Badge from '@/components/ui/Badge';

export interface ReglaCardProps {
  regla: Regla;
  variables?: Variable[];
  hechos?: Hecho[];
  onEdit: (regla: Regla) => void;
  onDelete: (regla: Regla) => void;
}

export const ReglaCard: React.FC<ReglaCardProps> = ({
  regla,
  variables,
  hechos,
  onEdit,
  onDelete,
}) => {
  const condiciones = regla.condiciones || [];
  const conclusiones = regla.conclusiones || [];

  const resolverNombreReferencia = (cond: Condicion): string => {
    const raw = cond as unknown as Record<string, unknown>;
    const varId = cond.variable_id ?? raw.variable_id ?? raw.variable;
    if (varId && variables) {
      const v = variables.find((item) => String(item.id) === String(varId));
      if (v) return v.nombre;
    }

    const hechoId = cond.hecho_id ?? raw.hecho_id ?? raw.hecho;
    if (hechoId && hechos) {
      const h = hechos.find((item) => String(item.id) === String(hechoId));
      if (h) return h.nombre;
    }

    if (cond.referencia) return cond.referencia;
    if (raw.variable_nombre) return String(raw.variable_nombre);
    if (raw.hecho_nombre) return String(raw.hecho_nombre);
    if (raw.campo) return String(raw.campo);
    if (raw.nombre) return String(raw.nombre);

    if (varId) return `Var_${String(varId).slice(0, 6)}`;
    if (hechoId) return `Hecho_${String(hechoId).slice(0, 6)}`;
    return 'Premisa';
  };

  const resolverNombreDestino = (concl: Conclusion): string => {
    const raw = concl as unknown as Record<string, unknown>;
    const varId =
      concl.variable_resultante_id ??
      raw.variable_resultante_id ??
      raw.variable_resultante ??
      raw.variable_id;
    if (varId && variables) {
      const v = variables.find((item) => String(item.id) === String(varId));
      if (v) return v.nombre;
    }

    const hechoId =
      concl.hecho_resultante_id ??
      raw.hecho_resultante_id ??
      raw.hecho_resultante ??
      raw.hecho_id;
    if (hechoId && hechos) {
      const h = hechos.find((item) => String(item.id) === String(hechoId));
      if (h) return h.nombre;
    }

    if (concl.destino) return concl.destino;
    if (raw.variable_nombre) return String(raw.variable_nombre);
    if (raw.hecho_nombre) return String(raw.hecho_nombre);
    if (raw.nombre) return String(raw.nombre);

    if (varId) return `Var_${String(varId).slice(0, 6)}`;
    if (hechoId) return `Hecho_${String(hechoId).slice(0, 6)}`;
    return 'Resultado';
  };

  const factorCertezaPct = (Number(regla.factor_certeza || 0) * 100).toFixed(0);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-teal-300/80 shadow-2xs hover:shadow-xs transition-all overflow-hidden">
      {/* Cabecera de la Regla */}
      <div className="px-5 py-3.5 bg-stone-50/70 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-sm text-teal-900 bg-teal-50 border border-teal-200/90 px-2.5 py-1 rounded-lg">
            {regla.nombre}
          </span>
          <Badge variant={regla.activa ? 'success' : 'neutral'} size="sm" dot>
            {regla.activa ? 'Activa' : 'Inactiva'}
          </Badge>
          {regla.descripcion && (
            <span className="text-xs text-stone-500 hidden md:inline truncate max-w-xs" title={regla.descripcion}>
              {regla.descripcion}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
              Prioridad: <strong className="text-stone-800">{regla.prioridad}</strong>
            </span>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              FC: <strong>{factorCertezaPct}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
            <button
              type="button"
              onClick={() => onEdit(regla)}
              className="p-1.5 text-stone-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              title="Editar regla y cláusulas"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(regla)}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar regla"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cuerpo IF - THEN */}
      <div className="p-5 font-mono text-xs sm:text-sm space-y-3">
        {condiciones.length === 0 && conclusiones.length === 0 ? (
          <div className="py-2 text-center text-stone-400 italic text-xs font-sans">
            Regla sin condiciones ni consecuencias definidas.{' '}
            <button
              type="button"
              onClick={() => onEdit(regla)}
              className="text-teal-700 font-semibold hover:underline cursor-pointer"
            >
              Hacer clic para editar
            </button>
          </div>
        ) : (
          <>
            {/* Cláusulas IF */}
            <div className="space-y-1.5">
              {condiciones.length === 0 ? (
                <div className="flex items-center gap-2 text-stone-400 font-sans italic text-xs">
                  <span className="font-bold font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                    IF
                  </span>
                  <span>(Sin condiciones definidas)</span>
                </div>
              ) : (
                condiciones.map((cond, index) => {
                  const nombreRef = resolverNombreReferencia(cond);
                  const op = cond.operador === '=' ? '==' : cond.operador || '==';
                  const esPrimer = index === 0;

                  return (
                    <div key={cond.id || index} className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs tracking-wide ${
                          esPrimer
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {esPrimer ? 'IF' : 'AND'}
                      </span>
                      <span className="font-semibold text-stone-900 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                        {nombreRef}
                      </span>
                      <span className="font-bold text-amber-700">{op}</span>
                      <span className="font-bold text-stone-900 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200 text-amber-950">
                        {cond.valor_esperado}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cláusulas THEN */}
            <div className="space-y-1.5 pt-1">
              {conclusiones.length === 0 ? (
                <div className="flex items-center gap-2 text-stone-400 font-sans italic text-xs">
                  <span className="font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs flex items-center gap-1">
                    THEN <ArrowRight className="w-3 h-3" />
                  </span>
                  <span>(Sin consecuencias definidas)</span>
                </div>
              ) : (
                conclusiones.map((concl, index) => {
                  const nombreDest = resolverNombreDestino(concl);
                  const esPrimer = index === 0;

                  return (
                    <div key={concl.id || index} className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs tracking-wide flex items-center gap-1 ${
                          esPrimer
                            ? 'bg-teal-100 text-teal-950 border border-teal-300'
                            : 'bg-stone-100 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {esPrimer ? 'THEN' : 'AND'}
                      </span>
                      <span className="font-semibold text-stone-900 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                        {nombreDest}
                      </span>
                      <span className="font-bold text-teal-700">=</span>
                      <span className="font-bold text-teal-950 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200">
                        {concl.valor_resultante}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReglaCard;
