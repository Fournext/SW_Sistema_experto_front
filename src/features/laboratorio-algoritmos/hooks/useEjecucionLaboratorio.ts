import { useState, useRef, useEffect, useCallback } from 'react';
import { laboratorioService } from '../services/laboratorioService';
import type {
  CorridaLaboratorio,
  ErrorCompilacion,
  EstadoCorrida,
  ModoAvance,
} from '../types/contracts';

interface UseEjecucionLaboratorioProps {
  sistemaExpertoId?: string;
  codigoInicial?: string;
}

export function useEjecucionLaboratorio({
  sistemaExpertoId,
  codigoInicial = '',
}: UseEjecucionLaboratorioProps) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [corrida, setCorrida] = useState<CorridaLaboratorio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [erroresCompilacion, setErroresCompilacion] = useState<ErrorCompilacion[]>([]);
  const [enEjecucionAutomatica, setEnEjecucionAutomatica] = useState(false);
  const [velocidadMs, setVelocidadMs] = useState(800);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const estadoActual: EstadoCorrida | null = corrida?.estado || null;

  // 1. Validar código sin ejecutar
  const validarCodigo = useCallback(async (): Promise<boolean> => {
    try {
      setCargando(true);
      const res = await laboratorioService.compilar(codigo);
      if (res.valido) {
        setErroresCompilacion([]);
        return true;
      } else {
        setErroresCompilacion(res.errores || []);
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErroresCompilacion([{ mensaje: msg, fase: 'red' }]);
      return false;
    } finally {
      setCargando(false);
    }
  }, [codigo]);

  // 2. Iniciar simulación interactiva
  const iniciarSimulacion = useCallback(
    async (configExtra?: {
      ordenReglasIds?: string[];
      hechosOverride?: Record<string, unknown>;
      parametros?: Record<string, unknown>;
    }) => {
      try {
        setCargando(true);
        setErroresCompilacion([]);
        const nuevaCorrida = await laboratorioService.iniciarCorrida({
          sistema_experto_id: sistemaExpertoId,
          codigo_fuente: codigo,
          orden_reglas_ids: configExtra?.ordenReglasIds,
          hechos_iniciales_override: configExtra?.hechosOverride,
          parametros_iniciales: configExtra?.parametros,
        });
        setCorrida(nuevaCorrida);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErroresCompilacion([{ mensaje: msg, fase: 'ejecucion' }]);
      } finally {
        setCargando(false);
      }
    },
    [sistemaExpertoId, codigo]
  );

  // 3. Avanzar 1 paso de línea
  const avanzarPaso = useCallback(
    async (modo: ModoAvance = 'LINE_STEP'): Promise<CorridaLaboratorio | null> => {
      if (!corrida?.id) return null;
      if (
        corrida.estado === 'FINALIZADA' ||
        corrida.estado === 'ERROR' ||
        corrida.estado === 'ESPERANDO_ENTRADA'
      ) {
        setEnEjecucionAutomatica(false);
        return corrida;
      }

      try {
        setCargando(true);
        const corridaActualizada = await laboratorioService.avanzarCorrida(
          corrida.id,
          modo,
          1
        );
        setCorrida(corridaActualizada);

        if (
          corridaActualizada.estado === 'FINALIZADA' ||
          corridaActualizada.estado === 'ERROR' ||
          corridaActualizada.estado === 'ESPERANDO_ENTRADA'
        ) {
          setEnEjecucionAutomatica(false);
        }

        return corridaActualizada;
      } catch (err: unknown) {
        setEnEjecucionAutomatica(false);
        const msg = err instanceof Error ? err.message : String(err);
        setErroresCompilacion([{ mensaje: msg, fase: 'ejecucion' }]);
        return null;
      } finally {
        setCargando(false);
      }
    },
    [corrida]
  );

  // 4. Responder consulta interactiva (Preguntar)
  const responderPregunta = useCallback(
    async (valor: string, cancelada: boolean = false) => {
      if (!corrida?.id) return;
      try {
        setCargando(true);
        const corridaActualizada = await laboratorioService.responderPregunta(
          corrida.id,
          valor,
          cancelada
        );
        setCorrida(corridaActualizada);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErroresCompilacion([{ mensaje: msg, fase: 'pregunta' }]);
      } finally {
        setCargando(false);
      }
    },
    [corrida]
  );

  // 5. Controles de Reproducción Automática (Play/Pausa)
  const iniciarAutoPlay = useCallback(() => {
    if (corrida?.estado === 'EJECUTANDO' || corrida?.estado === 'PAUSADA') {
      setEnEjecucionAutomatica(true);
    }
  }, [corrida]);

  const pausarAutoPlay = useCallback(() => {
    setEnEjecucionAutomatica(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reiniciar = useCallback(() => {
    pausarAutoPlay();
    setCorrida(null);
    setErroresCompilacion([]);
  }, [pausarAutoPlay]);

  // Bucle de ejecución automática
  useEffect(() => {
    if (!enEjecucionAutomatica) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(async () => {
      await avanzarPaso('LINE_STEP');
    }, velocidadMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enEjecucionAutomatica, velocidadMs, avanzarPaso]);

  // Extraer información del estado visible
  const estadoVM = corrida?.estado_vm || null;
  const frameActual = estadoVM?.frames?.[estadoVM.frames.length - 1] || null;
  const ultimoEvento = estadoVM?.eventos?.[estadoVM.eventos.length - 1] || null;
  const lineaActiva = ultimoEvento?.linea || null;
  const columnaActiva = ultimoEvento?.columna || null;
  const preguntaPendiente = estadoVM?.pregunta_pendiente || null;

  // Extraer Base de Hechos de las variables del frame actual si existe
  const baseHechosRuntime = (frameActual?.variables?.['BH'] as any) || null;
  const pilaHNRuntime = (frameActual?.variables?.['HN'] as any) || null;
  const colaQRuntime = (frameActual?.variables?.['Q'] as any) || null;
  const listaMetasRuntime = (frameActual?.variables?.['Metas'] as any) || null;

  return {
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
    salidasTexto: estadoVM?.salidas_texto || [],
    marcasReglas: estadoVM?.marcas_reglas || [],
    validarCodigo,
    iniciarSimulacion,
    avanzarPaso,
    responderPregunta,
    iniciarAutoPlay,
    pausarAutoPlay,
    reiniciar,
  };
}
