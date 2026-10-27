import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowNode, NodoVisualBackend } from '../types/types';
import type { Variable } from '@/features/base-conocimiento/types/types';

const mocks = vi.hoisted(() => ({
  variables: [] as Variable[],
  visuales: [] as NodoVisualBackend[],
  eliminarVariable: vi.fn(),
  crearNodo: vi.fn(),
  moverNodo: vi.fn(),
}));

vi.mock('@/config/permisos', () => ({
  Permisos: {},
  usePuede: () => true,
}));
vi.mock('@/shared/components/Permiso', () => ({
  Permiso: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'sistema' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/features/sistemas-expertos/hooks/useSistemasExpertos', () => ({
  useSistemaExperto: () => ({ data: { nombre: 'Prueba' } }),
}));
vi.mock('../nodes/nodeTypes', () => ({ default: {} }));
vi.mock('../edges/DraggableEdge', () => ({ default: () => null }));
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
    useReactFlow: () => ({ fitView: vi.fn() }),
    Controls: () => null,
    Background: () => null,
    ReactFlow: ({ nodes, onNodesDelete }: {
      nodes: FlowNode[];
      onNodesDelete: (nodes: FlowNode[]) => void;
    }) => <div>{nodes.map((node) => (
      <button key={node.id} onClick={() => onNodesDelete([node])}>
        Eliminar {node.data.nombre}
      </button>
    ))}</div>,
  };
});
vi.mock('../components/EditorToolbar', () => ({
  default: ({ onGuardarPosiciones, guardando }: {
    onGuardarPosiciones: () => void;
    guardando: boolean;
  }) => <button disabled={guardando} onClick={onGuardarPosiciones}>Guardar</button>,
}));
vi.mock('../components/PanelPropiedades', () => ({
  default: ({ onEliminarNodo }: { onEliminarNodo: (id: string) => void }) => (
    <button onClick={() => onEliminarNodo('variable_a')}>Eliminar desde panel</button>
  ),
}));
vi.mock('@/features/base-conocimiento/services/baseConocimientoService', () => ({
  default: {
    // Esta consulta representa la copia antigua incluida en la base completa.
    obtenerPorSistemaExperto: async () => ({
      id: 'base',
      variables: [{ id: 'a', nombre: 'A', tipo: 'TEXTO' }],
      hechos: [],
      reglas: [],
    }),
    listarHechos: async () => [],
    listarVariables: async () => [...mocks.variables],
    listarReglas: async () => [],
    eliminarVariable: mocks.eliminarVariable,
  },
}));
vi.mock('../services/editorVisualService', () => ({
  default: {
    obtenerEditor: async () => ({ nodos: [...mocks.visuales], conexiones: [] }),
    eliminarNodo: async (id: string) => {
      mocks.visuales = mocks.visuales.filter((n) => n.id !== id);
    },
    crearNodo: mocks.crearNodo,
    moverNodo: mocks.moverNodo,
  },
}));

import EditorVisualPage from '../pages/EditorVisualPage';

const renderEditor = () => render(
  <QueryClientProvider client={new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })}>
    <EditorVisualPage />
  </QueryClientProvider>
);

describe('Editor visual: eliminar y guardar variables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.variables = [
      { id: 'a', nombre: 'A', tipo: 'TEXTO' },
      { id: 'b', nombre: 'B', tipo: 'TEXTO' },
    ];
    mocks.visuales = mocks.variables.map((v) => ({
      id: `visual_${v.id}`,
      tipo: 'VARIABLE',
      referencia_id: String(v.id),
      posicion_x: 60,
      posicion_y: 60,
    }));
    mocks.eliminarVariable.mockImplementation(async (id: string) => {
      mocks.variables = mocks.variables.filter((v) => v.id !== id);
    });
    mocks.crearNodo.mockImplementation(async (_sistema, datos) => {
      const nodo = { ...datos, id: `visual_${datos.referencia_id}` };
      mocks.visuales.push(nodo);
      return nodo;
    });
    mocks.moverNodo.mockResolvedValue(undefined);
  });

  it('usa las variables actualizadas y guarda sin recrear la variable eliminada', async () => {
    renderEditor();
    await screen.findByRole('button', { name: 'Eliminar B' });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar A' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Eliminar A' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.moverNodo).toHaveBeenCalledWith('visual_b', expect.anything()));
    expect(mocks.crearNodo).not.toHaveBeenCalled();
  });

  it('permite eliminar la última variable desde el panel sin recuperarla de la copia antigua', async () => {
    mocks.variables = [mocks.variables[0]];
    mocks.visuales = [mocks.visuales[0]];
    renderEditor();
    await screen.findByRole('button', { name: 'Eliminar A' });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar desde panel' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Eliminar A' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
    expect(mocks.crearNodo).not.toHaveBeenCalled();
    expect(mocks.moverNodo).not.toHaveBeenCalled();
  });

  it('bloquea guardar mientras se elimina y conserva los IDs visuales tras sincronizar', async () => {
    mocks.visuales = [];
    let terminarBorrado!: () => void;
    mocks.eliminarVariable.mockImplementation(() => new Promise<void>((resolve) => {
      terminarBorrado = () => {
        mocks.variables = mocks.variables.filter((v) => v.id !== 'a');
        resolve();
      };
    }));
    renderEditor();
    await screen.findByRole('button', { name: 'Eliminar B' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
    expect(mocks.crearNodo).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar A' }));
    await waitFor(() => expect(mocks.eliminarVariable).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(mocks.crearNodo).toHaveBeenCalledTimes(2);
    await act(async () => terminarBorrado());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.moverNodo).toHaveBeenCalledWith('visual_b', expect.anything()));
    expect(mocks.crearNodo).toHaveBeenCalledTimes(2);
  });
});
