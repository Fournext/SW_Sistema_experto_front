import { useCallback, useEffect, useRef, useState } from 'react';
import type { Hecho, Regla, Variable } from '@/features/base-conocimiento/types/types';
import type { HechoVectorItem } from '@/features/inferencia/components/BarraVectorHechos';
import { inferenciaService } from '@/features/inferencia/services/inferenciaService';
import type { ContradiccionPaso, PasoWorkflow } from '../components/PanelWorkflowInferencia';
import type { FlowNode } from '../types/types';
import { evaluarExpresionLogica } from '../utils/evaluadorLogicaPremisas';

export type EstadoInferenciaRegla = 'ACTIVADA' | 'EJECUTADA' | 'RECHAZADA' | 'ANALIZANDO';

interface UseSimuladorWorkflowFWCParams {
  sistemaId: string;
  hechos: Hecho[];
  variables: Variable[];
  reglas: Regla[];
  nodes: FlowNode[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  fitViewRef: React.MutableRefObject<any>;
}

export function useSimuladorWorkflowFWC({
  sistemaId,
  hechos,
  variables,
  reglas,
  nodes,
  setNodes,
  fitViewRef,
}: UseSimuladorWorkflowFWCParams) {
  const [vectorHechos, setVectorHechos] = useState<HechoVectorItem[]>([]);
  const vectorHechosInicializadoRef = useRef(false);
  const [ejecutandoInferencia, setEjecutandoInferencia] = useState(false);
  const [estadosInferencia, setEstadosInferencia] = useState<Record<string, EstadoInferenciaRegla>>({});

  const [pasosWorkflow, setPasosWorkflow] = useState<PasoWorkflow[]>([]);
  const [pasoActualWorkflowIndex, setPasoActualWorkflowIndex] = useState(0);
  const [modoEjecucionWorkflow, setModoEjecucionWorkflow] = useState<'DIRECTO' | 'PASO_A_PASO'>('PASO_A_PASO');
  const [conclusionFinalWorkflow, setConclusionFinalWorkflow] = useState<string | null>(null);
  const [metasFWC, setMetasFWC] = useState<string[]>([]);

  // Inicializar vector de hechos una sola vez al cargar hechos de la BC
  useEffect(() => {
    if (hechos.length > 0 && !vectorHechosInicializadoRef.current) {
      vectorHechosInicializadoRef.current = true;
      setVectorHechos(
        hechos.map((h) => ({
          nombre: h.nombre,
          valor: String(h.valor ?? ''),
        }))
      );
    }
  }, [hechos]);

  // Construir los pasos estructurados de trazabilidad FWC por Pasadas Pedagógicas
  const construirPasosWorkflow = useCallback(
    (
      _ejecucion: any,
      vectorIni: HechoVectorItem[],
      todasLasReglas: Regla[],
      metasObjetivo: string[] = []
    ): PasoWorkflow[] => {
      const pasos: PasoWorkflow[] = [];

      // Función auxiliar pedagógica: verifica si todas las metas del vector están unificadas en la BH
      const todasUnificadas = (bh: HechoVectorItem[], listaMetas: string[]): boolean => {
        if (!listaMetas || listaMetas.length === 0) return false;
        return listaMetas.every((m) => {
          const limpia = m.trim().toLowerCase();
          const enBh = bh.find((h) => h.nombre && h.nombre.trim().toLowerCase() === limpia);
          return enBh !== undefined && enBh.valor !== undefined && String(enBh.valor).trim() !== '';
        });
      };

      // Mapa auxiliar para resolver nombres de variables y hechos por ID
      const idToName = new Map<string, string>();
      (variables || []).forEach((v) => {
        if (v?.id && v?.nombre) idToName.set(String(v.id), String(v.nombre).trim());
      });
      (hechos || []).forEach((h) => {
        if (h?.id && h?.nombre) idToName.set(String(h.id), String(h.nombre).trim());
      });
      (nodes || []).forEach((n) => {
        if (n.data?.id && n.data?.nombre) {
          idToName.set(String(n.data.id), String(n.data.nombre).trim());
        }
      });

      // Ordenar las reglas por prioridad (descendente) o mantener orden de definición
      const reglasOrdenadas = [...todasLasReglas].sort(
        (a, b) => (b.prioridad ?? 10) - (a.prioridad ?? 10)
      );

      // Base de Hechos inicial
      const bhActual: HechoVectorItem[] = vectorIni.map((h) => ({
        nombre: String(h.nombre).trim(),
        valor: String(h.valor).trim(),
      }));

      const origenPorHecho = new Map<string, string>();
      bhActual.forEach((h) => {
        if (h.nombre) origenPorHecho.set(h.nombre.toLowerCase(), 'Vector BH Inicial (Cliente)');
      });

      // Si las metas ya estaban satisfechas desde el vector inicial
      if (metasObjetivo.length > 0 && todasUnificadas(bhActual, metasObjetivo)) {
        pasos.push({
          pasoNumero: 1,
          vueltaNumero: 1,
          pasadaNumero: 1,
          tipoPaso: 'CIERRE_PASADA',
          reglaId: '',
          reglaNombre: 'Metas ya unificadas en Base de Hechos Inicial',
          prioridad: 0,
          estado: 'CIERRE_PASADA',
          condicionesEvaluadas: [],
          nuevosHechosPasada: [],
          reglasMarcadas: [],
          bhInicioPasada: [...bhActual],
          memoriaTrabajoSnapshot: [...bhActual],
          metasAlcanzadas: true,
        });
        return pasos;
      }

      const reglasMarcadas = new Set<string>();
      const reglasMarcadasNombres: string[] = [];

      let pasadaNumero = 1;
      let pasoContador = 1;
      let contradiccionGlobal: ContradiccionPaso | undefined = undefined;
      let metasAlcanzadasGlobal = false;

      const MAX_PASADAS = 25;

      while (pasadaNumero <= MAX_PASADAS && !contradiccionGlobal && !metasAlcanzadasGlobal) {
        const bhInicioPasada = [...bhActual];
        let huboDisparoEnPasada = false;
        const nuevosHechosDeEstaPasada: Array<{ nombre: string; valor: string; reglaNombre: string }> = [];

        for (const reglaObj of reglasOrdenadas) {
          const rId = String(reglaObj.id);
          const rNombre = reglaObj.nombre || `Regla ${rId}`;
          const prioridad = reglaObj.prioridad ?? 10;

          if (reglasMarcadas.has(rId)) {
            pasos.push({
              pasoNumero: pasoContador++,
              vueltaNumero: pasadaNumero,
              pasadaNumero,
              tipoPaso: 'EVALUACION_REGLA',
              reglaId: rId,
              reglaNombre: rNombre,
              prioridad,
              estado: 'DESHABILITADA',
              motivoDescarte: `Regla ya disparada en una pasada anterior. Queda deshabilitada para la Pasada #${pasadaNumero}.`,
              condicionesEvaluadas: [],
              reglasMarcadas: [...reglasMarcadasNombres],
              bhInicioPasada: [...bhInicioPasada],
              memoriaTrabajoSnapshot: [...bhActual],
            });
            continue;
          }

          let todasCumplen = false;
          let conds: any[] = [];

          if (reglaObj.expresion_logica && reglaObj.expresion_logica.trim()) {
            const memoriaRecord: Record<string, any> = {};
            bhActual.forEach((h) => {
              if (h.nombre) memoriaRecord[h.nombre] = h.valor;
            });
            todasCumplen = evaluarExpresionLogica(reglaObj.expresion_logica, memoriaRecord);
            conds = [
              {
                sujeto: reglaObj.expresion_logica,
                operador: 'EXP',
                valorEsperado: 'true',
                valorEnBH: todasCumplen ? 'true' : 'false',
                cumple: todasCumplen,
              },
            ];
          } else {
            conds = (reglaObj.condiciones || []).map((c: any) => {
              let sujeto = String(c.variable_nombre || c.referencia || c.sujeto || '').trim();
              if (!sujeto && c.variable_id) sujeto = idToName.get(String(c.variable_id)) || '';
              if (!sujeto && c.hecho_id) sujeto = idToName.get(String(c.hecho_id)) || '';
              if (!sujeto && typeof c.variable === 'object' && c.variable) sujeto = String(c.variable.nombre || '').trim();
              if (!sujeto && (c.variable || c.nombre)) sujeto = String(c.variable || c.nombre).trim();

              const operador = c.operador || '=';
              const valorEsperado = String(c.valor_esperado ?? c.valor ?? '').trim();

              const hechoEnBH = bhActual.find(
                (h) => sujeto && h.nombre.toLowerCase() === sujeto.toLowerCase()
              );
              const valorEnBH = hechoEnBH?.valor;

              let cumple = false;
              if (valorEnBH !== undefined) {
                if (operador === '=') cumple = String(valorEnBH).toLowerCase() === valorEsperado.toLowerCase();
                else if (operador === '!=') cumple = String(valorEnBH).toLowerCase() !== valorEsperado.toLowerCase();
                else if (operador === '>') cumple = Number(valorEnBH) > Number(valorEsperado);
                else if (operador === '<') cumple = Number(valorEnBH) < Number(valorEsperado);
                else if (operador === '>=') cumple = Number(valorEnBH) >= Number(valorEsperado);
                else if (operador === '<=') cumple = Number(valorEnBH) <= Number(valorEsperado);
              }

              return {
                sujeto,
                operador,
                valorEsperado,
                valorEnBH,
                cumple,
              };
            });

            todasCumplen = conds.length > 0 && conds.every((c) => c.cumple);
          }

          if (todasCumplen) {
            huboDisparoEnPasada = true;
            reglasMarcadas.add(rId);
            reglasMarcadasNombres.push(rNombre);

            let hechoProducido: { nombre: string; valor: string } | undefined = undefined;
            if (reglaObj.conclusiones && reglaObj.conclusiones.length > 0) {
              const c0 = reglaObj.conclusiones[0] as any;
              let nombreVar = String(c0.variable_nombre || c0.destino || c0.nombre || '').trim();
              if (!nombreVar && c0.variable_resultante_id) nombreVar = idToName.get(String(c0.variable_resultante_id)) || '';
              if (!nombreVar && c0.hecho_resultante_id) nombreVar = idToName.get(String(c0.hecho_resultante_id)) || '';
              if (!nombreVar && typeof c0.variable === 'object' && c0.variable) nombreVar = String(c0.variable.nombre || '').trim();

              hechoProducido = {
                nombre: nombreVar || 'Deducción',
                valor: String(c0.valor_resultante ?? c0.valor ?? '').trim(),
              };
            }

            let pasoContradiccion: ContradiccionPaso | undefined = undefined;

            if (hechoProducido && hechoProducido.nombre) {
              nuevosHechosDeEstaPasada.push({
                nombre: hechoProducido.nombre,
                valor: hechoProducido.valor,
                reglaNombre: rNombre,
              });

              const clave = hechoProducido.nombre.toLowerCase();
              const existenteIdx = bhActual.findIndex((h) => h.nombre.toLowerCase() === clave);

              if (existenteIdx >= 0) {
                const existente = bhActual[existenteIdx];
                if (String(existente.valor).trim().toLowerCase() !== hechoProducido.valor.toLowerCase()) {
                  const origen = origenPorHecho.get(clave) || 'Entrada Inicial';
                  const esCliente = origen.toLowerCase().includes('cliente') || origen.toLowerCase().includes('inicial');
                  pasoContradiccion = {
                    tipo: esCliente ? 'CLIENTE_REGLA' : 'REGLA_REGLA',
                    variable: hechoProducido.nombre,
                    valorAnterior: existente.valor,
                    valorNuevo: hechoProducido.valor,
                    origenAnterior: origen,
                  };
                  contradiccionGlobal = pasoContradiccion;
                }
                bhActual[existenteIdx] = { nombre: hechoProducido.nombre, valor: hechoProducido.valor };
              } else {
                bhActual.push({ nombre: hechoProducido.nombre, valor: hechoProducido.valor });
              }
              origenPorHecho.set(clave, `Regla ${rNombre}`);
            }

            let metasAlcanzadasEnEstePaso = false;
            if (metasObjetivo.length > 0 && todasUnificadas(bhActual, metasObjetivo)) {
              metasAlcanzadasEnEstePaso = true;
              metasAlcanzadasGlobal = true;
            }

            pasos.push({
              pasoNumero: pasoContador++,
              vueltaNumero: pasadaNumero,
              pasadaNumero,
              tipoPaso: 'EVALUACION_REGLA',
              reglaId: rId,
              reglaNombre: rNombre,
              prioridad,
              estado: 'EJECUTADA',
              condicionesEvaluadas: conds,
              hechoProducido,
              reglasMarcadas: [...reglasMarcadasNombres],
              bhInicioPasada: [...bhInicioPasada],
              memoriaTrabajoSnapshot: [...bhActual],
              contradiccion: pasoContradiccion,
              metasAlcanzadas: metasAlcanzadasEnEstePaso,
            });

            if (pasoContradiccion || metasAlcanzadasEnEstePaso) {
              break;
            }
          } else {
            pasos.push({
              pasoNumero: pasoContador++,
              vueltaNumero: pasadaNumero,
              pasadaNumero,
              tipoPaso: 'EVALUACION_REGLA',
              reglaId: rId,
              reglaNombre: rNombre,
              prioridad,
              estado: 'RECHAZADA',
              motivoDescarte: 'Premisas no satisfechas con la Base de Hechos actual.',
              condicionesEvaluadas: conds,
              reglasMarcadas: [...reglasMarcadasNombres],
              bhInicioPasada: [...bhInicioPasada],
              memoriaTrabajoSnapshot: [...bhActual],
            });
          }
        }

        pasos.push({
          pasoNumero: pasoContador++,
          vueltaNumero: pasadaNumero,
          pasadaNumero,
          tipoPaso: 'CIERRE_PASADA',
          reglaId: '',
          reglaNombre: `Base de Hechos Resultante (Fin de ${pasadaNumero}ª Pasada)`,
          prioridad: 0,
          estado: 'CIERRE_PASADA',
          condicionesEvaluadas: [],
          nuevosHechosPasada: [...nuevosHechosDeEstaPasada],
          reglasMarcadas: [...reglasMarcadasNombres],
          bhInicioPasada: [...bhInicioPasada],
          memoriaTrabajoSnapshot: [...bhActual],
          contradiccion: contradiccionGlobal,
        });

        if (contradiccionGlobal || metasAlcanzadasGlobal) {
          break;
        }

        if (!huboDisparoEnPasada) {
          break;
        }

        pasadaNumero++;
      }

      return pasos;
    },
    [variables, hechos, nodes]
  );

  // Aplicar visualmente un paso de la simulación en el lienzo
  const aplicarPasoEnGrafo = useCallback(
    (pasoIdx: number, listaPasos: PasoWorkflow[]) => {
      if (listaPasos.length === 0 || pasoIdx < 0 || pasoIdx >= listaPasos.length) return;
      const paso = listaPasos[pasoIdx];

      const nuevosEstados: Record<string, any> = {};
      for (let i = 0; i < pasoIdx; i++) {
        const p = listaPasos[i];
        if (p.reglaId) {
          nuevosEstados[p.reglaId] = p.estado === 'CIERRE_PASADA' ? 'EJECUTADA' : p.estado;
        }
      }
      if (paso.reglaId) {
        nuevosEstados[paso.reglaId] = 'ANALIZANDO';
      }

      setEstadosInferencia(nuevosEstados);

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.type === 'REGLA') {
            const ruleId = String(n.data.id);
            return {
              ...n,
              data: {
                ...n.data,
                estadoInferencia: nuevosEstados[ruleId] || undefined,
              },
            };
          }
          return n;
        })
      );

      if (paso.reglaId) {
        const targetNode = nodes.find(
          (n) => n.id === `regla_${paso.reglaId}` || (n.type === 'REGLA' && String(n.data?.id) === paso.reglaId)
        );
        if (targetNode) {
          fitViewRef.current({ nodes: [targetNode], duration: 400, padding: 0.6 });
        }
      }
    },
    [nodes, setNodes, fitViewRef]
  );

  // Ejecución directa estándar de Forward Chaining
  const handleEjecutarInferenciaDirecta = useCallback(async () => {
    if (!sistemaId) return;
    setEjecutandoInferencia(true);
    try {
      const payloadHechos = vectorHechos.map((h) => ({
        nombre: h.nombre,
        valor: h.valor,
      }));

      const ejecucion = await inferenciaService.ejecutar(sistemaId, {
        hechos_iniciales: payloadHechos,
        metas: metasFWC.length > 0 ? metasFWC : undefined,
      });

      const pasosConstruidos = construirPasosWorkflow(ejecucion, vectorHechos, reglas, metasFWC);
      setPasosWorkflow(pasosConstruidos);
      setConclusionFinalWorkflow(ejecucion.conclusion_final || null);

      if (pasosConstruidos.length > 0) {
        setPasoActualWorkflowIndex(pasosConstruidos.length - 1);
        const nuevosEstados: Record<string, any> = {};
        pasosConstruidos.forEach((p) => {
          if (p.reglaId) {
            nuevosEstados[p.reglaId] = p.estado;
          }
        });
        setEstadosInferencia(nuevosEstados);

        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            if (n.type === 'REGLA') {
              const ruleId = String(n.data.id);
              return {
                ...n,
                data: {
                  ...n.data,
                  estadoInferencia: nuevosEstados[ruleId] || undefined,
                },
              };
            }
            return n;
          })
        );
      }
    } catch (err) {
      console.error('Error al ejecutar inferencia FWC:', err);
    } finally {
      setEjecutandoInferencia(false);
    }
  }, [sistemaId, vectorHechos, reglas, metasFWC, construirPasosWorkflow, setNodes]);

  // Iniciar la simulación paso a paso interactiva
  const handleIniciarSimulacionPasoAPaso = useCallback(async () => {
    if (!sistemaId) return;
    setEjecutandoInferencia(true);
    try {
      const payloadHechos = vectorHechos.map((h) => ({
        nombre: h.nombre,
        valor: h.valor,
      }));

      const ejecucion = await inferenciaService.ejecutar(sistemaId, {
        hechos_iniciales: payloadHechos,
        metas: metasFWC.length > 0 ? metasFWC : undefined,
      });

      const pasosConstruidos = construirPasosWorkflow(ejecucion, vectorHechos, reglas, metasFWC);
      setPasosWorkflow(pasosConstruidos);
      setConclusionFinalWorkflow(ejecucion.conclusion_final || null);

      if (pasosConstruidos.length > 0) {
        setPasoActualWorkflowIndex(0);
        aplicarPasoEnGrafo(0, pasosConstruidos);
      }
    } catch (err) {
      console.error('Error al iniciar simulación FWC:', err);
    } finally {
      setEjecutandoInferencia(false);
    }
  }, [sistemaId, vectorHechos, reglas, metasFWC, construirPasosWorkflow, aplicarPasoEnGrafo]);

  // Cambiar manualmente al paso deseado en el workflow
  const handleCambiarPasoWorkflow = useCallback(
    (nuevoIdx: number) => {
      setPasoActualWorkflowIndex(nuevoIdx);
      aplicarPasoEnGrafo(nuevoIdx, pasosWorkflow);
    },
    [pasosWorkflow, aplicarPasoEnGrafo]
  );

  // Reiniciar la simulación y limpiar estados visuales
  const handleReiniciarSimulacion = useCallback(() => {
    setPasosWorkflow([]);
    setPasoActualWorkflowIndex(0);
    setConclusionFinalWorkflow(null);
    setEstadosInferencia({});
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.type === 'REGLA') {
          return {
            ...n,
            data: {
              ...n.data,
              estadoInferencia: undefined,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  return {
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
    handleEjecutarInferenciaDirecta,
    handleIniciarSimulacionPasoAPaso,
    handleCambiarPasoWorkflow,
    handleReiniciarSimulacion,
  };
}

