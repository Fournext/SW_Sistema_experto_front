import React from 'react';
import { BookOpen, GraduationCap, Eye, Lightbulb, Users } from 'lucide-react';

export const EducationalBenefits: React.FC = () => {
  const benefits = [
    {
      title: 'Demostración en Vivo en el Aula',
      description:
        'Los docentes pueden proyectar el lienzo interactivo y modificar hechos en tiempo real para enseñar el impacto en el ciclo de encadenamiento.',
      icon: Eye,
    },
    {
      title: 'Trazabilidad Algorítmica Transparente',
      description:
        'Se acabó el comportamiento tipo "caja negra". Cada paso del motor muestra explícitamente qué regla se evaluó, se rechazó o se disparó.',
      icon: Lightbulb,
    },
    {
      title: 'Experimentación Práctica',
      description:
        'Los estudiantes pueden construir sus propios sistemas expertos desde cero, definiendo hechos, variables y condicionales IF-THEN.',
      icon: GraduationCap,
    },
    {
      title: 'Plantillas Didácticas Incluidas',
      description:
        'Viene preconfigurado con el sistema ejemplo "Recomendador de Metodología de Desarrollo" (Scrum, Waterfall, Kanban).',
      icon: Users,
    },
  ];

  return (
    <section id="docentes" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Info */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diseñado para Entornos Académicos</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
              Transforma la Enseñanza de la IA Simbólica
            </h2>
            <p className="mt-4 text-stone-600 text-base leading-relaxed">
              La plataforma ofrece un entorno interactivo y visual que conecta la teoría de los sistemas basados en reglas con la práctica real en el aula.
            </p>

            <div className="mt-8 p-5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                  99%
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Comprensión Algorítmica</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Visualizar el conjunto de conflicto y la traza de estados mejora radicalmente la asimilación del algoritmo Forward Chaining.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Grid of Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1.5">{b.title}</h3>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationalBenefits;
