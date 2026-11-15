import { create } from 'zustand';
import {
  CreateWebWorkerMLCEngine,
  prebuiltAppConfig,
  type InitProgressReport,
  type MLCEngineInterface,
} from '@mlc-ai/web-llm';
import type {
  BackendActivoIA,
  CasoPruebaGeneradoIA,
  EstadoMotorIALocal,
  ModeloIALocalConfig,
  ModoEjecucionIA,
} from '../types/iaLocal.types';

export const MODELOS_IA_LOCAL: ModeloIALocalConfig[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
    idCpu: 'onnx-community/Qwen2.5-1.5B-Instruct',
    nombre: 'Qwen 2.5 1.5B Instruct (Estable)',
    familia: 'Qwen 2.5',
    nivel: 'compacto',
    parametros: '1.5B',
    tamanoAproxGB: '~1.2 GB',
    vramMinimaGB: 2,
    descripcion:
      'Máxima estabilidad tanto en GPU (FP32) como en RAM (CPU WebAssembly). Ideal para portátiles y uso general.',
    recomendado: true,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    idCpu: 'onnx-community/Llama-3.2-1B-Instruct-ONNX',
    nombre: 'Llama 3.2 1B Instruct (Ligero)',
    familia: 'Llama 3.2',
    nivel: 'compacto',
    parametros: '1B',
    tamanoAproxGB: '~0.9 GB',
    vramMinimaGB: 1.5,
    descripcion:
      'Muy ligero y ágil tanto en GPU integrada como en memoria RAM.',
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
    idCpu: 'onnx-community/Qwen2.5-0.5B-Instruct',
    nombre: 'Qwen 2.5 0.5B Instruct (Ultra-Rápido RAM)',
    familia: 'Qwen 2.5',
    nivel: 'compacto',
    parametros: '0.5B',
    tamanoAproxGB: '~0.45 GB',
    vramMinimaGB: 1,
    descripcion:
      'Pensado para ejecución fluida en RAM/CPU o GPUs muy limitadas con menor tiempo de espera.',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f32_1-MLC',
    idCpu: 'onnx-community/Qwen2.5-1.5B-Instruct',
    nombre: 'Qwen 2.5 3B Instruct (Equilibrado)',
    familia: 'Qwen 2.5',
    nivel: 'equilibrado',
    parametros: '3B',
    tamanoAproxGB: '~2.2 GB',
    vramMinimaGB: 4,
    descripcion:
      'Equilibrio óptimo entre razonamiento lógico y español técnico (si pasa a RAM usa Qwen 2.5 1.5B).',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    idCpu: 'onnx-community/Qwen2.5-1.5B-Instruct',
    nombre: 'Phi-3.5 Mini Instruct',
    familia: 'Phi-3.5',
    nivel: 'avanzado',
    parametros: '3.8B',
    tamanoAproxGB: '~2.3 GB',
    vramMinimaGB: 4,
    descripcion:
      'Alta densidad lógica para inferencia formal y expresiones booleanas complejas (requiere GPU compatible f16).',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    idCpu: 'onnx-community/Qwen2.5-1.5B-Instruct',
    nombre: 'Qwen 2.5 7B Instruct',
    familia: 'Qwen 2.5',
    nivel: 'pesado',
    parametros: '7B',
    tamanoAproxGB: '~4.5 GB',
    vramMinimaGB: 6,
    descripcion:
      'Modelo de alta capacidad (requiere GPU dedicada >= 6 GB VRAM) para bases extensas y explicaciones profundas.',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    idCpu: 'onnx-community/Llama-3.2-1B-Instruct-ONNX',
    nombre: 'Llama 3.1 8B Instruct',
    familia: 'Llama 3.1',
    nivel: 'pesado',
    parametros: '8B',
    tamanoAproxGB: '~4.8 GB',
    vramMinimaGB: 6,
    descripcion:
      'Modelo pesado (requiere GPU dedicada >= 6 GB VRAM) con gran coherencia narrativa multi-regla.',
  },
];

