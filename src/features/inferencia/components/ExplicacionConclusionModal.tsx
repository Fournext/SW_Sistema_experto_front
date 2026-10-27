import React from 'react';
import { Database, Cpu, Lightbulb } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useExplicacionConclusion } from '../hooks/useInferencia';

interface ExplicacionConclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inferenciaId?: string;
}

export const ExplicacionConclusionModal: React.FC<ExplicacionConclusionModalProps> = ({
  isOpen,
  onClose,
  inferenciaId,
}) => {
  const { data: explicacion, isLoading, error } = useExplicacionConclusion(
    isOpen ? inferenciaId : undefined
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Explicación Determinista del Razonamiento"
      size="xl"
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="text-center py-12 text-stone-500">
            <Spinner size="lg" />
            <p className="mt-3 text-sm">Reconstruyendo trazabilidad y justificación del razonamiento...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            No se pudo obtener la explicación para esta ejecución. Verifique que haya alcanzado una conclusión.
          </div>
        )}

        {explicacion && (
          <>
            {/* Banner de la Conclusión */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-teal-950 text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-600/40 flex items-center justify-center text-teal-300">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                    {explicacion.conclusion ? 'Conclusión demostrada' : 'Sin conclusión'}
                  </span>
                  <h4 className="text-lg font-bold font-serif">
                    {explicacion.conclusion_nombre != null && explicacion.conclusion_valor != null
                      ? `${explicacion.conclusion_nombre} = ${String(explicacion.conclusion_valor)}`
                      : explicacion.conclusion ?? 'No se alcanzó una conclusión'}
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-teal-200 block">Factor de Certeza Final</span>
                <span className="text-lg font-bold font-mono text-teal-100">
                  {explicacion.factor_certeza_final == null
                    ? 'No registrado'
                    : Number(explicacion.factor_certeza_final).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Resumen Didáctico */}
            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-700">
              <p className="font-semibold text-stone-900 mb-1">Resumen del Razonamiento Simbólico:</p>
              <p className="leading-relaxed whitespace-pre-line">{explicacion.resumen_explicativo || explicacion.texto}</p>
            </div>

            {/* 1. Hechos Iniciales Relevantes */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                1. Hechos Iniciales Utilizados
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {!explicacion.hechos_iniciales_relevantes?.length && (
                  <p className="text-xs text-stone-500">No hay hechos iniciales utilizados registrados.</p>
                )}
                {explicacion.hechos_iniciales_relevantes?.map((h, i) => (
                  <div key={i} className="p-2.5 bg-white border border-stone-200 rounded-xl text-xs flex items-center justify-between">
                    <span className="font-mono font-bold text-stone-800">{h.nombre}</span>
                    <span className="font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                      {String(h.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Reglas Disparadas en Orden */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                2. Secuencia de Reglas Disparadas
              </h5>
              <div className="space-y-3">
                {!explicacion.reglas_disparadas?.length && (
                  <p className="text-xs text-stone-500">No se registraron reglas disparadas.</p>
                )}
                {explicacion.reglas_disparadas?.map((r, i) => (
                  <div key={r.id || i} className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-2xs text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <strong className="text-stone-900 text-sm">{r.nombre}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.prioridad != null && <Badge variant="neutral" className="text-[10px] font-mono">
                          P: {r.prioridad}
                        </Badge>}
                        {r.factor_certeza != null && <Badge variant="success" className="text-[10px] font-mono">
                          FC: {Number(r.factor_certeza).toFixed(2)}
                        </Badge>}
                      </div>
                    </div>

                    <div className="pl-7 space-y-1 text-stone-600 text-[11px]">
                      <div>
                        <span className="font-semibold text-stone-700">SI (Condiciones): </span>
                        {r.condiciones_cumplidas?.join(' Y ') || 'Condiciones verificadas'}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-700">ENTONCES (Consecuencia): </span>
                        <span className="font-mono text-emerald-700 font-semibold">{r.consecuencia}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Cadena de Razonamiento */}
            {explicacion.cadena_razonamiento && explicacion.cadena_razonamiento.length > 0 && (
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  3. Ruta de Deducción Paso a Paso
                </h5>
                <ol className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs text-stone-700 list-decimal list-inside">
                  {explicacion.cadena_razonamiento.map((paso, idx) => (
                    <li key={idx} className="font-mono text-[11px] text-stone-800">
                      {paso}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-stone-200">
          <Button variant="outline" onClick={onClose}>
            Cerrar Explicación
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExplicacionConclusionModal;
