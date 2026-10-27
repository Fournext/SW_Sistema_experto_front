import React from 'react';
import { Workflow, Check, X, ArrowRight, Minus } from 'lucide-react';
import ReglaEstadoBadge from './ReglaEstadoBadge';
import type { DetalleInferencia, EstadoRegla } from '../types/types';
import type { Regla, Variable, Hecho } from '@/features/base-conocimiento/types/types';

export interface ReglasEvaluadasPanelProps {
  detalles: DetalleInferencia[];
  reglas?: Regla[];
  variables?: Variable[];
  hechos?: Hecho[];
  pasoActual?: number;
}

const nombreDetalle = (detalle: DetalleInferencia) =>
  (typeof detalle.regla === 'string' ? detalle.regla : detalle.regla?.nombre)
  || detalle.nombre_regla || detalle.regla_nombre;

interface GrupoEvaluacion {
  detalle: DetalleInferencia;
  estados: EstadoRegla[];
  paso: number | null;
}

export const ReglasEvaluadasPanel: React.FC<ReglasEvaluadasPanelProps> = ({
  detalles, reglas = [], variables = [], hechos = [], pasoActual,
}) => {
  const grupos = new Map<string, GrupoEvaluacion>();
  const reglasEvaluadas = new Set<string>();
  detalles.forEach((detalle, index) => {
    const id = detalle.regla_id ?? (typeof detalle.regla === 'object' ? detalle.regla.id : undefined);
    const reglaKey = id !== undefined ? `id:${id}` : `nombre:${nombreDetalle(detalle)?.trim().toLowerCase() ?? index}`;
    const paso = detalle.paso_visual ?? detalle.paso_numero ?? null;
    const key = `${paso ?? 'sin_paso'}:${reglaKey}`;
    reglasEvaluadas.add(reglaKey);
    const grupo = grupos.get(key);
    if (grupo) {
      grupo.detalle = { ...grupo.detalle, ...detalle,
        condiciones_cumplidas: detalle.condiciones_cumplidas ?? grupo.detalle.condiciones_cumplidas,
        condiciones_evaluadas: detalle.condiciones_evaluadas ?? grupo.detalle.condiciones_evaluadas,
      };
      if (grupo.estados.at(-1) !== detalle.estado) grupo.estados.push(detalle.estado);
    } else {
      grupos.set(key, { detalle: { ...detalle }, estados: [detalle.estado], paso });
    }
  });

  const pasos = new Map<number | null, Array<[string, GrupoEvaluacion]>>();
  for (const entrada of grupos) {
    const paso = entrada[1].paso;
    if (!pasos.has(paso)) pasos.set(paso, []);
    pasos.get(paso)!.push(entrada);
  }
  const pasosOrdenados = Array.from(pasos).sort(([a], [b]) => (a ?? -1) - (b ?? -1));

  const nombreReferencia = (variableId?: string | number | null, hechoId?: string | number | null, nombre?: string) =>
    variables.find((v) => variableId != null && String(v.id) === String(variableId))?.nombre
    || hechos.find((h) => hechoId != null && String(h.id) === String(hechoId))?.nombre
    || nombre || (variableId != null ? `Variable ${variableId}` : hechoId != null ? `Hecho ${hechoId}` : 'Sin referencia');

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-100">
        <Workflow className="w-4 h-4 text-teal-700" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
          2. Reglas Evaluadas por el Motor
        </h4>
        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold ml-auto">
          {reglasEvaluadas.size} evaluadas
        </span>
      </div>

      {detalles.length === 0 ? (
        <p className="text-xs text-stone-400 italic py-2">
          Aún no se ha evaluado ninguna regla. Haz clic en "Ejecutar Inferencia".
        </p>
      ) : (
        <div className="space-y-3">
          {pasosOrdenados.map(([paso, evaluaciones], pasoIndex) => (
            <details
              key={paso ?? 'sin_paso'}
              open={pasoActual !== undefined ? paso === pasoActual : pasoIndex === pasosOrdenados.length - 1}
              className="rounded-xl border border-stone-200 overflow-hidden"
            >
              <summary className="px-3 py-2.5 bg-stone-50 cursor-pointer text-xs font-semibold text-stone-700 marker:text-stone-400">
                <span className="ml-1">{paso === null ? 'Evaluaciones sin paso registrado' : `Paso ${paso}`}</span>
                <span className="ml-2 text-[11px] font-normal text-stone-500">
                  {evaluaciones.length} {evaluaciones.length === 1 ? 'regla evaluada' : 'reglas evaluadas'}
                </span>
              </summary>
              <div className="p-2.5 space-y-2.5">
          {evaluaciones.map(([key, { detalle, estados }], index) => {
            const nombre =
              (typeof detalle.regla === 'string' ? detalle.regla : detalle.regla?.nombre) ||
              detalle.nombre_regla ||
              detalle.regla_nombre ||
              (detalle.regla_id ? `Regla_${String(detalle.regla_id).slice(0, 6)}` : `Regla_${index + 1}`);
            const esExitosa = detalle.estado === 'ACTIVADA' || detalle.estado === 'EJECUTADA';
            const reglaId = detalle.regla_id ?? (typeof detalle.regla === 'object' ? detalle.regla.id : undefined);
            const regla = reglas.find((r) => reglaId != null && String(r.id) === String(reglaId))
              || (typeof detalle.regla === 'object' ? detalle.regla : undefined)
              || reglas.find((r) => r.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());

            return (
              <div
                key={key}
                role="group"
                aria-label={`Evaluación de ${nombre}`}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  esExitosa
                    ? 'bg-teal-50/40 border-teal-200'
                    : 'bg-stone-50/70 border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{nombre}</span>
                    <div className="flex flex-wrap items-center gap-1.5" aria-label="Estados de la regla">
                      {estados.map((estado, estadoIndex) => (
                        <React.Fragment key={`${estado}_${estadoIndex}`}>
                          {estadoIndex > 0 && <ArrowRight className="w-3 h-3 text-slate-400" aria-hidden="true" />}
                          <ReglaEstadoBadge estado={estado} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {(detalle.prioridad ?? regla?.prioridad) !== undefined && (
                    <span className="text-[11px] text-slate-500">
                      Prioridad: <strong className="text-slate-700">{detalle.prioridad ?? regla?.prioridad}</strong>
                    </span>
                  )}
                </div>
                {/* Explicación o detalle de condiciones */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-3">
                  {detalle.resultado_generado && detalle.resultado_generado !== 'Condiciones no satisfechas.' && (
                    <div className="text-[11px] text-slate-700 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-emerald-800">Devolvió:</span>
                      <code className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 font-mono font-bold text-emerald-900">
                        {detalle.resultado_generado}
                      </code>
                    </div>
                  )}

                  {detalle.estado === 'RECHAZADA' && (
                    <span className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/80 font-medium italic">
                      {detalle.resultado_generado || 'Condiciones no satisfechas con la memoria actual.'}
                    </span>
                  )}

                  {detalle.explicacion && (
                    <p className="w-full text-[11px] text-slate-500 mt-1 italic">
                      {detalle.explicacion}
                    </p>
                  )}
                </div>
                {regla && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2 font-mono text-[11px] leading-relaxed break-words">
                    <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500">Definición de la regla</p>
                    <div className="space-y-1.5">
                      {regla.condiciones?.length ? regla.condiciones.map((c, cIdx) => {
                        const resultado = detalle.condiciones_evaluadas?.find((evaluada) =>
                          String(evaluada.condicion_id) === String(c.id)
                        )?.resultado;
                        const estado = resultado === true ? 'VERDADERA' : resultado === false ? 'FALSA' : 'SIN DETALLE';
                        return (
                          <div key={c.id} className="flex items-start gap-2 text-slate-700">
                            <span
                              role="img"
                              aria-label={`Condición #${cIdx + 1} ${estado}`}
                              title={resultado === undefined ? 'No hay un resultado individual registrado para esta condición.' : `Condición #${cIdx + 1} ${estado}`}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded shrink-0 ${
                                resultado === true ? 'bg-emerald-100 text-emerald-700'
                                  : resultado === false ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {resultado === true ? <Check className="w-3.5 h-3.5" />
                                : resultado === false ? <X className="w-3.5 h-3.5" />
                                : <Minus className="w-3.5 h-3.5" />}
                            </span>
                            <p>
                              <strong className="text-stone-900 font-bold">{cIdx === 0 ? 'SI ' : 'Y '}</strong>
                              {`${nombreReferencia(c.variable_id, c.hecho_id, c.referencia || c.variable_nombre || c.hecho_nombre)} ${c.operador} ${c.valor_esperado}`}
                            </p>
                          </div>
                        );
                      }) : <p className="text-stone-700"><strong className="text-stone-900 font-bold">SI </strong>Sin condiciones</p>}
                    </div>
                    <p className="text-slate-700">
                      <strong className="text-teal-700">ENTONCES </strong>
                      {regla.conclusiones?.length ? regla.conclusiones.map((c) =>
                        `${nombreReferencia(c.variable_resultante_id, c.hecho_resultante_id, c.destino || c.variable_nombre || c.hecho_nombre)} = ${c.valor_resultante}`
                      ).join(' Y ') : 'Sin conclusiones'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReglasEvaluadasPanel;