const STORAGE_KEY_MODELO = 'se_ia_local_modelo_preferido';
const STORAGE_KEY_MODO = 'se_ia_local_modo_ejecucion';
const STORAGE_KEY_CASOS = 'se_ia_local_casos_prueba_v1';

const leerModeloPreferido = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODELO);
    if (saved && MODELOS_IA_LOCAL.some((m) => m.id === saved)) {
      return saved;
    }
  } catch {
    // Ignorar
  }
  return MODELOS_IA_LOCAL[0].id;
};

const leerModoEjecucion = (): ModoEjecucionIA => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODO);
    if (saved === 'auto' || saved === 'gpu' || saved === 'cpu') {
      return saved;
    }
  } catch {
    // Ignorar
  }
  return 'auto';
};

const leerCasosGuardados = (): Record<string, CasoPruebaGeneradoIA[]> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CASOS);
    if (raw) {
      return JSON.parse(raw) as Record<string, CasoPruebaGeneradoIA[]>;
    }
  } catch {
    // Ignorar
  }
  return {};
};

const persistirCasos = (casos: Record<string, CasoPruebaGeneradoIA[]>) => {
  try {
    localStorage.setItem(STORAGE_KEY_CASOS, JSON.stringify(casos));
  } catch {
    // Ignorar
  }
};

export interface IALocalState {
  estado: EstadoMotorIALocal;
  modoEjecucion: ModoEjecucionIA;
  backendActivo: BackendActivoIA;
  modeloSeleccionadoId: string;
  modeloCargadoId: string | null;
  progresoPct: number;
  mensajeProgreso: string;
  errorMensaje: string | null;
  webGPUSoportado: boolean | null;
  modalGestorAbierto: boolean;
  engine: MLCEngineInterface | null;
  worker: Worker | null;
  cpuWorker: Worker | null;
  casosPorSistema: Record<string, CasoPruebaGeneradoIA[]>;

  setModalGestorAbierto: (abierto: boolean) => void;
  setModoEjecucion: (modo: ModoEjecucionIA) => void;
  seleccionarModelo: (modeloId: string) => void;
  verificarSoporteWebGPU: () => Promise<boolean>;
  cargarModelo: (modeloIdOverride?: string, forzarCpu?: boolean) => Promise<void>;
  activarRespaldoCPU: (motivo?: string) => Promise<void>;
  generarTextoCpu: (
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; maxTokens?: number },
    onToken?: (acumulado: string) => void
  ) => Promise<string>;
  descargarDeMemoria: () => Promise<void>;
  setGenerando: (generando: boolean) => void;
  abortarGeneracion: () => void;
  guardarCasosPrueba: (sistemaId: string, casos: CasoPruebaGeneradoIA[]) => void;
  actualizarResultadoCaso: (
    sistemaId: string,
    casoId: string,
    resultado: CasoPruebaGeneradoIA['ultimoResultado']
  ) => void;
  limpiarCasosPrueba: (sistemaId: string) => void;
}

const resolverModeloDisponible = (solicitadoId: string): string => {
  const disponibles = prebuiltAppConfig?.model_list || [];
  if (disponibles.some((m) => m.model_id === solicitadoId)) {
    return solicitadoId;
  }
  const prefijo = solicitadoId.split('-q4')[0];
  const similar = disponibles.find((m) => m.model_id.startsWith(prefijo));
  if (similar) return similar.model_id;
  return solicitadoId;
};

const resolverModeloCpu = (modeloId: string): string => {
  const cfg = MODELOS_IA_LOCAL.find((m) => m.id === modeloId);
  return cfg?.idCpu || 'onnx-community/Qwen2.5-1.5B-Instruct';
};

let cargaEnCurso: Promise<void> | null = null;

