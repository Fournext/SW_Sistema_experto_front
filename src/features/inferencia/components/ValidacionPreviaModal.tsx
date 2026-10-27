import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { ResultadoValidacion } from '@/features/validacion/types/types';

export interface BloqueoValidacion {
  mensaje: string;
  resultado?: ResultadoValidacion;
}

export default function ValidacionPreviaModal({ bloqueo, onClose, onIrValidacion }: {
  bloqueo: BloqueoValidacion | null;
  onClose: () => void;
  onIrValidacion?: () => void;
}) {
  const errores = bloqueo?.resultado?.incidencias?.filter((i) => i.severidad === 'ERROR') ?? [];
  return (
    <Modal isOpen={Boolean(bloqueo)} onClose={onClose} title="No se puede iniciar la inferencia" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-stone-700" role="alert">{bloqueo?.mensaje}</p>
        {bloqueo?.resultado && (
          <p className="text-xs text-stone-600">{bloqueo.resultado.resumen}</p>
        )}
        {errores.length > 0 && (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {errores.map((error) => (
              <li key={error.id} className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <p className="font-semibold">{error.codigo} · {error.entidad_nombre}</p>
                <p className="mt-1">{error.descripcion}</p>
                {error.sugerencia && <p className="mt-2 text-xs">{error.sugerencia}</p>}
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          {onIrValidacion && <Button onClick={onIrValidacion}>Ir a validar BC</Button>}
        </div>
      </div>
    </Modal>
  );
}
