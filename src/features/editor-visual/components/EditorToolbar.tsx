import { Permisos } from '@/config/permisos';
import { Permiso } from '@/shared/components/Permiso';
import {
  Save,
  Maximize2,
  RefreshCw,
  LayoutGrid,
  Zap,
  ListOrdered,
  Layers,
  Play,
  Workflow,
  Code2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { TipoNodo } from '../types/types';

export type ModoEditorVisual = 'DISENO' | 'SIMULACION';

export interface EditorToolbarProps {
  modoEditor?: ModoEditorVisual;
  onChangeModoEditor?: (modo: ModoEditorVisual) => void;
  onAgregarNodo?: (tipo: TipoNodo) => void;
  onGuardarPosiciones: () => void;
  onCentrarVista: () => void;
  onSincronizar?: () => void;
  onReorganizar?: () => void;
  sincronizando?: boolean;
  guardando?: boolean;
  onAbrirModalReglaRapida?: () => void;
  onAbrirModalPseudocodigo?: () => void;
  mostrarPanelOrden?: boolean;
  onTogglePanelOrden?: () => void;
  mostrarVectorHechos?: boolean;
  onToggleVectorHechos?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  modoEditor = 'DISENO',
  onChangeModoEditor,
  onGuardarPosiciones,
  onCentrarVista,
  onSincronizar,
  onReorganizar,
  sincronizando = false,
  guardando = false,
  onAbrirModalReglaRapida,
  onAbrirModalPseudocodigo,
  mostrarPanelOrden = false,
  onTogglePanelOrden,
  mostrarVectorHechos = false,
  onToggleVectorHechos,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
      {/* Selector de Modo y Botones Principales de Creación */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Selector de Modo: Diseño vs Simulación */}
        {onChangeModoEditor && (
          <div className="flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeModoEditor('DISENO')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                modoEditor === 'DISENO'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Modo Edición: crear y diseñar reglas y hechos"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-700" />
              Modo Diseño
            </button>

            <button
              type="button"
              onClick={() => onChangeModoEditor('SIMULACION')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                modoEditor === 'SIMULACION'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Modo Simulación: ejecutar inferencia FWC directo o paso a paso"
            >
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Simulación FWC
            </button>
          </div>
        )}

        {/* Botones de creación limpios (Regla Rápida y Pseudocódigo) */}
        {modoEditor === 'DISENO' ? (
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            {onAbrirModalReglaRapida && (
              <Permiso permisos={[Permisos.EDITOR_NODOS_CREAR]}>
                <button
                  type="button"
                  onClick={onAbrirModalReglaRapida}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Crear regla completa con premisas (IF) y conclusiones (THEN) en un solo paso"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  + Regla
                </button>
              </Permiso>
            )}

            {onAbrirModalPseudocodigo && (
              <Permiso permisos={[Permisos.EDITOR_NODOS_CREAR]}>
                <button
                  type="button"
                  onClick={onAbrirModalPseudocodigo}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-bold transition-all shadow-2xs cursor-pointer font-mono"
                  title="Escribir o editar reglas en pseudocódigo / DSL con compilación instantánea al lienzo"
                >
                  <Code2 className="w-3.5 h-3.5 text-teal-400" />
                  ⟨/⟩ Pseudocódigo
                </button>
              </Permiso>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Workflow className="w-3.5 h-3.5 text-indigo-600" />
            <span>Workflow de Inferencia Forward Chaining</span>
          </div>
        )}
      </div>

      {/* Vistas auxiliares: Orden BC y Vector BH */}
      <div className="flex items-center gap-1.5">
        {onTogglePanelOrden && (
          <button
            type="button"
            onClick={onTogglePanelOrden}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
              mostrarPanelOrden
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-inner'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Mostrar panel de orden de evaluación de reglas (#1, #2...)"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
            Orden BC
          </button>
        )}

        {onToggleVectorHechos && (
          <button
            type="button"
            onClick={onToggleVectorHechos}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
              mostrarVectorHechos
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-inner'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Mostrar barra de gestión del vector inicial de hechos (BH0)"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Vector BH
          </button>
        )}
      </div>

      {/* Botones de acción del lienzo */}
      <div className="flex items-center gap-1.5">
        {onSincronizar && (
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${sincronizando ? 'animate-spin' : ''}`} />}
            onClick={onSincronizar}
            loading={sincronizando}
            title="Recargar y sincronizar con la Base de Conocimiento"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold"
          >
            Sincronizar
          </Button>
        )}

        {modoEditor === 'DISENO' && onReorganizar && (
          <Permiso permisos={[Permisos.EDITOR_NODOS_EDITAR]}><Button
            variant="outline"
            size="sm"
            icon={<LayoutGrid className="w-3.5 h-3.5 text-slate-600" />}
            onClick={onReorganizar}
            title="Reordenar automáticamente el grafo en jerarquía Regla -> IF -> Condición -> THEN -> Conclusión"
          >
            Reorganizar
          </Button></Permiso>
        )}

        <Button
          variant="outline"
          size="sm"
          icon={<Maximize2 className="w-3.5 h-3.5 text-slate-600" />}
          onClick={onCentrarVista}
          title="Centrar vista del diagrama"
        >
          Centrar
        </Button>

        {modoEditor === 'DISENO' && (
          <Permiso permisos={[Permisos.EDITOR_NODOS_EDITAR]}><Button
            variant="primary"
            size="sm"
            icon={<Save className="w-3.5 h-3.5" />}
            onClick={onGuardarPosiciones}
            loading={guardando}
            title="Guardar posiciones del diagrama"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
          >
            Guardar Cambios
          </Button></Permiso>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
