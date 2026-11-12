import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Database, Network, PlayCircle } from 'lucide-react';
import { Permisos, usePuede } from '@/config/permisos';
import { useActividadNavigate } from '@/hooks/useActividadNavigate';
import { Permiso } from '@/shared/components/Permiso';

import ErrorMessage from '@/components/feedback/ErrorMessage';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import {
  useBaseConocimiento,
  useHechos,
  useReglas,
  useVariables,
} from '@/features/base-conocimiento/hooks/useBaseConocimiento';
import { BarraVectorHechos } from '@/features/inferencia/components/BarraVectorHechos';
import { useSistemaExperto } from '@/features/sistemas-expertos/hooks/useSistemasExpertos';

import EditorLienzo from '../components/EditorLienzo';
import EditorModales from '../components/EditorModales';
import EditorToolbar from '../components/EditorToolbar';
import PanelOrdenReglas from '../components/PanelOrdenReglas';
import PanelPropiedades from '../components/PanelPropiedades';
import PanelWorkflowInferencia from '../components/PanelWorkflowInferencia';
import { useEditorAcciones } from '../hooks/useEditorAcciones';
import { useEditorMutations, useEditorVisual } from '../hooks/useEditorVisual';
import { useLienzoReactFlow } from '../hooks/useLienzoReactFlow';
import { useSimuladorWorkflowFWC } from '../hooks/useSimuladorWorkflowFWC';
import useEditorStore from '../store/editorStore';
import type { FlowEdge, FlowNode } from '../types/types';

// Constante inmutable a nivel de módulo para evitar re-renderizados innecesarios
const EMPTY_ARRAY: never[] = [];