export const useIALocalStore = create<IALocalState>((set, get) => ({
  estado: 'no_cargado',
  modoEjecucion: leerModoEjecucion(),
  backendActivo: null,
  modeloSeleccionadoId: leerModeloPreferido(),
  modeloCargadoId: null,
  progresoPct: 0,
  mensajeProgreso: 'Motor en espera. Se ejecuta localmente en GPU o en memoria RAM.',
  errorMensaje: null,
  webGPUSoportado: null,
  modalGestorAbierto: false,
  engine: null,
  worker: null,
  cpuWorker: null,
  casosPorSistema: leerCasosGuardados(),

  setModalGestorAbierto: (abierto) => set({ modalGestorAbierto: abierto }),

  setModoEjecucion: (modo) => {
    try {
      localStorage.setItem(STORAGE_KEY_MODO, modo);
    } catch {
      // Ignorar
    }
    set({ modoEjecucion: modo });
  },

  seleccionarModelo: (modeloId) => {
    try {
      localStorage.setItem(STORAGE_KEY_MODELO, modeloId);
    } catch {
      // Ignorar
    }
    set({ modeloSeleccionadoId: modeloId });
  },

  verificarSoporteWebGPU: async () => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      set({ webGPUSoportado: false });
      return false;
    }
    try {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter?: () => Promise<unknown | null> } }).gpu;
      const adapter = await gpu?.requestAdapter?.();
      const soportado = Boolean(adapter);
      set({ webGPUSoportado: soportado });
      return soportado;
    } catch {
      set({ webGPUSoportado: false });
      return false;
    }
  },

  cargarModelo: async (modeloIdOverride, forzarCpu = false) => {
    const state = get();
    const modeloId = modeloIdOverride || state.modeloSeleccionadoId;
    const modo = forzarCpu ? 'cpu' : state.modoEjecucion;

    const yaListoEnGpu =
      modo !== 'cpu' &&
      state.backendActivo === 'gpu' &&
      state.engine &&
      state.modeloCargadoId === resolverModeloDisponible(modeloId) &&
      state.estado === 'listo';

    const yaListoEnCpu =
      modo === 'cpu' &&
      state.backendActivo === 'cpu' &&
      state.cpuWorker &&
      state.modeloCargadoId === resolverModeloCpu(modeloId) &&
      state.estado === 'listo';

    if (yaListoEnGpu || yaListoEnCpu) return;

    if (cargaEnCurso) {
      return cargaEnCurso;
    }

    cargaEnCurso = (async () => {
      let usarCpu = modo === 'cpu';

      if (!usarCpu) {
        const soportado = await get().verificarSoporteWebGPU();
        if (!soportado) {
          if (modo === 'gpu') {
            const msg =
              'Tu navegador no detectó WebGPU. Cambia el modo a "Automático" o "CPU / RAM" para ejecutar usando memoria RAM.';
            set({ estado: 'error', errorMensaje: msg, mensajeProgreso: msg });
            throw new Error(msg);
          }
          usarCpu = true;
        }
      }

      // Limpiar instancias previas
      await get().descargarDeMemoria();

      if (!usarCpu) {
        const modeloObjetivo = resolverModeloDisponible(modeloId);
        set({
          estado: 'descargando',
          backendActivo: 'gpu',
          progresoPct: 0,
          errorMensaje: null,
          modeloSeleccionadoId: modeloId,
          mensajeProgreso: 'Inicializando WebGPU y verificando caché del navegador...',
        });

        const worker = new Worker(new URL('../workers/iaLocal.worker.ts', import.meta.url), {
          type: 'module',
        });

        try {
          const engine = await CreateWebWorkerMLCEngine(
            worker,
            modeloObjetivo,
            {
              initProgressCallback: (report: InitProgressReport) => {
                const pct = Math.min(100, Math.max(0, Math.round((report.progress || 0) * 100)));
                set({
                  progresoPct: pct,
                  mensajeProgreso: report.text || `Cargando en GPU (${pct}%)...`,
                });
              },
            },
            {
              context_window_size: 2048,
            }
          );

          set({
            engine,
            worker,
            backendActivo: 'gpu',
            estado: 'listo',
            modeloCargadoId: modeloObjetivo,
            progresoPct: 100,
            errorMensaje: null,
            mensajeProgreso: 'Modelo cargado en GPU (WebGPU) y listo para inferir.',
          });
          return;
        } catch (err) {
          worker.terminate();
          if (modo === 'gpu') {
            const mensaje =
              err instanceof Error
                ? err.message
                : 'No se pudo cargar en WebGPU. Prueba el modo CPU / RAM.';
            set({
              engine: null,
              worker: null,
              backendActivo: null,
              estado: 'error',
              modeloCargadoId: null,
              errorMensaje: mensaje,
              mensajeProgreso: mensaje,
            });
            throw err;
          }
          // En modo 'auto', pasar automáticamente a CPU/RAM
          usarCpu = true;
        }
      }

      // Carga en CPU / RAM (WebAssembly)
      let modeloCpu = resolverModeloCpu(modeloId);
      const cargarEnCpuWorker = async (targetCpuModel: string) => {
        set({
          estado: 'descargando',
          backendActivo: 'cpu',
          progresoPct: 0,
          errorMensaje: null,
          modeloSeleccionadoId: modeloId,
          mensajeProgreso: `Cargando ${targetCpuModel} en memoria RAM (CPU)...`,
        });

        const cpuWorker = new Worker(new URL('../workers/iaCpu.worker.ts', import.meta.url), {
          type: 'module',
        });

        await new Promise<void>((resolve, reject) => {
          const reqId = `load-${Date.now()}`;
          const onMsg = (ev: MessageEvent) => {
            const d = ev.data;
            if (!d || (d.id && d.id !== reqId)) return;
            if (d.type === 'progress') {
              set({
                progresoPct: typeof d.progress === 'number' ? d.progress : 0,
                mensajeProgreso: d.text || 'Cargando modelo en RAM...',
              });
            } else if (d.type === 'loaded') {
              cpuWorker.removeEventListener('message', onMsg);
              cpuWorker.removeEventListener('error', onErr);
              set({
                cpuWorker,
                backendActivo: 'cpu',
                estado: 'listo',
                modeloCargadoId: targetCpuModel,
                progresoPct: 100,
                errorMensaje: null,
                mensajeProgreso: `Modelo ${targetCpuModel} cargado en memoria RAM (CPU WebAssembly) y listo.`,
              });
              resolve();
            } else if (d.type === 'error') {
              cpuWorker.removeEventListener('message', onMsg);
              cpuWorker.removeEventListener('error', onErr);
              cpuWorker.terminate();
              reject(new Error(d.error || 'No se pudo cargar el modelo en memoria RAM.'));
            }
          };
          const onErr = (ev: ErrorEvent) => {
            console.error('CPU Worker ErrorEvent:', ev);
            cpuWorker.removeEventListener('message', onMsg);
            cpuWorker.removeEventListener('error', onErr);
            cpuWorker.terminate();
            const detalle = [ev.message, ev.filename ? `${ev.filename}:${ev.lineno}` : '']
              .filter(Boolean)
              .join(' ');
            reject(new Error(detalle || 'Error al iniciar el Web Worker de CPU/RAM.'));
          };
          cpuWorker.addEventListener('message', onMsg);
          cpuWorker.addEventListener('error', onErr);
          cpuWorker.postMessage({ type: 'load', id: reqId, modelId: targetCpuModel });
        });
      };

      try {
        await cargarEnCpuWorker(modeloCpu);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err || '');
        const modeloFallbackCpu = 'onnx-community/Qwen2.5-0.5B-Instruct';
        if (/bad_alloc|out of memory|memory/i.test(msg) && modeloCpu !== modeloFallbackCpu) {
          modeloCpu = modeloFallbackCpu;
          try {
            await cargarEnCpuWorker(modeloFallbackCpu);
            return;
          } catch (err2) {
            const msg2 = err2 instanceof Error ? err2.message : String(err2 || '');
            set({
              cpuWorker: null,
              backendActivo: null,
              estado: 'error',
              modeloCargadoId: null,
              errorMensaje: msg2,
              mensajeProgreso: msg2,
            });
            throw err2;
          }
        }
        set({
          cpuWorker: null,
          backendActivo: null,
          estado: 'error',
          modeloCargadoId: null,
          errorMensaje: msg,
          mensajeProgreso: msg,
        });
        throw err;
      }
    })();

    try {
      await cargaEnCurso;
    } finally {
      cargaEnCurso = null;
    }
  },

  activarRespaldoCPU: async (motivo) => {
    set({
      mensajeProgreso:
        motivo || 'GPU insuficiente. Cambiando automáticamente a memoria RAM (CPU)...',
    });
    await get().cargarModelo(get().modeloSeleccionadoId, true);
  },

  generarTextoCpu: async (messages, options, onToken) => {
    const { cpuWorker } = get();
    if (!cpuWorker) {
      throw new Error('El motor en memoria RAM no está inicializado.');
    }
    set({ estado: 'generando' });

    try {
      return await new Promise<string>((resolve, reject) => {
        const reqId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const onMsg = (ev: MessageEvent) => {
          const d = ev.data;
          if (!d || d.id !== reqId) return;
          if (d.type === 'token') {
            if (onToken && typeof d.text === 'string') {
              onToken(d.text);
            }
          } else if (d.type === 'done') {
            cpuWorker.removeEventListener('message', onMsg);
            cpuWorker.removeEventListener('error', onErr);
            resolve(String(d.text || ''));
          } else if (d.type === 'error') {
            cpuWorker.removeEventListener('message', onMsg);
            cpuWorker.removeEventListener('error', onErr);
            reject(new Error(d.error || 'Error generando en CPU/RAM.'));
          }
        };
        const onErr = (ev: ErrorEvent) => {
          cpuWorker.removeEventListener('message', onMsg);
          cpuWorker.removeEventListener('error', onErr);
          reject(new Error(ev.message || 'Fallo inesperado en worker CPU/RAM.'));
        };

        cpuWorker.addEventListener('message', onMsg);
        cpuWorker.addEventListener('error', onErr);
        cpuWorker.postMessage({
          type: 'generate',
          id: reqId,
          messages,
          maxTokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.25,
        });
      });
    } finally {
      if (get().cpuWorker) {
        set({ estado: 'listo' });
      }
    }
  },

  descargarDeMemoria: async () => {
    const { engine, worker, cpuWorker } = get();
    if (engine) {
      try {
        await engine.unload();
      } catch {
        // Ignorar
      }
    }
    if (worker) {
      worker.terminate();
    }
    if (cpuWorker) {
      cpuWorker.terminate();
    }
    set({
      engine: null,
      worker: null,
      cpuWorker: null,
      backendActivo: null,
      estado: 'no_cargado',
      modeloCargadoId: null,
      progresoPct: 0,
      errorMensaje: null,
      mensajeProgreso: 'Modelo descargado de la memoria. Los pesos permanecen en caché.',
    });
  },

  setGenerando: (generando) => {
    const { engine, cpuWorker, estado } = get();
    if (!engine && !cpuWorker) return;
    if (generando) {
      set({ estado: 'generando' });
    } else if (estado === 'generando') {
      set({ estado: 'listo' });
    }
  },

  abortarGeneracion: () => {
    const { engine, cpuWorker } = get();
    if (engine) {
      try {
        engine.interruptGenerate();
      } catch {
        // Ignorar
      }
    }
    if (cpuWorker) {
      cpuWorker.postMessage({ type: 'abort' });
    }
    if (engine || cpuWorker) {
      set({ estado: 'listo' });
    }
  },

  guardarCasosPrueba: (sistemaId, casos) => {
    set((prev) => {
      const next = { ...prev.casosPorSistema, [String(sistemaId)]: casos };
      persistirCasos(next);
      return { casosPorSistema: next };
    });
  },

  actualizarResultadoCaso: (sistemaId, casoId, resultado) => {
    set((prev) => {
      const actuales = prev.casosPorSistema[String(sistemaId)] || [];
      const actualizados = actuales.map((c) =>
        c.id === casoId ? { ...c, ultimoResultado: resultado } : c
      );
      const next = { ...prev.casosPorSistema, [String(sistemaId)]: actualizados };
      persistirCasos(next);
      return { casosPorSistema: next };
    });
  },

  limpiarCasosPrueba: (sistemaId) => {
    set((prev) => {
      const next = { ...prev.casosPorSistema };
      delete next[String(sistemaId)];
      persistirCasos(next);
      return { casosPorSistema: next };
    });
  },
}));
