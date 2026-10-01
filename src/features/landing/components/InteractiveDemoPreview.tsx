import React, { useState } from 'react';
import { Play, RotateCcw, Check, Sparkles, Activity, Zap, CheckCircle2 } from 'lucide-react';

interface HechoDemo {
  id: string;
  nombre: string;
  etiqueta: string;
  activo: boolean;
}

interface ReglaDemo {
  id: string;
  codigo: string;
  nombre: string;
  prioridad: number;
  requiereHechos: string[];
  conclusion: string;
  valorConclusion: string;
}

export const InteractiveDemoPreview: React.FC = () => {
  // Hechos interactivos iniciales que el usuario puede activar/desactivar
  const [hechos, setHechos] = useState<HechoDemo[]>([
    { id: 'h1', nombre: 'equipo_pequeno', etiqueta: 'Equipo Pequeño (<= 8 personas)', activo: true },
    { id: 'h2', nombre: 'requisitos_cambiantes', etiqueta: 'Requisitos Cambiantes / Dinámicos', activo: true },
    { id: 'h3', nombre: 'cliente_disponible', etiqueta: 'Cliente Disponible para Feedback Constante', activo: false },
    { id: 'h4', nombre: 'proyecto_critico_vida', etiqueta: 'Proyecto Crítico para la Vida / Regulación Alta', activo: false },
  ]);

  const [ejecutado, setEjecutado] = useState(false);
  const [traza, setTraza] = useState<{ orden: number; regla: string; estado: 'EVALUADA' | 'RECHAZADA' | 'ACTIVADA' | 'EJECUTADA'; detalle: string }[]>([]);
  const [conclusionFinal, setConclusionFinal] = useState<string | null>(null);

  // Definición de reglas del mini-sistema experto de prueba
  const reglas: ReglaDemo[] = [
    {
      id: 'r1',
      codigo: 'R1',
      nombre: 'Recomendar Scrum',
      prioridad: 10,
      requiereHechos: ['equipo_pequeno', 'requisitos_cambiantes'],
      conclusion: 'metodologia_recomendada',
      valorConclusion: 'Scrum',
    },
    {
      id: 'r2',
      codigo: 'R2',
      nombre: 'Recomendar Waterfall (Cascada)',
      prioridad: 8,
      requiereHechos: ['proyecto_critico_vida'],
      conclusion: 'metodologia_recomendada',
      valorConclusion: 'Waterfall (Cascada)',
    },
    {
      id: 'r3',
      codigo: 'R3',
      nombre: 'Recomendar Extreme Programming (XP)',
      prioridad: 12,
      requiereHechos: ['equipo_pequeno', 'requisitos_cambiantes', 'cliente_disponible'],
      conclusion: 'metodologia_recomendada',
      valorConclusion: 'Extreme Programming (XP)',
    },
  ];

  const toggleHecho = (id: string) => {
    setHechos((prev) =>
      prev.map((h) => (h.id === id ? { ...h, activo: !h.activo } : h))
    );
    setEjecutado(false);
    setConclusionFinal(null);
    setTraza([]);
  };

  const simularInferencia = () => {
    const hechosActivosNombres = new Set(hechos.filter((h) => h.activo).map((h) => h.nombre));
    const nuevaTraza: { orden: number; regla: string; estado: 'EVALUADA' | 'RECHAZADA' | 'ACTIVADA' | 'EJECUTADA'; detalle: string }[] = [];
    let ordenCount = 1;

    // Reglas candidatas activadas
    const reglasActivadas: ReglaDemo[] = [];

    reglas.forEach((regla) => {
      // 1. EVALUADA
      const seCumple = regla.requiereHechos.every((h) => hechosActivosNombres.has(h));
      nuevaTraza.push({
        orden: ordenCount++,
        regla: `${regla.codigo} - ${regla.nombre}`,
        estado: 'EVALUADA',
        detalle: `Evaluando premisas: IF ${regla.requiereHechos.join(' AND ')}`,
      });

      if (seCumple) {
        nuevaTraza.push({
          orden: ordenCount++,
          regla: `${regla.codigo} - ${regla.nombre}`,
          estado: 'ACTIVADA',
          detalle: `Condiciones cumplidas. Entra al Conjunto de Conflicto (Prioridad: ${regla.prioridad}).`,
        });
        reglasActivadas.push(regla);
      } else {
        nuevaTraza.push({
          orden: ordenCount++,
          regla: `${regla.codigo} - ${regla.nombre}`,
          estado: 'RECHAZADA',
          detalle: `Faltan hechos en la memoria de trabajo.`,
        });
      }
    });

    // Resolución de conflictos por prioridad
    if (reglasActivadas.length > 0) {
      reglasActivadas.sort((a, b) => b.prioridad - a.prioridad);
      const reglaGanadora = reglasActivadas[0];

      nuevaTraza.push({
        orden: ordenCount++,
        regla: `${reglaGanadora.codigo} - ${reglaGanadora.nombre}`,
        estado: 'EJECUTADA',
        detalle: `Regla seleccionada por mayor prioridad (${reglaGanadora.prioridad}). Deducido: ${reglaGanadora.conclusion} = ${reglaGanadora.valorConclusion}`,
      });

      setConclusionFinal(reglaGanadora.valorConclusion);
    } else {
      setConclusionFinal('No se pudo deducir una metodología con los hechos actuales.');
    }

    setTraza(nuevaTraza);
    setEjecutado(true);
  };

  const resetSimulacion = () => {
    setEjecutado(false);
    setConclusionFinal(null);
    setTraza([]);
  };

  return (
    <section id="demostracion" className="py-20 bg-stone-900 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-700/50 text-teal-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Simulador Interactivo en Tiempo Real</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Experimenta el Motor de Inferencia
          </h2>
          <p className="mt-4 text-stone-400 text-base sm:text-lg">
            Selecciona los hechos iniciales y haz clic en <strong>"Ejecutar Inferencia"</strong> para observar cómo el algoritmo de Encadenamiento Hacia Adelante evalúa las reglas y resuelve conflictos por prioridad.
          </p>
        </div>

        {/* Simulator Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Fact Controls */}
          <div className="lg:col-span-5 bg-stone-800/90 backdrop-blur-md rounded-2xl p-6 border border-stone-700/80 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-700">
              <h3 className="font-bold text-lg text-teal-300 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                1. Memoria de Trabajo (Hechos)
              </h3>
              <span className="text-xs text-stone-400 bg-stone-700 px-2 py-1 rounded">
                Haz clic para activar/desactivar
              </span>
            </div>

            <p className="text-xs text-stone-400 mb-4">
              Estos hechos representan las premisas de entrada conocidas por el sistema experto:
            </p>

            <div className="space-y-3 mb-6">
              {hechos.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggleHecho(h.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${h.activo
                      ? 'bg-teal-950/60 border-teal-500 text-teal-100 shadow-md shadow-teal-950/50'
                      : 'bg-stone-900/50 border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-teal-400 font-bold">{h.nombre}</span>
                    <span className="text-sm font-medium text-stone-200 mt-0.5">{h.etiqueta}</span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${h.activo ? 'bg-teal-500 text-stone-950' : 'bg-stone-800 text-stone-600'
                      }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={simularInferencia}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-stone-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>Ejecutar Inferencia</span>
              </button>

              {ejecutado && (
                <button
                  onClick={resetSimulacion}
                  className="p-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 transition-colors"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Execution Trace & Deduced Conclusion */}
          <div className="lg:col-span-7 bg-stone-800/90 backdrop-blur-md rounded-2xl p-6 border border-stone-700/80 shadow-2xl flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-700">
              <h3 className="font-bold text-lg text-emerald-300 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                2. Traza de Inferencia Paso a Paso
              </h3>
              {ejecutado && (
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-full font-mono">
                  FINALIZADA
                </span>
              )}
            </div>

            {!ejecutado ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-stone-700 rounded-xl bg-stone-900/30">
                <Sparkles className="w-10 h-10 text-teal-500/50 mb-3 animate-pulse" />
                <h4 className="text-stone-300 font-semibold text-base">Esperando ejecución</h4>
                <p className="text-xs text-stone-500 max-w-sm mt-1">
                  Haz clic en <strong>"Ejecutar Inferencia"</strong> en el panel izquierdo para visualizar la evaluación de condiciones y el disparo de reglas.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between space-y-6">
                {/* Trace steps */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {traza.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-stone-900/80 border border-stone-700/60 text-xs font-mono flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-stone-800 text-stone-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                        #{t.orden}
                      </span>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-stone-200 font-bold">{t.regla}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.estado === 'EJECUTADA'
                                ? 'bg-emerald-500 text-stone-950'
                                : t.estado === 'ACTIVADA'
                                  ? 'bg-amber-500 text-stone-950'
                                  : t.estado === 'EVALUADA'
                                    ? 'bg-blue-900/80 text-blue-200'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                              }`}
                          >
                            {t.estado}
                          </span>
                        </div>
                        <p className="text-stone-400 text-[11px] font-sans">{t.detalle}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Deduced Conclusion Card */}
                {conclusionFinal && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950 via-emerald-950 to-stone-900 border border-emerald-500/50 shadow-lg">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Conclusión Deducida
                    </div>
                    <div className="text-xl font-bold text-white font-sans">
                      {conclusionFinal}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemoPreview;