export const EditorCanvasContent: React.FC<{ sistemaId: string }> = ({ sistemaId }) => {
  const navigate = useActividadNavigate();
  const puedeCrearNodos = usePuede(Permisos.EDITOR_NODOS_CREAR);
  const puedeEditarNodos = usePuede(Permisos.EDITOR_NODOS_EDITAR);
  const puedeEliminarNodos = usePuede(Permisos.EDITOR_NODOS_ELIMINAR);
  const puedeCrearConexiones = usePuede(Permisos.EDITOR_CONEXIONES_CREAR);
  const puedeEditarConexiones = usePuede(Permisos.EDITOR_CONEXIONES_EDITAR);
  const puedeEliminarConexiones = usePuede(Permisos.EDITOR_CONEXIONES_ELIMINAR);

  const { data: sistema } = useSistemaExperto(sistemaId);
  const {
    data: baseConocimiento,
    isLoading: isBaseLoading,
    isError: isBaseError,
    error: baseError,
    refetch: refetchBase,
  } = useBaseConocimiento(sistemaId);

  const effectiveBaseId = baseConocimiento?.id;

  const {
    data: fetchedHechos,
    isLoading: isHechosLoading,
    refetch: refetchHechos,
  } = useHechos(effectiveBaseId);

  const {
    data: fetchedVars,
    isLoading: isVarsLoading,
    refetch: refetchVariables,
  } = useVariables(effectiveBaseId);

  const {
    data: fetchedReglas,
    isLoading: isReglasLoading,
    refetch: refetchReglas,
  } = useReglas(effectiveBaseId);

  const hechos = useMemo(() => {
    return fetchedHechos ?? baseConocimiento?.hechos ?? EMPTY_ARRAY;
  }, [baseConocimiento?.hechos, fetchedHechos]);

  const variables = useMemo(() => {
    return fetchedVars ?? baseConocimiento?.variables ?? EMPTY_ARRAY;
  }, [baseConocimiento?.variables, fetchedVars]);

  const reglas = useMemo(() => {
    return fetchedReglas ?? baseConocimiento?.reglas ?? EMPTY_ARRAY;
  }, [baseConocimiento?.reglas, fetchedReglas]);

  const {
    data: editorVisualData,
    isLoading: isEditorVisualLoading,
    refetch: refetchEditorVisual,
  } = useEditorVisual(sistemaId);

  const nodosVisuales = useMemo(() => {
    return editorVisualData?.backendData?.nodos || EMPTY_ARRAY;
  }, [editorVisualData?.backendData?.nodos]);

  const isCargando =
    isBaseLoading ||
    isEditorVisualLoading ||
    (effectiveBaseId ? isHechosLoading || isVarsLoading || isReglasLoading : false);

  const { crearConexion } = useEditorMutations(sistemaId);
  const { fitView } = useReactFlow();
  const fitViewRef = useRef(fitView);
  fitViewRef.current = fitView;

  const {
    nodoSeleccionado,
    seleccionarNodo,
    cerrarPanel,
    actualizarDatosNodoSeleccionado,
  } = useEditorStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [guardando, setGuardando] = useState(false);

  const [modoEditor, setModoEditor] = useState<'DISENO' | 'SIMULACION'>('DISENO');
  const [modalReglaRapidaAbierto, setModalReglaRapidaAbierto] = useState(false);
  const [modalPseudocodigoAbierto, setModalPseudocodigoAbierto] = useState(false);
  const [mostrarPanelOrden, setMostrarPanelOrden] = useState(false);
  const [mostrarVectorHechos, setMostrarVectorHechos] = useState(true);

  const siguienteNumeroRegla = useMemo(() => {
    if (!reglas || reglas.length === 0) return 1;
    const numeros = reglas
      .map((r) => {
        const match = r.nombre?.match(/^R(\d+)$/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);
    if (numeros.length === 0) return reglas.length + 1;
    return Math.max(...numeros) + 1;
  }, [reglas]);

  // 1. Hook de Simulación FWC (Pasadas Pedagógicas, Metas y Expresiones Lógicas)
  const {
    vectorHechos,
    setVectorHechos,
    ejecutandoInferencia,
    estadosInferencia,
    pasosWorkflow,
    pasoActualWorkflowIndex,
    modoEjecucionWorkflow,
    setModoEjecucionWorkflow,
    conclusionFinalWorkflow,
    metasFWC,
    setMetasFWC,
    handleCambiarPasoWorkflow,
    handleReiniciarSimulacion,
    handleEjecutarInferenciaDirecta,
    handleIniciarSimulacionPasoAPaso,
  } = useSimuladorWorkflowFWC({
    sistemaId,
    hechos,
    variables,
    reglas,
    nodes,
    setNodes,
    fitViewRef,
  });

  // 2. Hook de Lienzo ReactFlow (Grafo, Posiciones, Conexiones y Sincronización)
  const {
    eliminando,
    sincronizando,
    guardandoPosicionesRef,
    onConnect,
    onReconnect,
    onEdgesDelete,
    onNodesDelete,
    onNodeClick,
    onPaneClick,
    handleSincronizarManual,
    handleGuardarPosiciones,
    handleSeleccionarRegla,
    handleReorganizarGrafo,
  } = useLienzoReactFlow({
    sistemaId,
    isCargando,
    hechos,
    variables,
    reglas,
    nodosVisuales,
    nodes,
    setNodes,
    edges,
    setEdges,
    estadosInferencia,
    puedeEditarNodos,
    puedeEliminarNodos,
    puedeCrearConexiones,
    puedeEditarConexiones,
    puedeEliminarConexiones,
    crearConexion,
    seleccionarNodo,
    cerrarPanel,
    refetchBase,
    refetchHechos,
    refetchVariables,
    refetchReglas,
    refetchEditorVisual,
    setGuardando,
    fitView,
    fitViewRef,
  });

  // 3. Hook de Acciones CRUD sobre Nodos y Reglas
  const {
    handleAgregarNodo,
    handleGuardarPropiedades,
    handleEliminarNodo,
    handleReglaRapidaCreada,
    handleActualizarPrioridad,
  } = useEditorAcciones({
    sistemaId,
    effectiveBaseId,
    reglas,
    nodes,
    setNodes,
    setEdges,
    nodoSeleccionado,
    seleccionarNodo,
    actualizarDatosNodoSeleccionado,
    puedeCrearNodos,
    puedeEditarNodos,
    setGuardando,
    onNodesDelete,
    refetchBase,
    refetchHechos,
    refetchVariables,
    refetchReglas,
    refetchEditorVisual,
    fitViewRef,
    setModalReglaRapidaAbierto,
  });

  if (isCargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400">
        <div className="p-8 bg-white rounded-xl shadow-xs border border-stone-200 flex flex-col items-center max-w-sm text-center space-y-4">
          <Spinner size="lg" className="text-teal-700" />
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Sincronizando con la Base de Conocimiento
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Cargando hechos, variables y reglas interconectadas en el lienzo...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isBaseError) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/sistemas/${sistemaId}`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sistemas
        </button>
        <ErrorMessage
          title="Error al cargar la Base de Conocimiento"
          message={
            baseError instanceof Error
              ? baseError.message
              : 'No se pudo cargar la base de conocimiento para diagramar el editor.'
          }
          onRetry={() => refetchBase()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3">
      {/* Barra superior de navegación y título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/sistemas/${sistemaId}`)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-white transition-colors cursor-pointer"
            title="Volver al detalle"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-teal-700" />
              Editor Visual — {sistema?.nombre || 'Sistema Experto'}
            </h2>
            <p className="text-[11px] text-stone-500">
              Sincronizado automáticamente con la Base de Conocimiento: Hechos, Variables, Condiciones y Reglas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Permiso permisos={[Permisos.BASE_CONOCIMIENTO_VER]}>
            <Button
              variant="outline"
              size="sm"
              icon={<Database className="w-3.5 h-3.5 text-amber-500" />}
              onClick={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
            >
              Base C.
            </Button>
          </Permiso>
          <Permiso permisos={[Permisos.INFERENCIA_EJECUTAR]}>
            <Button
              variant="outline"
              size="sm"
              icon={<PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => navigate(`/sistemas/${sistemaId}/inferencia`)}
            >
              Inferencia
            </Button>
          </Permiso>
        </div>
      </div>

      {/* Barra de herramientas y paneles superiores */}
      <div className="shrink-0 space-y-2">
        <EditorToolbar
          modoEditor={modoEditor}
          onChangeModoEditor={setModoEditor}
          onAgregarNodo={handleAgregarNodo}
          onGuardarPosiciones={handleGuardarPosiciones}
          onCentrarVista={() => fitView({ padding: 0.2 })}
          onSincronizar={handleSincronizarManual}
          onReorganizar={handleReorganizarGrafo}
          sincronizando={sincronizando}
          guardando={guardando || eliminando}
          onAbrirModalReglaRapida={() => setModalReglaRapidaAbierto(true)}
          onAbrirModalPseudocodigo={() => setModalPseudocodigoAbierto(true)}
          mostrarPanelOrden={mostrarPanelOrden}
          onTogglePanelOrden={() => setMostrarPanelOrden((prev) => !prev)}
          mostrarVectorHechos={mostrarVectorHechos}
          onToggleVectorHechos={() => setMostrarVectorHechos((prev) => !prev)}
        />

        {modoEditor === 'SIMULACION' && (
          <div className="space-y-2">
            {mostrarVectorHechos && (
              <BarraVectorHechos
                hechos={vectorHechos}
                onActualizarHechos={setVectorHechos}
                onEjecutarInferencia={handleEjecutarInferenciaDirecta}
                ejecutando={ejecutandoInferencia}
                sugerenciasVariables={variables.map((v) => v.nombre)}
                totalReglas={reglas.length}
              />
            )}

            <PanelWorkflowInferencia
              pasos={pasosWorkflow}
              pasoActualIndex={pasoActualWorkflowIndex}
              onCambiarPaso={handleCambiarPasoWorkflow}
              onEjecutarDirecto={handleEjecutarInferenciaDirecta}
              onIniciarPasoAPaso={handleIniciarSimulacionPasoAPaso}
              onReiniciar={handleReiniciarSimulacion}
              onEnfocarRegla={(rId) => handleSeleccionarRegla(rId)}
              ejecutando={ejecutandoInferencia}
              conclusionFinal={conclusionFinalWorkflow}
              modoEjecucion={modoEjecucionWorkflow}
              onCambiarModoEjecucion={setModoEjecucionWorkflow}
              metas={metasFWC}
              onMetasChange={setMetasFWC}
              variablesDisponibles={variables.map((v) => ({ id: String(v.id), nombre: v.nombre }))}
            />
          </div>
        )}

        {modoEditor === 'DISENO' && mostrarVectorHechos && (
          <BarraVectorHechos
            hechos={vectorHechos}
            onActualizarHechos={setVectorHechos}
            onEjecutarInferencia={handleEjecutarInferenciaDirecta}
            ejecutando={ejecutandoInferencia}
            sugerenciasVariables={variables.map((v) => v.nombre)}
            totalReglas={reglas.length}
          />
        )}
      </div>

      {/* Contenedor del Lienzo React Flow + Paneles Laterales */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner relative overflow-hidden flex">
        <PanelOrdenReglas
          reglas={reglas}
          isOpen={mostrarPanelOrden}
          onClose={() => setMostrarPanelOrden(false)}
          onSeleccionarRegla={handleSeleccionarRegla}
          onActualizarPrioridad={handleActualizarPrioridad}
        />

        <EditorLienzo
          nodes={nodes}
          edges={edges}
          isCargando={isCargando}
          sincronizando={sincronizando}
          puedeEditarNodos={puedeEditarNodos}
          puedeEliminarNodos={puedeEliminarNodos}
          puedeCrearConexiones={puedeCrearConexiones}
          puedeEditarConexiones={puedeEditarConexiones}
          puedeEliminarConexiones={puedeEliminarConexiones}
          guardandoPosicionesRef={guardandoPosicionesRef}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onAbrirModalReglaRapida={() => setModalReglaRapidaAbierto(true)}
          onIrABaseConocimiento={() => navigate(`/sistemas/${sistemaId}/base-conocimiento`)}
        />

        <PanelPropiedades
          onGuardarPropiedades={handleGuardarPropiedades}
          onEliminarNodo={handleEliminarNodo}
          guardando={guardando}
          variables={variables}
          hechos={hechos}
          reglas={reglas}
        />
      </div>

      {/* Modales de Regla Rápida y Pseudocódigo */}
      <EditorModales
        effectiveBaseId={effectiveBaseId}
        modalReglaRapidaAbierto={modalReglaRapidaAbierto}
        onCerrarModalReglaRapida={() => setModalReglaRapidaAbierto(false)}
        onReglaRapidaCreada={handleReglaRapidaCreada}
        siguienteNumeroRegla={siguienteNumeroRegla}
        modalPseudocodigoAbierto={modalPseudocodigoAbierto}
        onCerrarModalPseudocodigo={() => setModalPseudocodigoAbierto(false)}
        onReglasPseudocodigoActualizadas={async () => {
          await Promise.all([refetchReglas(), refetchVariables(), refetchHechos()]);
        }}
        reglas={reglas}
        variables={variables}
        hechos={hechos}
      />
    </div>
  );
};

export const EditorVisualPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorMessage message="Identificador del sistema experto no proporcionado en la ruta." />;
  }

  return (
    <ReactFlowProvider>
      <EditorCanvasContent sistemaId={id} />
    </ReactFlowProvider>
  );
};

export default EditorVisualPage;
