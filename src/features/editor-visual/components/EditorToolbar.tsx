import {
  FileText,
  Variable as VariableIcon,
  GitBranch,
  Workflow,
  CheckCircle,
  Save,
  Maximize2,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { TipoNodo } from '../types/types';

export interface EditorToolbarProps {
  onAgregarNodo: (tipo: TipoNodo) => void;
  onGuardarPosiciones: () => void;
  onCentrarVista: () => void;
  onSincronizar?: () => void;
  onReorganizar?: () => void;
  sincronizando?: boolean;
  guardando?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onAgregarNodo,
  onGuardarPosiciones,
  onCentrarVista,
  onSincronizar,
  onReorganizar,
  sincronizando = false,
  guardando = false,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-2.5 shadow-md flex flex-wrap items-center justify-between gap-3">
      {/* Botones para agregar nodos */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1.5 hidden sm:inline">
          Agregar:
        </span>

        <button
          type="button"
          onClick={() => onAgregarNodo('HECHO')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer border border-emerald-200/80"
          title="Agregar nodo de Hecho"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          Hecho
        </button>

        <button
          type="button"
          onClick={() => onAgregarNodo('VARIABLE')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition-colors cursor-pointer border border-sky-200/80"
          title="Agregar nodo de Variable"
        >
          <VariableIcon className="w-3.5 h-3.5 text-sky-600" />
          Variable
        </button>

        <button
          type="button"
          onClick={() => onAgregarNodo('CONDICION')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors cursor-pointer border border-amber-200/80"
          title="Agregar nodo de Condición (IF)"
        >
          <GitBranch className="w-3.5 h-3.5 text-amber-600" />
          Condición
        </button>

        <button
          type="button"
          onClick={() => onAgregarNodo('REGLA')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200/80"
          title="Agregar nodo de Regla"
        >
          <Workflow className="w-3.5 h-3.5 text-indigo-600" />
          Regla
        </button>

        <button
          type="button"
          onClick={() => onAgregarNodo('CONCLUSION')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors cursor-pointer border border-purple-200/80"
          title="Agregar nodo de Conclusión (THEN)"
        >
          <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
          Conclusión
        </button>
      </div>

      {/* Botones de acción del lienzo */}
      <div className="flex items-center gap-2">
        {onSincronizar && (
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${sincronizando ? 'animate-spin' : ''}`} />}
            onClick={onSincronizar}
            loading={sincronizando}
            title="Recargar y sincronizar con la Base de Conocimiento"
            className="border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 font-semibold"
          >
            Sincronizar
          </Button>
        )}

        {onReorganizar && (
          <Button
            variant="outline"
            size="sm"
            icon={<LayoutGrid className="w-3.5 h-3.5 text-slate-600" />}
            onClick={onReorganizar}
            title="Reordenar automáticamente el grafo en jerarquía Regla -> IF -> Condición -> THEN -> Conclusión"
          >
            Reorganizar
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          icon={<Maximize2 className="w-3.5 h-3.5" />}
          onClick={onCentrarVista}
          title="Centrar vista del diagrama"
        >
          Centrar
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Save className="w-3.5 h-3.5" />}
          onClick={onGuardarPosiciones}
          loading={guardando}
          title="Guardar posiciones del diagrama"
        >
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
