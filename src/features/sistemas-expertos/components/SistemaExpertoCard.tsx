import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Database, PlayCircle, Trash2, ArrowRight, Calendar } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { SistemaExperto } from '../types/types';

export interface SistemaExpertoCardProps {
  sistema: SistemaExperto;
  onEliminar: (id: string | number) => void;
}

export const SistemaExpertoCard: React.FC<SistemaExpertoCardProps> = ({
  sistema,
  onEliminar,
}) => {
  const navigate = useNavigate();

  const fechaCruda = sistema.creado_en || sistema.fecha_creacion || sistema.created_at;
  const fechaFormateada = fechaCruda
    ? new Date(fechaCruda).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Reciente';

  const esActivo =
    sistema.activo !== false &&
    !sistema.estado?.toLowerCase().includes('borrador');

  return (
    <Card hoverable className="flex flex-col justify-between h-full group border-slate-200">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant={esActivo ? 'success' : 'neutral'} dot size="sm">
            {esActivo ? 'Activo' : 'Borrador'}
          </Badge>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fechaFormateada}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {sistema.nombre}
        </h3>

        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {sistema.descripcion || 'Sin descripción detallada registrada para este sistema.'}
        </p>

        {/* Accesos rápidos a los módulos */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistema.id}/editor`)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-sky-50/60 hover:bg-sky-100 text-sky-700 text-[11px] font-medium transition-colors cursor-pointer"
            title="Abrir editor visual"
          >
            <Network className="w-4 h-4 mb-1" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistema.id}/base-conocimiento`)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-50/60 hover:bg-amber-100 text-amber-700 text-[11px] font-medium transition-colors cursor-pointer"
            title="Gestionar hechos y reglas"
          >
            <Database className="w-4 h-4 mb-1" />
            <span>Base C.</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistema.id}/inferencia`)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 text-[11px] font-medium transition-colors cursor-pointer"
            title="Ejecutar motor de inferencia"
          >
            <PlayCircle className="w-4 h-4 mb-1" />
            <span>Inferencia</span>
          </button>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/sistemas/${sistema.id}`)}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          iconPosition="right"
          className="text-xs font-semibold"
        >
          Ver Detalle
        </Button>

        <button
          type="button"
          onClick={() => onEliminar(sistema.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Eliminar sistema"
          aria-label="Eliminar sistema"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

export default SistemaExpertoCard;
