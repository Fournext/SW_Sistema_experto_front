import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { useEjecucionLaboratorio } from '../hooks/useEjecucionLaboratorio';
import { laboratorioService } from '../services/laboratorioService';
import { EditorAlgoritmo } from '../components/EditorAlgoritmo';
import { CodigoEjecucion } from '../components/CodigoEjecucion';
import { ControlesEjecucion } from '../components/ControlesEjecucion';
import { PanelVariables } from '../components/PanelVariables';
import { PanelBaseHechos } from '../components/PanelBaseHechos';
import { PanelReglas } from '../components/PanelReglas';
import { PanelEstructuras } from '../components/PanelEstructuras';
import { PreguntaLaboratorioModal } from '../components/PreguntaLaboratorioModal';
import { AyudaLenguajeModal } from '../components/AyudaLenguajeModal';
import { ConfiguracionEjecucionModal } from '../components/ConfiguracionEjecucionModal';
import type { PlantillaAlgoritmo } from '../types/contracts';

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

  const [plantillas, setPlantillas] = useState<PlantillaAlgoritmo[]>([]);
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false);
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [tituloGuardado, setTituloGuardado] = useState('Mi Algoritmo FWC');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Hook principal de ejecución
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

  // Cargar plantillas al montar
  useEffect(() => {
    laboratorioService
      .obtenerPlantillas()
      .then((data) => setPlantillas(data))
      .catch((err) => console.error('Error al cargar plantillas:', err));
  }, []);

  const handleValidar = async () => {
    const esValido = await validarCodigo();
    if (esValido) {
      setMensajeExito('¡Código validado con éxito! Sintaxis y tipos correctos.');
      setTimeout(() => setMensajeExito(null), 3500);
    }
  };

  const handleSeleccionarPlantilla = (plantillaId: string) => {
    const seleccionada = plantillas.find((p) => p.id === plantillaId);
    if (seleccionada) {
      if (
        !corrida ||
        window.confirm('¿Desea cargar la plantilla? Se reiniciará la simulación actual.')
      ) {
        reiniciar();
        setCodigo(seleccionada.codigo);
        setTituloGuardado(seleccionada.titulo);
      }
    }
  };

  const handleGuardarPrograma = async () => {
    try {
      setGuardando(true);
      await laboratorioService.guardarPrograma({
        titulo: tituloGuardado,
        codigo_fuente: codigo,
        sistema_experto: sistemaId,
      });
      setMensajeExito('¡Algoritmo guardado con éxito!');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err: unknown) {
      alert(`Error al guardar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const estaEnSimulacion = corrida !== null;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Barra Superior de Navegación y Herramientas */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(sistemaId ? `/sistemas-expertos/${sistemaId}` : '/sistemas-expertos')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Laboratorio de Algoritmos de Inferencia
              </h1>
              <p className="text-[10px] text-slate-400">
                Simulación y control paso a paso en memoria (Java SE-1)
              </p>
            </div>
          </div>
        </div>

        {/* Plantillas y Guardado */}
        <div className="flex items-center gap-3">
          {mensajeExito && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {mensajeExito}
            </span>
          )}

          {/* Selector de Plantillas Canónicas */}
          <div className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
            <select
              onChange={(e) => handleSeleccionarPlantilla(e.target.value)}
              defaultValue=""
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none hover:border-slate-600"
            >
              <option value="" disabled>
                Cargar plantilla canónica...
              </option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGuardarPrograma}
            disabled={guardando}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-blue-500 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </header>

      {/* 2. Banner de Alerta de Errores si existen */}
      {erroresCompilacion.length > 0 && (
        <div className="flex items-center gap-2 border-b border-rose-900 bg-rose-950/80 px-4 py-2 text-xs text-rose-300">
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

      {/* 3. Panel Principal Dividido (Split Screen) */}
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
              />
            )}
          </div>
        </div>

        {/* Columna Derecha: Paneles de Estado del Algoritmo */}
        <div className="flex w-96 flex-col overflow-hidden gap-3">
          <div className="h-1/3 min-h-[140px]">
            <PanelVariables frame={frameActual} />
          </div>

          <div className="h-1/3 min-h-[140px]">
            <PanelBaseHechos baseHechos={baseHechosRuntime} />
          </div>

          <div className="flex-1 min-h-[160px] grid grid-cols-1 gap-2 overflow-hidden">
            <div className="h-1/2">
              <PanelReglas
                snapshot={corrida ? (corrida as any).snapshot_bc : null}
                marcasReglas={marcasReglas}
              />
            </div>
            <div className="h-1/2">
              <PanelEstructuras
                pilaHN={pilaHNRuntime}
                colaQ={colaQRuntime}
                listaMetas={listaMetasRuntime}
                baseHechos={baseHechosRuntime}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Modales Interactivos */}
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
        snapshot={corrida ? (corrida as any).snapshot_bc : null}
        onGuardarConfig={(config) => iniciarSimulacion(config)}
      />
    </div>
  );
};

