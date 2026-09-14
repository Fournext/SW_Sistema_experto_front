import React from 'react';
import { X, Trash2 } from 'lucide-react';
import useEditorStore from '../store/editorStore';
import PanelPropiedadesHecho from './PanelPropiedadesHecho';
import PanelPropiedadesVariable from './PanelPropiedadesVariable';
import PanelPropiedadesRegla from './PanelPropiedadesRegla';
import PanelPropiedadesCondicion from './PanelPropiedadesCondicion';
import PanelPropiedadesConclusion from './PanelPropiedadesConclusion';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { TipoNodo, NodoDatosGenerales } from '../types/types';

export interface PanelPropiedadesProps {
  onGuardarPropiedades: (nodoId: string, nuevosDatos: Partial<NodoDatosGenerales>) => Promise<void> | void;
  onEliminarNodo: (nodoId: string) => Promise<void> | void;
  guardando?: boolean;
}

const tipoBadgeVariant: Record<TipoNodo, 'success' | 'info' | 'warning' | 'indigo' | 'purple'> = {
  HECHO: 'success',
  VARIABLE: 'info',
  CONDICION: 'warning',
  REGLA: 'indigo',
  CONCLUSION: 'purple',
};

export const PanelPropiedades: React.FC<PanelPropiedadesProps> = ({
  onGuardarPropiedades,
  onEliminarNodo,
  guardando = false,
}) => {
  const { nodoSeleccionado, panelAbierto, cerrarPanel } = useEditorStore();

  if (!panelAbierto || !nodoSeleccionado) return null;

  const tipo = (nodoSeleccionado.type as TipoNodo) || 'HECHO';

  const handleGuardar = (datos: Partial<NodoDatosGenerales>) => {
    onGuardarPropiedades(nodoSeleccionado.id, datos);
  };

  return (
    <aside
      className="w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full z-20 transition-all duration-200"
      aria-label="Panel de propiedades del nodo"
    >
      {/* Header del panel */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Propiedades</h3>
            <Badge variant={tipoBadgeVariant[tipo] || 'neutral'} size="sm">
              {tipo}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            ID: {nodoSeleccionado.id}
          </p>
        </div>

        <button
          type="button"
          onClick={cerrarPanel}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulario según el tipo de nodo */}
      <div className="flex-1 overflow-y-auto p-4">
        {tipo === 'HECHO' && (
          <PanelPropiedadesHecho
            nodo={nodoSeleccionado}
            onGuardar={handleGuardar}
            loading={guardando}
          />
        )}

        {tipo === 'VARIABLE' && (
          <PanelPropiedadesVariable
            nodo={nodoSeleccionado}
            onGuardar={handleGuardar}
            loading={guardando}
          />
        )}

        {tipo === 'REGLA' && (
          <PanelPropiedadesRegla
            nodo={nodoSeleccionado}
            onGuardar={handleGuardar}
            loading={guardando}
          />
        )}

        {tipo === 'CONDICION' && (
          <PanelPropiedadesCondicion
            nodo={nodoSeleccionado}
            onGuardar={handleGuardar}
            loading={guardando}
          />
        )}

        {tipo === 'CONCLUSION' && (
          <PanelPropiedadesConclusion
            nodo={nodoSeleccionado}
            onGuardar={handleGuardar}
            loading={guardando}
          />
        )}
      </div>

      {/* Footer con acción de eliminar nodo */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-rose-600 hover:bg-rose-50 border border-rose-200"
          icon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => onEliminarNodo(nodoSeleccionado.id)}
        >
          Eliminar Nodo del Lienzo
        </Button>
      </div>
    </aside>
  );
};

export default PanelPropiedades;
