import React from 'react';
import { Network, Cpu, Sliders, Layers, Sparkles } from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: Network,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Lienzo Visual con React Flow',
      description:
        'Representación gráfica interactiva mediante nodos especializados (Hechos, Variables, Condiciones, Reglas y Conclusiones) con posicionamiento guardado en tiempo real.',
    },
    {
      icon: Cpu,
      color: 'from-teal-600 to-cyan-600',
      bgColor: 'bg-teal-50 text-teal-700 border-teal-200',
      title: 'Motor Forward Chaining',
      description:
        'Motor de encadenamiento hacia adelante puro y guiado por datos, desacoplado del framework web para un cálculo rápido y determinista.',
    },
    {
      icon: Sliders,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Resolución de Conflictos',
      description:
        'Estrategia de resolución de conjuntos de conflicto orientada a prioridades explícitas y factores de certeza entre 0.00 y 1.00.',
    },
    {
      icon: Layers,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Gestión Completa de Conocimiento',
      description:
        'Administración estructurada de Hechos iniciales/deducidos, Variables de dominio y Reglas de producción con operadores relacionales (=, !=, >, <, CONTIENE).',
    },
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-stone-50 border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Capacidades Didácticas del Sistema</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Todo lo Necesario para la Enseñanza de Inteligencia Artificial
          </h2>
          <p className="mt-4 text-stone-600 text-base sm:text-lg">
            Diseñado meticulosamente para eliminar la complejidad técnica y enfocarse en los conceptos fundamentales de los sistemas expertos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl border ${f.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-teal-700 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed font-normal">
                    {f.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center text-xs font-semibold text-teal-700">
                  <span>Saber más</span>
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
