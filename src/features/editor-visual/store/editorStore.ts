import { create } from 'zustand';
import type { FlowNode, NodoDatosGenerales } from '../types/types';

export interface EditorState {
  nodoSeleccionado: FlowNode | null;
  panelAbierto: boolean;
  modoEdicion: boolean;
  seleccionarNodo: (nodo: FlowNode | null) => void;
  actualizarDatosNodoSeleccionado: (nuevosDatos: Partial<NodoDatosGenerales>) => void;
  cerrarPanel: () => void;
  toggleModoEdicion: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  nodoSeleccionado: null,
  panelAbierto: false,
  modoEdicion: true,

  seleccionarNodo: (nodo) => {
    set({
      nodoSeleccionado: nodo,
      panelAbierto: Boolean(nodo),
    });
  },

  actualizarDatosNodoSeleccionado: (nuevosDatos) => {
    set((state) => {
      if (!state.nodoSeleccionado) return state;
      return {
        nodoSeleccionado: {
          ...state.nodoSeleccionado,
          data: {
            ...state.nodoSeleccionado.data,
            ...nuevosDatos,
          },
        },
      };
    });
  },

  cerrarPanel: () => {
    set({
      nodoSeleccionado: null,
      panelAbierto: false,
    });
  },

  toggleModoEdicion: () => {
    set((state) => ({ modoEdicion: !state.modoEdicion }));
  },
}));

export default useEditorStore;
