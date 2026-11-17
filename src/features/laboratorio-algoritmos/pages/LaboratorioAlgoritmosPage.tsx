import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Share2,
  FileCheck,
  Plus,
  Copy,
  Lock,
  GitFork,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { useEjecucionLaboratorio } from '../hooks/useEjecucionLaboratorio';
import { laboratorioService } from '../services/laboratorioService';
import { EditorAlgoritmo } from '../components/EditorAlgoritmo';
import { CodigoEjecucion } from '../components/CodigoEjecucion';
import { ControlesEjecucion } from '../components/ControlesEjecucion';
import { PanelInspectorMemoria } from '../components/PanelInspectorMemoria';
import { SelectorAlgoritmoPopover } from '../components/SelectorAlgoritmoPopover';
import { BarraEstadoLaboratorio } from '../components/BarraEstadoLaboratorio';
import { PreguntaLaboratorioModal } from '../components/PreguntaLaboratorioModal';
import { AyudaLenguajeModal } from '../components/AyudaLenguajeModal';
import { ConfiguracionEjecucionModal } from '../components/ConfiguracionEjecucionModal';
import { ModalGuardarAlgoritmo } from '../components/ModalGuardarAlgoritmo';
import { ModalCompartirAlgoritmo } from '../components/ModalCompartirAlgoritmo';
import { ModalEntregarAlgoritmo } from '../components/ModalEntregarAlgoritmo';
import type {
  ComparticionPrograma,
  PlantillaAlgoritmo,
  ProgramaAlgoritmo,
} from '../types/contracts';

const CODIGO_INICIAL_DEFAULT = `// Procedimiento para una pasada de inferencia sobre el conjunto de reglas R
void FWCPasada(Regla[] R, BaseHechos BH) {
    for (int i = 0; i < R.length; i++) {
        if (!marcada(R[i])) {
            Hecho C = Disparar(R[i], BH);
            if (C != null) {
                BH.add(C);
                Marcar(R[i]);
            }
        }
    }
}

// Algoritmo principal de Encadenamiento hacia Adelante (FWC)
void FWC(Regla[] R, BaseHechos BH) {
    DesmarcarReglas(R);
    int pasada = 0;
    while (true) {
        pasada++;
        RegistrarPasada(pasada);
        int cantidadAntes = BH.length();
        FWCPasada(R, BH);
        // Condición de parada canónica: si BH no creció en esta pasada, termina
        if (cantidadAntes == BH.length()) {
            break;
        }
    }
    MostrarLosHechosDisparados(BH);
}
`;

