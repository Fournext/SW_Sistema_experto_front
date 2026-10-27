import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, CheckCircle2, RotateCcw, Layers, SlidersHorizontal, Search } from 'lucide-react';
import type { Hecho, Variable } from '@/features/base-conocimiento/types/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const SIN_VARIABLES: Variable[] = [];

export interface CuestionarioItem {
  nombre: string;
  valor: string;
  tipo_dato: string;
  opciones?: string[];
  pregunta?: string;
  es_inicial?: boolean;
  origen: 'HECHO' | 'VARIABLE';
}

export interface CuestionarioConsultaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hechos: Hecho[];
  variables?: Variable[];
  nombresEnReglas?: Set<string>;
  mensajeAviso?: string;
  onConfirmar: (respuestas: Array<{ nombre: string; valor: string; tipo_dato?: string; opciones?: string[] }>) => void;
  loading?: boolean;
  tituloAccion?: string;
}

export const CuestionarioConsultaModal: React.FC<CuestionarioConsultaModalProps> = ({
  isOpen,
  onClose,
  hechos,
  variables = SIN_VARIABLES,
  nombresEnReglas,
  mensajeAviso,
  onConfirmar,
  loading = false,
  tituloAccion = 'Iniciar Inferencia con Respuestas',
}) => {
  // Filtrar exclusivamente los elementos consultables:
  // 1. Hechos iniciales (es_inicial === true) O hechos con pregunta configurada.
  // 2. Variables con pregunta configurada (evitando duplicar si ya existe el hecho con el mismo nombre).
  const itemsConsultables = useMemo<CuestionarioItem[]>(() => {
    const lista: CuestionarioItem[] = [];
    const nombresAgregados = new Set<string>();

    // 1. Hechos iniciales o que tengan pregunta configurada
    (hechos || []).forEach((h) => {
      const tienePregunta = Boolean(h.pregunta && h.pregunta.trim() !== '');
      const esInicial = h.es_inicial !== false;
      const nombreNorm = h.nombre.toLowerCase().trim();
      const estaEnReglas = !nombresEnReglas || nombresEnReglas.size === 0 || nombresEnReglas.has(nombreNorm);
      if ((esInicial || tienePregunta) && estaEnReglas) {
        lista.push({
          nombre: h.nombre,
          valor: h.valor !== undefined && h.valor !== null ? String(h.valor) : '',
          tipo_dato: h.tipo_dato || 'TEXTO',
          opciones: h.opciones || [],
          pregunta: h.pregunta?.trim() || undefined,
          es_inicial: esInicial,
          origen: 'HECHO',
        });
        nombresAgregados.add(nombreNorm);
      }
    });

    // 2. Variables iniciales o que tengan pregunta configurada
    (variables || []).forEach((v) => {
      const tienePregunta = Boolean(v.pregunta && v.pregunta.trim() !== '');
      const esInicialVar = v.es_inicial === true;
      const nombreNorm = v.nombre.toLowerCase().trim();
      const estaEnReglas = !nombresEnReglas || nombresEnReglas.size === 0 || nombresEnReglas.has(nombreNorm);
      if ((esInicialVar || tienePregunta) && !nombresAgregados.has(nombreNorm) && estaEnReglas) {
        lista.push({
          nombre: v.nombre,
          valor: String(v.valor_defecto ?? v.valor_por_defecto ?? ''),
          tipo_dato: v.tipo || v.tipo_dato || 'TEXTO',
          opciones: (v as unknown as { opciones?: string[] }).opciones || [],
          pregunta: v.pregunta?.trim() || undefined,
          es_inicial: esInicialVar || tienePregunta,
          origen: 'VARIABLE',
        });
        nombresAgregados.add(nombreNorm);
      }
    });

    return lista;
  }, [hechos, variables, nombresEnReglas]);

  // Estado local de las respuestas del usuario
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [filtroTexto, setFiltroTexto] = useState('');

  // Inicializar respuestas con los valores de los elementos consultables
  useEffect(() => {
    if (isOpen && itemsConsultables.length > 0) {
      const mapaInicial: Record<string, string> = {};
      itemsConsultables.forEach((item) => {
        mapaInicial[item.nombre] = item.valor !== undefined && item.valor !== null ? String(item.valor) : '';
      });
      setRespuestas(mapaInicial);
      setFiltroTexto('');
    }
  }, [isOpen, itemsConsultables]);

  const handleCambiarValor = (nombre: string, nuevoValor: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [nombre]: nuevoValor,
    }));
  };

  const handleRestablecer = () => {
    const mapaInicial: Record<string, string> = {};
    itemsConsultables.forEach((item) => {
      mapaInicial[item.nombre] = item.valor !== undefined && item.valor !== null ? String(item.valor) : '';
    });
    setRespuestas(mapaInicial);
  };

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = itemsConsultables.map((item) => ({
      nombre: item.nombre,
      valor: respuestas[item.nombre] ?? String(item.valor ?? ''),
      tipo_dato: item.tipo_dato,
      opciones: item.opciones,
    }));
    onConfirmar(payload);
  };

  // Filtrado de elementos por nombre o pregunta
  const itemsFiltrados = itemsConsultables.filter((item) => {
    const busqueda = filtroTexto.toLowerCase();
    const nombreMatch = item.nombre.toLowerCase().includes(busqueda);
    const preguntaMatch = item.pregunta?.toLowerCase().includes(busqueda);
    return nombreMatch || preguntaMatch;
  });

  const respondidosCount = itemsConsultables.filter(
    (item) => respuestas[item.nombre] !== undefined && respuestas[item.nombre].trim() !== ''
  ).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Consulta al Sistema Experto: Cuestionario de Hechos"
      description="Responda a las preguntas o ajuste las variables del problema para cargar la memoria de trabajo y deducir la conclusión."
    >
      <form onSubmit={handleEnviar} className="space-y-6">
        {/* Barra superior de métricas y filtro */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-700">
            <SlidersHorizontal className="w-4 h-4 text-teal-700" />
            <span>
              Variables / Hechos del Caso:{' '}
              <strong className="text-teal-800 font-bold">
                {respondidosCount} de {itemsConsultables.length}
              </strong>{' '}
              configurados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Filtrar preguntas..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleRestablecer}
              className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-teal-700 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all flex items-center gap-1 cursor-pointer"
              title="Restablecer a valores de la base de conocimiento"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          </div>
        </div>

        {/* Banner informativo de activación por reglas */}
        {(mensajeAviso || (nombresEnReglas && nombresEnReglas.size > 0)) && (
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-teal-900 animate-fadeIn text-left">
            <HelpCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Preguntas de Simulación Interactiva</span>
              <span>
                {mensajeAviso ||
                  'Las reglas del sistema experto verifican variables o hechos iniciales. Ingrese sus respuestas para que el motor pueda evaluar las condiciones y continuar con la inferencia.'}
              </span>
            </div>
          </div>
        )}

        {/* Lista interactiva de preguntas */}
        <div className="max-h-[58vh] overflow-y-auto pr-1.5 space-y-3.5">
          {itemsConsultables.length === 0 ? (
            <div className="py-12 px-6 text-center text-stone-500 bg-stone-50/70 rounded-xl border border-dashed border-stone-200">
              <HelpCircle className="w-10 h-10 mx-auto mb-3 text-stone-400 stroke-[1.5]" />
              <h4 className="text-sm font-bold text-slate-800">No hay variables ni hechos iniciales para consultar</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                El cuestionario interactivo se activa para hechos marcados como <strong>Hecho Inicial</strong> o para hechos y variables que tengan configurada una <strong>Pregunta para el usuario</strong>.
              </p>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-sm">No se encontraron preguntas que coincidan con la búsqueda.</p>
            </div>
          ) : (
            itemsFiltrados.map((item, idx) => {
              const valorActual = respuestas[item.nombre] ?? String(item.valor ?? '');
              const preguntaTexto =
                item.pregunta?.trim() || `¿Cuál es el valor para ${item.nombre}?`;
              const esVerificadaEnReglas = Boolean(
                nombresEnReglas && nombresEnReglas.has(item.nombre.toLowerCase().trim())
              );

              return (
                <div
                  key={item.nombre || idx}
                  className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs transition-all space-y-3 text-left"
                >
                  {/* Encabezado de la pregunta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-stone-100 text-stone-700 font-bold text-[11px] border border-stone-200">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-stone-900 leading-snug">
                          {preguntaTexto}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-400 pl-7 font-mono flex items-center gap-2 flex-wrap">
                        <span>
                          {item.origen === 'VARIABLE' ? 'Variable' : 'Hecho'}:{' '}
                          <strong className="text-stone-700">{item.nombre}</strong>
                        </span>
                        {item.es_inicial && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-sans font-semibold">
                            Inicial
                          </span>
                        )}
                        {item.origen === 'VARIABLE' && (
                          <span className="text-[10px] bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.2 rounded font-sans font-semibold">
                            Variable
                          </span>
                        )}
                        {esVerificadaEnReglas && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-300/80 px-1.5 py-0.2 rounded font-sans font-semibold flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5 text-amber-600" />
                            Verificada en Reglas
                          </span>
                        )}
                      </p>
                    </div>

                    <Badge variant="neutral" className="text-[10px] tracking-wide shrink-0">
                      {item.tipo_dato}
                    </Badge>
                  </div>

                  {/* Control interactivo por Tipo de Dato */}
                  <div className="pl-7 pt-1">
                    {item.tipo_dato === 'BOOLEANO' ? (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCambiarValor(item.nombre, 'true')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            valorActual.toLowerCase() === 'true'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sí / Verdadero
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCambiarValor(item.nombre, 'false')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            valorActual.toLowerCase() === 'false'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          No / Falso
                        </button>
                      </div>
                    ) : item.tipo_dato === 'OPCION' && item.opciones && item.opciones.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.opciones.map((opc) => {
                          const estaSeleccionada = valorActual === opc;
                          return (
                            <button
                              key={opc}
                              type="button"
                              onClick={() => handleCambiarValor(item.nombre, opc)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                estaSeleccionada
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {opc}
                            </button>
                          );
                        })}
                      </div>
                    ) : item.tipo_dato === 'ENTERO' || item.tipo_dato === 'DECIMAL' ? (
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="number"
                          step={item.tipo_dato === 'ENTERO' ? '1' : 'any'}
                          value={valorActual}
                          onChange={(e) => handleCambiarValor(item.nombre, e.target.value)}
                          placeholder="Ingrese valor numérico..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                          required
                        />
                      </div>
                    ) : (
                      <div className="max-w-md">
                        <input
                          type="text"
                          value={valorActual}
                          onChange={(e) => handleCambiarValor(item.nombre, e.target.value)}
                          placeholder="Escriba la respuesta o valor cualitativo..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer con acciones */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Los hechos modificados se aplican <span className="font-semibold text-slate-700">únicamente a esta consulta</span> sin alterar los datos base.
          </p>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {tituloAccion}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CuestionarioConsultaModal;
