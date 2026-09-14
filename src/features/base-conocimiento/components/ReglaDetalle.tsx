import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, CheckCircle2 } from 'lucide-react';
import type { Regla } from '../types/types';
import type { CondicionFormData, ConclusionFormData } from '../schemas/schemas';
import CondicionForm from './CondicionForm';
import ConclusionForm from './ConclusionForm';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useReglasMutations } from '../hooks/useBaseConocimiento';

export interface ReglaDetalleProps {
  regla: Regla;
  baseConocimientoId: number | string | undefined;
}

export const ReglaDetalle: React.FC<ReglaDetalleProps> = ({ regla, baseConocimientoId }) => {
  const { agregarCondicion, eliminarCondicion, agregarConclusion, eliminarConclusion } =
    useReglasMutations(baseConocimientoId);

  const [condicionModalOpen, setCondicionModalOpen] = useState(false);
  const [conclusionModalOpen, setConclusionModalOpen] = useState(false);

  const handleAgregarCondicion = async (data: CondicionFormData) => {
    await agregarCondicion.mutateAsync({
      reglaId: regla.id,
      datos: data,
    });
    setCondicionModalOpen(false);
  };

  const handleAgregarConclusion = async (data: ConclusionFormData) => {
    await agregarConclusion.mutateAsync({
      reglaId: regla.id,
      datos: data,
    });
    setConclusionModalOpen(false);
  };

  return (
    <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sección de Antecedentes (IF / Condiciones) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-amber-500" />
              Premisas / Condiciones (SI...)
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => setCondicionModalOpen(true)}
              className="text-xs py-1"
            >
              Condición
            </Button>
          </div>

          {!regla.condiciones || regla.condiciones.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Sin condiciones definidas. Pulsa en "+ Condición" para agregar una premisa evaluable.
            </p>
          ) : (
            <div className="space-y-2">
              {regla.condiciones.map((c, index) => (
                <div
                  key={c.id || index}
                  className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg text-xs"
                >
                  <div className="font-mono text-slate-800">
                    <span className="font-semibold text-amber-900">{c.referencia}</span>{' '}
                    <span className="font-bold text-amber-600">{c.operador}</span>{' '}
                    <span className="text-slate-900 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">
                      "{c.valor_esperado}"
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarCondicion.mutate(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white cursor-pointer transition-colors"
                    title="Eliminar condición"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Consecuentes (THEN / Conclusiones) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Consecuencias / Acciones (ENTONCES...)
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => setConclusionModalOpen(true)}
              className="text-xs py-1"
            >
              Conclusión
            </Button>
          </div>

          {!regla.conclusiones || regla.conclusiones.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Sin consecuencias deducidas. Pulsa en "+ Conclusión" para agregar la conclusión resultante.
            </p>
          ) : (
            <div className="space-y-2">
              {regla.conclusiones.map((concl, index) => (
                <div
                  key={concl.id || index}
                  className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs"
                >
                  <div className="font-mono text-slate-800">
                    <span className="font-semibold text-emerald-900">{concl.destino}</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-emerald-950 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      "{concl.valor_resultante}"
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarConclusion.mutate(concl.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white cursor-pointer transition-colors"
                    title="Eliminar conclusión"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Condición */}
      <Modal
        isOpen={condicionModalOpen}
        onClose={() => setCondicionModalOpen(false)}
        title={`Agregar Condición (IF) a ${regla.nombre}`}
        description="Establece una premisa booleana o de comparación que debe cumplirse."
        size="sm"
      >
        <CondicionForm
          onSubmit={handleAgregarCondicion}
          loading={agregarCondicion.isPending}
          onCancel={() => setCondicionModalOpen(false)}
        />
      </Modal>

      {/* Modal Agregar Conclusión */}
      <Modal
        isOpen={conclusionModalOpen}
        onClose={() => setConclusionModalOpen(false)}
        title={`Agregar Conclusión (THEN) a ${regla.nombre}`}
        description="Establece el hecho derivado o deducción cuando se activan las condiciones."
        size="sm"
      >
        <ConclusionForm
          onSubmit={handleAgregarConclusion}
          loading={agregarConclusion.isPending}
          onCancel={() => setConclusionModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ReglaDetalle;
