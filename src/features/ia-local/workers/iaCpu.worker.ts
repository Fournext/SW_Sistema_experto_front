import type { TextGenerationPipeline } from '@huggingface/transformers';

type TransformersModule = typeof import('@huggingface/transformers');

let transformersMod: TransformersModule | null = null;
let generator: TextGenerationPipeline | null = null;
let loadedModelId: string | null = null;
let aborted = false;

interface LoadMsg {
  type: 'load';
  id: string;
  modelId: string;
}

interface GenerateMsg {
  type: 'generate';
  id: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

interface AbortMsg {
  type: 'abort';
}

interface UnloadMsg {
  type: 'unload';
  id: string;
}

type WorkerInMsg = LoadMsg | GenerateMsg | AbortMsg | UnloadMsg;

self.onmessage = async (event: MessageEvent<WorkerInMsg>) => {
  const msg = event.data;

  if (msg.type === 'abort') {
    aborted = true;
    return;
  }

  if (msg.type === 'unload') {
    try {
      if (generator && typeof (generator as unknown as { dispose?: () => Promise<void> }).dispose === 'function') {
        await (generator as unknown as { dispose: () => Promise<void> }).dispose();
      }
    } catch {
      // Ignorar
    }
    generator = null;
    loadedModelId = null;
    self.postMessage({ type: 'unloaded', id: msg.id });
    return;
  }

  if (msg.type === 'load') {
    try {
      if (generator && loadedModelId === msg.modelId) {
        self.postMessage({ type: 'loaded', id: msg.id, modelId: msg.modelId });
        return;
      }

      if (generator) {
        try {
          if (typeof (generator as unknown as { dispose?: () => Promise<void> }).dispose === 'function') {
            await (generator as unknown as { dispose: () => Promise<void> }).dispose();
          }
        } catch {
          // Ignorar
        }
        generator = null;
        loadedModelId = null;
      }

      if (!transformersMod) {
        self.postMessage({
          type: 'progress',
          id: msg.id,
          progress: 2,
          text: 'Cargando runtime WebAssembly (Transformers.js) en RAM...',
        });
        transformersMod = await import('@huggingface/transformers');
        transformersMod.env.allowLocalModels = false;
        transformersMod.env.useBrowserCache = true;
        if (transformersMod.env.backends?.onnx?.wasm) {
          transformersMod.env.backends.onnx.wasm.proxy = false;
          transformersMod.env.backends.onnx.wasm.numThreads = 1;
        }
      }

      const fileProgress = new Map<string, { loaded: number; total: number }>();

      generator = (await transformersMod.pipeline('text-generation', msg.modelId, {
        device: 'wasm',
        dtype: 'q4',
        progress_callback: (info: {
          status?: string;
          file?: string;
          progress?: number;
          loaded?: number;
          total?: number;
        }) => {
          if (info.file && typeof info.loaded === 'number' && typeof info.total === 'number' && info.total > 0) {
            fileProgress.set(info.file, { loaded: info.loaded, total: info.total });
            let sumLoaded = 0;
            let sumTotal = 0;
            for (const entry of fileProgress.values()) {
              sumLoaded += entry.loaded;
              sumTotal += entry.total;
            }
            const pct = sumTotal > 0 ? Math.min(99, Math.round((sumLoaded / sumTotal) * 100)) : 0;
            self.postMessage({
              type: 'progress',
              id: msg.id,
              progress: pct,
              text: `Descargando modelo en RAM/Caché (${info.file}): ${pct}%`,
            });
          } else if (info.status === 'ready') {
            self.postMessage({
              type: 'progress',
              id: msg.id,
              progress: 100,
              text: 'Modelo cargado en memoria RAM (CPU WebAssembly).',
            });
          } else if (info.status) {
            self.postMessage({
              type: 'progress',
              id: msg.id,
              progress: typeof info.progress === 'number' ? Math.round(info.progress) : 5,
              text: `Inicializando en RAM (${info.status})...`,
            });
          }
        },
      })) as TextGenerationPipeline;

      loadedModelId = msg.modelId;
      self.postMessage({ type: 'loaded', id: msg.id, modelId: msg.modelId });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err || 'Error cargando modelo en CPU/RAM');
      self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
    }
    return;
  }

  if (msg.type === 'generate') {
    if (!generator || !transformersMod) {
      self.postMessage({ type: 'error', id: msg.id, error: 'El motor CPU/RAM no está cargado.' });
      return;
    }

    aborted = false;
    try {
      let acumulado = '';
      const streamer = new transformersMod.TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (textChunk: string) => {
          if (aborted) return;
          acumulado += textChunk;
          self.postMessage({ type: 'token', id: msg.id, token: textChunk, text: acumulado });
        },
      });

      const temp = msg.temperature ?? 0.25;
      const usarMuestreo = temp > 0.3;

      const output = await generator(msg.messages, {
        max_new_tokens: msg.maxTokens ?? 750,
        ...(usarMuestreo ? { temperature: temp, do_sample: true } : { do_sample: false }),
        return_full_text: false,
        streamer,
      });

      let textoFinal = acumulado;
      if (!textoFinal && Array.isArray(output) && output[0]) {
        const gen = (output[0] as { generated_text?: unknown }).generated_text;
        if (typeof gen === 'string') {
          textoFinal = gen;
        } else if (Array.isArray(gen)) {
          const ultimo = gen[gen.length - 1] as { content?: string } | undefined;
          textoFinal = ultimo?.content || '';
        }
      }

      self.postMessage({ type: 'done', id: msg.id, text: textoFinal });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err || 'Error generando respuesta en CPU/RAM');
      self.postMessage({ type: 'error', id: msg.id, error: errorMsg });
    }
  }
};

