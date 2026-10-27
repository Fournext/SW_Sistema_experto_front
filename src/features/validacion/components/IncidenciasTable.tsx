import React, { useState } from 'react';
import {
  AlertCircle,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { IncidenciaValidacion } from '../types/types';

interface IncidenciasTableProps {
  incidencias: IncidenciaValidacion[];
  onIrAEntidad?: (entidadTipo: string, entidadId?: string) => void;
}

export const IncidenciasTable: React.FC<IncidenciasTableProps> = ({
  incidencias,
  onIrAEntidad,
}) => {
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('TODAS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const incidenciasFiltradas = incidencias.filter((inc) => {
    if (filtroSeveridad !== 'TODAS' && inc.severidad !== filtroSeveridad) return false;
    if (filtroTipo !== 'TODOS' && inc.tipo !== filtroTipo) return false;
    return true;
  });

  if (incidencias.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
        <h4 className="text-sm font-bold text-stone-800">
          Sin incidencias detectadas
        </h4>
        <p className="text-xs text-stone-500 mt-1">
          La base de conocimiento no presenta anomalías ni conflictos estructurales.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
      {/* Encabezado y Filtros */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Reporte Detallado de Errores y Advertencias
          </h3>
          <p className="text-[11px] text-stone-500">
            Mostrando {incidenciasFiltradas.length} de {incidencias.length} incidencia(s)
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroSeveridad}
            onChange={(e) => setFiltroSeveridad(e.target.value)}
            aria-label="Filtrar por severidad"
            className="text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-700 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
          >
            <option value="TODAS">Todas las severidades</option>
            <option value="ERROR">Solo Errores</option>
            <option value="ADVERTENCIA">Solo Advertencias</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            aria-label="Filtrar por tipo de problema"
            className="text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-700 font-medium focus:ring-1 focus:ring-teal-600 focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="ESTRUCTURAL">Estructural</option>
            <option value="SEMANTICA">Semántica</option>
            <option value="REFERENCIAL">Referencial</option>
            <option value="CICLO">Ciclo o Recursión</option>
          </select>
        </div>
      </div>

      {/* Lista de Incidencias */}
      <div className="divide-y divide-stone-100">
        {incidenciasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 font-medium">
            No hay incidencias que coincidan con los filtros seleccionados.
          </div>
        ) : (
          incidenciasFiltradas.map((inc) => {
            const esError = inc.severidad === 'ERROR';

            return (
              <div
                key={inc.id}
                className="p-4 hover:bg-stone-50/50 transition-colors flex flex-col gap-2.5 text-xs"
              >
                {/* Cabecera de la incidencia */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={esError ? 'danger' : 'warning'}
                      className="font-mono text-[10px] font-bold"
                    >
                      {inc.codigo}
                    </Badge>

                    <Badge variant="neutral" className="text-[10px]">
                      {inc.tipo}
                    </Badge>

                    <span className="font-semibold text-stone-900 text-sm">
                      {inc.entidad_tipo}: <strong className="font-mono text-teal-900">{inc.entidad_nombre}</strong>
                    </span>
                  </div>

                  {onIrAEntidad && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIrAEntidad(inc.entidad_tipo, inc.entidad_id)}
                      className="text-[11px] text-teal-800 border-stone-200 hover:bg-stone-100 shrink-0"
                    >
                      <span>Ir al Editor</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Descripción */}
                <p className="text-stone-700 leading-relaxed pl-1">
                  {inc.descripcion}
                </p>

                {/* Causa y Sugerencia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {inc.posible_causa && (
                    <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-[11px] text-stone-600 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-stone-800 block mb-0.5">Posible causa:</strong>
                        <span>{inc.posible_causa}</span>
                      </div>
                    </div>
                  )}

                  {inc.sugerencia && (
                    <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-2.5 text-[11px] text-teal-900 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-teal-950 block mb-0.5">Sugerencia de corrección:</strong>
                        <span>{inc.sugerencia}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default IncidenciasTable;
