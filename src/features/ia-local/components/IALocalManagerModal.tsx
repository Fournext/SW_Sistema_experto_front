import React, { useEffect } from 'react';
import {
  Cpu,
  HardDriveDownload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { MODELOS_IA_LOCAL, useIALocalStore } from '../store/useIALocalStore';
import type { ModoEjecucionIA, NivelCapacidadModelo } from '../types/iaLocal.types';

const badgePorNivel: Record<
  NivelCapacidadModelo,
  { texto: string; variant: 'neutral' | 'success' | 'warning' }
> = {
  compacto: { texto: 'Compacto', variant: 'neutral' },
  equilibrado: { texto: 'Equilibrado', variant: 'success' },
  avanzado: { texto: 'Avanzado', variant: 'warning' },
  pesado: { texto: 'Alta Capacidad', variant: 'warning' },
};

export const IALocalManagerModal: React.FC = () => {
  const {
    modalGestorAbierto,
    setModalGestorAbierto,
    estado,
    modoEjecucion,
    setModoEjecucion,
    backendActivo,
    modeloSeleccionadoId,
    modeloCargadoId,
    progresoPct,
    mensajeProgreso,
    errorMensaje,
    webGPUSoportado,
    verificarSoporteWebGPU,
    seleccionarModelo,
    cargarModelo,
    descargarDeMemoria,
  } = useIALocalStore();

  useEffect(() => {
    if (modalGestorAbierto && webGPUSoportado !== true) {
      void verificarSoporteWebGPU();
    }
  }, [modalGestorAbierto, webGPUSoportado, verificarSoporteWebGPU]);

  const estaCargando = estado === 'descargando';
  const estaListo = estado === 'listo' || estado === 'generando';
  const cambioDeModelo =
    estaListo && modeloCargadoId !== null && modeloCargadoId !== modeloSeleccionadoId;

  const handleCargar = async () => {
    try {
      await cargarModelo(modeloSeleccionadoId);
    } catch {
      // El error queda reflejado en el store
    }
  };

  return (
    <Modal
      isOpen={modalGestorAbierto}
      onClose={() => setModalGestorAbierto(false)}
      title="Motor de IA Local en el Navegador"
      description="Ejecuta modelos de lenguaje cuantizados directamente en tu GPU mediante WebGPU, sin enviar datos a servidores externos."
      size="lg"
    >
      <div className="space-y-5">
        {/* Estado de Hardware / WebGPU + Respaldo RAM */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
            webGPUSoportado === false && modoEjecucion === 'gpu'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : webGPUSoportado === false
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-stone-50 border-stone-200 text-stone-700'
          }`}
        >
          {webGPUSoportado === false && modoEjecucion === 'gpu' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <p className="font-semibold text-stone-900">
              {webGPUSoportado === false
                ? modoEjecucion === 'gpu'
                  ? 'WebGPU no detectado en este navegador'
                  : 'WebGPU no disponible: se usará Memoria RAM (CPU WebAssembly)'
                : webGPUSoportado === true
                ? 'Aceleración WebGPU disponible (con respaldo automático a RAM si falta VRAM)'
                : 'Verificando compatibilidad WebGPU...'}
            </p>
            <p className="text-stone-600 leading-relaxed">
              {webGPUSoportado === false
                ? 'En modo Automático o CPU/RAM, el modelo se ejecutará usando la memoria RAM del sistema sin requerir tarjeta gráfica.'
                : 'La primera carga descarga los pesos a la caché del navegador. Si la GPU se queda sin VRAM, cambia automáticamente a memoria RAM.'}
            </p>
            {webGPUSoportado === false && (
              <button
                type="button"
                onClick={() => void verificarSoporteWebGPU()}
                className="mt-1 text-[11px] font-semibold text-stone-800 underline hover:text-teal-800 cursor-pointer"
              >
                Reintentar detección de WebGPU
              </button>
            )}
          </div>
        </div>

        {/* Selector de Modo de Cómputo (GPU vs RAM) */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Modo de Cómputo
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'auto',
                  titulo: 'Automático',
                  desc: 'Usa GPU y pasa a RAM si falla',
                },
                {
                  id: 'cpu',
                  titulo: 'CPU / RAM',
                  desc: 'Usa memoria RAM (WebAssembly)',
                },
                {
                  id: 'gpu',
                  titulo: 'Solo GPU',
                  desc: 'Exige aceleración WebGPU',
                },
              ] as Array<{ id: ModoEjecucionIA; titulo: string; desc: string }>
            ).map((op) => {
              const activo = modoEjecucion === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  disabled={estaCargando}
                  onClick={() => setModoEjecucion(op.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-60 ${
                    activo
                      ? 'border-teal-600 bg-teal-50/60 text-teal-950'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="text-xs font-bold">{op.titulo}</div>
                  <div className="text-[11px] text-stone-500">{op.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Modelos */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Catálogo de Modelos Cuantizados (q4)
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              Selecciona según tu VRAM
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {MODELOS_IA_LOCAL.map((modelo) => {
              const seleccionado = modeloSeleccionadoId === modelo.id;
              const activoEnMemoria = modeloCargadoId === modelo.id && estaListo;
              const nivelUI = badgePorNivel[modelo.nivel];

              return (
                <button
                  key={modelo.id}
                  type="button"
                  disabled={estaCargando}
                  onClick={() => seleccionarModelo(modelo.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer disabled:opacity-60 ${
                    seleccionado
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600/20'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900">
                        {modelo.nombre}
                      </span>
                      <Badge variant={nivelUI.variant} size="sm">
                        {nivelUI.texto}
                      </Badge>
                      {modelo.recomendado && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-stone-800 text-white">
                          Recomendado
                        </span>
                      )}
                      {activoEnMemoria && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          En memoria
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-stone-600">
                      <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200">
                        {modelo.parametros}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200">
                        {modelo.tamanoAproxGB}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        VRAM ≥ {modelo.vramMinimaGB} GB
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                    {modelo.descripcion}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Progreso / Estado */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-700" />
              Estado del motor ({backendActivo === 'cpu' ? 'CPU / RAM' : backendActivo === 'gpu' ? 'GPU WebGPU' : 'Web Worker'})
            </span>
            <span className="font-mono font-bold text-stone-700">
              {estaCargando ? `${progresoPct}%` : estaListo ? 'LISTO' : 'INACTIVO'}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                estado === 'error'
                  ? 'bg-rose-600'
                  : estaListo
                  ? 'bg-emerald-600'
                  : 'bg-teal-700'
              }`}
              style={{ width: `${estaListo ? 100 : progresoPct}%` }}
            />
          </div>

          <p className="text-[11px] font-mono text-stone-600 break-words">
            {errorMensaje || mensajeProgreso}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div>
            {estaListo && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                onClick={() => void descargarDeMemoria()}
                className="text-rose-700 hover:bg-rose-50"
              >
                Liberar VRAM / Descargar de memoria
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setModalGestorAbierto(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={estaCargando}
              disabled={(modoEjecucion === 'gpu' && webGPUSoportado === false) || (estaListo && !cambioDeModelo)}
              icon={<HardDriveDownload className="w-4 h-4" />}
              onClick={() => void handleCargar()}
            >
              {estaCargando
                ? `Cargando (${progresoPct}%)`
                : cambioDeModelo
                ? 'Cambiar y Cargar Modelo'
                : estaListo
                ? 'Modelo Listo'
                : 'Cargar Modelo en Navegador'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IALocalManagerModal;

