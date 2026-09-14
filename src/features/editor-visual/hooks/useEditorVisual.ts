import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import editorVisualService from '../services/editorVisualService';
import type {
  FlowNode,
  FlowEdge,
  NodoVisualBackend,
  ConexionVisualBackend,
  CrearNodoDTO,
  ActualizarNodoDTO,
  CrearConexionDTO,
} from '../types/types';

export const EDITOR_QUERY_KEY = 'editor-visual';

export const transformBackendToFlow = (
  nodosBackend: NodoVisualBackend[],
  conexionesBackend: ConexionVisualBackend[]
): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  const nodes: FlowNode[] = nodosBackend.map((n) => ({
    id: String(n.id),
    type: n.tipo,
    position: {
      x: n.posicion_x ?? 100,
      y: n.posicion_y ?? 100,
    },
    data: {
      ...n.datos,
      nombre: n.datos.nombre || `${n.tipo}_${n.id}`,
    },
  }));

  const edges: FlowEdge[] = conexionesBackend.map((c) => ({
    id: String(c.id),
    source: String(c.nodo_origen),
    target: String(c.nodo_destino),
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
  }));

  return { nodes, edges };
};

export const useEditorVisual = (sistemaId: number | string | undefined) => {
  return useQuery({
    queryKey: [EDITOR_QUERY_KEY, sistemaId],
    queryFn: async () => {
      if (!sistemaId) throw new Error('ID de sistema experto requerido');
      const data = await editorVisualService.obtenerEditor(sistemaId);
      return {
        backendData: data,
        flowData: transformBackendToFlow(data.nodos, data.conexiones),
      };
    },
    enabled: Boolean(sistemaId),
  });
};

export const useEditorMutations = (sistemaId: number | string | undefined) => {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: [EDITOR_QUERY_KEY, sistemaId] });
  };

  const crearNodo = useMutation({
    mutationFn: (datos: CrearNodoDTO) => {
      if (!sistemaId) throw new Error('ID no disponible');
      return editorVisualService.crearNodo(sistemaId, datos);
    },
    onSuccess: invalidar,
  });

  const actualizarNodo = useMutation({
    mutationFn: ({ id, datos }: { id: number | string; datos: ActualizarNodoDTO }) =>
      editorVisualService.actualizarNodo(id, datos),
    onSuccess: invalidar,
  });

  const eliminarNodo = useMutation({
    mutationFn: (id: number | string) => editorVisualService.eliminarNodo(id),
    onSuccess: invalidar,
  });

  const crearConexion = useMutation({
    mutationFn: (datos: CrearConexionDTO) => {
      if (!sistemaId) throw new Error('ID no disponible');
      return editorVisualService.crearConexion(sistemaId, datos);
    },
    onSuccess: invalidar,
  });

  const eliminarConexion = useMutation({
    mutationFn: (id: number | string) => editorVisualService.eliminarConexion(id),
    onSuccess: invalidar,
  });

  return {
    crearNodo,
    actualizarNodo,
    eliminarNodo,
    crearConexion,
    eliminarConexion,
  };
};