export const LaboratorioAlgoritmosPage: React.FC = () => {
  const { id: sistemaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const esDocente = user?.roles?.some((r) => r.toLowerCase().includes('docente')) || false;
  const esEstudiante = user?.roles?.some((r) => r.toLowerCase().includes('estudiante')) || false;

  // Catálogos de programas y plantillas
  const [plantillas, setPlantillas] = useState<PlantillaAlgoritmo[]>([]);
  const [programasPropios, setProgramasPropios] = useState<ProgramaAlgoritmo[]>([]);
  const [programasCompartidos, setProgramasCompartidos] = useState<ComparticionPrograma[]>([]);

  // Estado del programa activo
  const [programaActivo, setProgramaActivo] = useState<ProgramaAlgoritmo | null>(null);
  const [valorSelector, setValorSelector] = useState<string>('');

  // Modales
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false);
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [modalGuardarAbierto, setModalGuardarAbierto] = useState(false);
  const [modalCompartirAbierto, setModalCompartirAbierto] = useState(false);
  const [modalEntregarAbierto, setModalEntregarAbierto] = useState(false);

  // Estados de carga y feedback
  const [guardando, setGuardando] = useState(false);
  const [clonando, setClonando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Hook principal de simulación
  const {
    codigo,
    setCodigo,
    corrida,
    cargando,
    erroresCompilacion,
    estadoActual,
    enEjecucionAutomatica,
    velocidadMs,
    setVelocidadMs,
    lineaActiva,
    columnaActiva,
    preguntaPendiente,
    frameActual,
    baseHechosRuntime,
    pilaHNRuntime,
    colaQRuntime,
    listaMetasRuntime,
    salidasTexto,
    marcasReglas,
    validarCodigo,
    iniciarSimulacion,
    avanzarPaso,
    responderPregunta,
    iniciarAutoPlay,
    pausarAutoPlay,
    reiniciar,
  } = useEjecucionLaboratorio({
    sistemaExpertoId: sistemaId,
    codigoInicial: CODIGO_INICIAL_DEFAULT,
  });

  // Navegación segura al pulsar Volver
  const handleVolver = () => {
    if (sistemaId) {
      navigate(`/sistemas/${sistemaId}`);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/sistemas');
    }
  };

  // Cargar plantillas y programas
  const cargarProgramas = useCallback(async () => {
    try {
      const [listaPropios, listaCompartidos] = await Promise.all([
        laboratorioService.listarProgramas(sistemaId),
        laboratorioService.listarProgramasCompartidos(sistemaId),
      ]);
      setProgramasPropios(listaPropios);
      setProgramasCompartidos(listaCompartidos);
    } catch (err) {
      console.error('Error al cargar programas guardados o compartidos:', err);
    }
  }, [sistemaId]);

  useEffect(() => {
    laboratorioService
      .obtenerPlantillas()
      .then((data) => setPlantillas(data))
      .catch((err) => console.error('Error al cargar plantillas:', err));

    void cargarProgramas();
  }, [cargarProgramas]);

  const handleValidar = async () => {
    const esValido = await validarCodigo();
    if (esValido) {
      setMensajeExito('¡Código validado con éxito! Sintaxis y tipos correctos.');
      setTimeout(() => setMensajeExito(null), 3500);
    }
  };

  // Crear nuevo espacio de código en blanco
  const handleNuevoAlgoritmo = () => {
    if (
      corrida &&
      !window.confirm('¿Desea iniciar un nuevo algoritmo? Se reiniciará la simulación actual.')
    ) {
      return;
    }
    reiniciar();
    setCodigo(CODIGO_INICIAL_DEFAULT);
    setProgramaActivo(null);
    setValorSelector('');
    setMensajeExito('Nuevo espacio de trabajo iniciado. Listo para programar.');
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const handleSeleccionarEnCombo = (claveCompuesta: string) => {
    if (!claveCompuesta) return;
    const [tipo, id] = claveCompuesta.split(':');

    if (
      corrida &&
      !window.confirm('¿Desea cambiar de algoritmo? Se reiniciará la simulación actual.')
    ) {
      return;
    }

    reiniciar();
    setValorSelector(claveCompuesta);

    if (tipo === 'plantilla') {
      const p = plantillas.find((item) => item.id === id);
      if (p) {
        setCodigo(p.codigo);
        setProgramaActivo(null);
      }
    } else if (tipo === 'propio') {
      const prog = programasPropios.find((item) => item.id === id);
      if (prog) {
        setCodigo(prog.codigo_fuente);
        setProgramaActivo(prog);
      }
    } else if (tipo === 'compartido') {
      const comp = programasCompartidos.find((item) => item.id === id);
      if (comp) {
        setCodigo(comp.codigo_fuente);
        setProgramaActivo({
          id: comp.programa,
          titulo: comp.programa_titulo,
          descripcion: comp.programa_descripcion,
          codigo_fuente: comp.codigo_fuente,
          owner: comp.docente,
          owner_nombre: comp.docente_nombre,
          version_entero: 1,
          es_publico: false,
          es_propio: false,
          modo_acceso: comp.modo_acceso,
          creado_en: comp.fecha_compartido,
          actualizado_en: comp.fecha_compartido,
        });
      }
    }
  };

  const handleGuardarDesdeModal = async ({
    titulo,
    descripcion,
    comoNuevo,
  }: {
    titulo: string;
    descripcion: string;
    comoNuevo?: boolean;
  }) => {
    try {
      setGuardando(true);
      let guardado: ProgramaAlgoritmo;
      if (!comoNuevo && programaActivo?.id && programaActivo.es_propio !== false) {
        guardado = await laboratorioService.actualizarPrograma(programaActivo.id, {
          titulo,
          descripcion,
          codigo_fuente: codigo,
        });
        setMensajeExito(`¡Versión v${guardado.version_entero} guardada con éxito!`);
      } else {
        guardado = await laboratorioService.guardarPrograma({
          titulo,
          descripcion,
          codigo_fuente: codigo,
          sistema_experto: sistemaId,
        });
        setMensajeExito('¡Algoritmo guardado en BD con éxito!');
      }
      setProgramaActivo(guardado);
      setValorSelector(`propio:${guardado.id}`);
      await cargarProgramas();
      setTimeout(() => setMensajeExito(null), 3500);
    } finally {
      setGuardando(false);
    }
  };

  const handleForkPrograma = async () => {
    if (!programaActivo) return;
    try {
      setClonando(true);
      const copia = await laboratorioService.forkPrograma(
        programaActivo.id,
        `Mi Copia de ${programaActivo.titulo}`
      );
      setProgramaActivo(copia);
      setValorSelector(`propio:${copia.id}`);
      await cargarProgramas();
      setMensajeExito('¡Copia creada! Ahora puedes editar y guardar tu propia versión.');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      alert(`Error al clonar el algoritmo: ${err?.response?.data?.message || err?.message || String(err)}`);
    } finally {
      setClonando(false);
    }
  };

  const handleEliminarPrograma = async (id: string, titulo: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el algoritmo "${titulo}"?`)) {
      return;
    }
    try {
      await laboratorioService.eliminarPrograma(id);
      if (programaActivo?.id === id) {
        handleNuevoAlgoritmo();
      }
      await cargarProgramas();
      setMensajeExito(`Algoritmo "${titulo}" eliminado.`);
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err: any) {
      alert(`Error al eliminar: ${err?.message || String(err)}`);
    }
  };

  const esModoSoloLectura =
    programaActivo !== null &&
    programaActivo.es_propio === false &&
    programaActivo.modo_acceso === 'LECTURA';

  const esProgramaCompartido = programaActivo !== null && programaActivo.es_propio === false;
  const estaEnSimulacion = corrida !== null;

  const totalHechos = baseHechosRuntime ? Object.keys(baseHechosRuntime.hechos).length : 0;
  const snapshotBC = corrida ? (corrida as any).snapshot_bc : null;
  const totalReglas = snapshotBC?.reglas?.length || 0;
  const reglasMarcadas = marcasReglas.length;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Barra Superior Unificada Anti-Slop */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleVolver}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            title="Volver al Sistema Experto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Laboratorio de Algoritmos
              </h1>
              <p className="text-[10px] text-slate-400">
                Simulación y control paso a paso en memoria (Java SE-1)
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de Algoritmo: Selector Popover, Nuevo, Guardar, Compartir y Entrega */}
        <div className="flex items-center gap-2.5">
          {mensajeExito && (
            <span className="hidden lg:flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800 animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {mensajeExito}
            </span>
          )}

          {/* Badge y Botón de Fork si está viendo un programa compartido */}
          {esProgramaCompartido && (
            <div className="flex items-center gap-1.5">
              <span
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  esModoSoloLectura
                    ? 'border-amber-800 bg-amber-950/60 text-amber-300'
                    : 'border-cyan-800 bg-cyan-950/60 text-cyan-300'
                }`}
              >
                {esModoSoloLectura ? <Lock className="h-3 w-3" /> : <GitFork className="h-3 w-3" />}
                {esModoSoloLectura ? 'Solo Lectura (Docente)' : 'Copia Editable'}
              </span>

              <button
                onClick={handleForkPrograma}
                disabled={clonando}
                title="Crea una copia privada en tus algoritmos para editar libremente"
                className="flex items-center gap-1 rounded-lg border border-indigo-700 bg-indigo-950/50 hover:bg-indigo-900/70 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 transition disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5 text-indigo-400" />
                <span>{clonando ? 'Clonando...' : 'Clonar a Mis Algoritmos'}</span>
              </button>
            </div>
          )}

          {/* Selector Popover con Buscador */}
          <SelectorAlgoritmoPopover
            plantillas={plantillas}
            programasPropios={programasPropios}
            programasCompartidos={programasCompartidos}
            programaActivo={programaActivo}
            valorSeleccionado={valorSelector}
            onSeleccionar={handleSeleccionarEnCombo}
            onNuevo={handleNuevoAlgoritmo}
            onEliminarPrograma={handleEliminarPrograma}
          />

          {/* Botón "+ Nuevo" */}
          <button
            onClick={handleNuevoAlgoritmo}
            title="Crear un nuevo algoritmo en blanco"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>

          {/* Botón Guardar (Acción Primaria Anti-Slop con color consistente) */}
          <button
            onClick={() => setModalGuardarAbierto(true)}
            disabled={guardando || esModoSoloLectura}
            title={
              esModoSoloLectura
                ? 'El algoritmo está en modo Solo Lectura. Utiliza "Clonar a Mis Algoritmos" para editarlo.'
                : 'Guardar algoritmo en base de datos'
            }
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Guardar</span>
          </button>

          {/* Botón Compartir (visible para docentes con algoritmo propio guardado) */}
          {esDocente && (
            <button
              onClick={() => setModalCompartirAbierto(true)}
              disabled={!programaActivo || programaActivo.es_propio === false}
              title={
                !programaActivo || programaActivo.es_propio === false
                  ? 'Guarda primero tu algoritmo para poder compartirlo con un curso'
                  : 'Compartir este algoritmo con tus estudiantes'
              }
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Share2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Compartir</span>
            </button>
          )}

          {/* Botón Entregar Tarea (visible para estudiantes) */}
          {esEstudiante && (
            <button
              onClick={() => setModalEntregarAbierto(true)}
              disabled={!programaActivo || programaActivo.es_propio === false}
              title={
                !programaActivo || programaActivo.es_propio === false
                  ? 'Guarda primero tu algoritmo en "Mis Algoritmos" para poder entregarlo'
                  : 'Presentar este algoritmo en una tarea asignada'
              }
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Entregar</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Banner informativo si está en Modo Solo Lectura */}
      {esModoSoloLectura && (
        <div className="flex items-center justify-between border-b border-amber-900/60 bg-amber-950/40 px-4 py-1.5 text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Solo Lectura:</strong> Este algoritmo fue compartido por el docente{' '}
              {programaActivo?.owner_nombre}. Para realizar cambios, debes clonarlo.
            </span>
          </div>
          <button
            onClick={handleForkPrograma}
            disabled={clonando}
            className="flex items-center gap-1 rounded bg-amber-600/80 hover:bg-amber-600 px-2 py-0.5 text-[11px] font-semibold text-white transition"
          >
            <GitFork className="h-3 w-3" />
            <span>Clonar mi propia versión</span>
          </button>
        </div>
      )}

      {/* 3. Banner de Alerta de Errores si existen */}
      {erroresCompilacion.length > 0 && (
        <div className="flex items-center gap-2 border-b border-rose-900 bg-rose-950/80 px-4 py-2 text-xs text-rose-300 shrink-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <div className="truncate">
            <span className="font-bold">Error en compilación:</span>{' '}
            {erroresCompilacion.map((e, idx) => (
              <span key={idx} className="mr-3">
                {e.mensaje}{' '}
                {e.linea ? `(Línea ${e.linea}:${e.columna || 1})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Panel Principal Dividido (Split Screen con Alta Densidad) */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        {/* Columna Izquierda: Controles y Editor / Visor de Ejecución */}
        <div className="flex flex-1 flex-col overflow-hidden gap-3">
          <ControlesEjecucion
            estado={estadoActual}
            enEjecucionAutomatica={enEjecucionAutomatica}
            velocidadMs={velocidadMs}
            onCambiarVelocidad={setVelocidadMs}
            onValidar={handleValidar}
            onIniciar={() => iniciarSimulacion()}
            onPasoLinea={() => avanzarPaso('LINE_STEP')}
            onPlay={iniciarAutoPlay}
            onPausa={pausarAutoPlay}
            onReiniciar={reiniciar}
            onAbrirConfiguracion={() => setModalConfigAbierto(true)}
            onAbrirAyuda={() => setModalAyudaAbierto(true)}
            cargando={cargando}
          />

          <div className="flex-1 overflow-hidden">
            {estaEnSimulacion ? (
              <CodigoEjecucion
                codigo={codigo}
                lineaActiva={lineaActiva}
                columnaActiva={columnaActiva}
                salidasTexto={salidasTexto}
              />
            ) : (
              <EditorAlgoritmo
                codigo={codigo}
                onChange={setCodigo}
                errores={erroresCompilacion}
                readOnly={esModoSoloLectura}
              />
            )}
          </div>
        </div>

        {/* Columna Derecha: Inspector de Memoria Organizado en Pestañas */}
        <div className="flex w-96 flex-col overflow-hidden">
          <PanelInspectorMemoria
            frame={frameActual}
            baseHechos={baseHechosRuntime}
            snapshotReglas={snapshotBC}
            marcasReglas={marcasReglas}
            pilaHN={pilaHNRuntime}
            colaQ={colaQRuntime}
            listaMetas={listaMetasRuntime}
          />
        </div>
      </div>

      {/* 5. Barra de Estado Inferior Tipo IDE */}
      <BarraEstadoLaboratorio
        lineaActiva={lineaActiva}
        columnaActiva={columnaActiva}
        estadoVM={estadoActual}
        totalPasos={corrida?.total_pasos || 0}
        totalHechos={totalHechos}
        reglasMarcadas={reglasMarcadas}
        totalReglas={totalReglas}
        programaActivo={programaActivo}
        salidasCount={salidasTexto.length}
      />

      {/* 6. Modales Interactivos */}
      <PreguntaLaboratorioModal
        pregunta={preguntaPendiente}
        onResponder={(val) => responderPregunta(val, false)}
        onCancelar={() => responderPregunta('', true)}
      />

      <AyudaLenguajeModal
        abierto={modalAyudaAbierto}
        onCerrar={() => setModalAyudaAbierto(false)}
      />

      <ConfiguracionEjecucionModal
        abierto={modalConfigAbierto}
        onCerrar={() => setModalConfigAbierto(false)}
        snapshot={snapshotBC}
        onGuardarConfig={(config) => iniciarSimulacion(config)}
      />

      <ModalGuardarAlgoritmo
        abierto={modalGuardarAbierto}
        onCerrar={() => setModalGuardarAbierto(false)}
        onGuardar={handleGuardarDesdeModal}
        programaActual={programaActivo}
        guardando={guardando}
      />

      <ModalCompartirAlgoritmo
        abierto={modalCompartirAbierto}
        onCerrar={() => setModalCompartirAbierto(false)}
        programa={programaActivo}
        onCompartidoExitoso={() => {
          setMensajeExito('¡Algoritmo compartido exitosamente al curso!');
          setTimeout(() => setMensajeExito(null), 3500);
        }}
      />

      <ModalEntregarAlgoritmo
        abierto={modalEntregarAbierto}
        onCerrar={() => setModalEntregarAbierto(false)}
        programa={programaActivo}
        onEntregadoExitoso={() => {
          setMensajeExito('¡Algoritmo entregado en la actividad con éxito!');
          setTimeout(() => setMensajeExito(null), 3500);
        }}
      />
    </div>
  );
};
