import { ArrowDown, Database, GitBranch, Zap, Target } from 'lucide-react';

export interface TrazabilidadFlowProps {
  totalHechos: number;
  totalEvaluadas: number;
  totalActivadas: number;
  tieneConclusion: boolean;
}

export const TrazabilidadFlow: React.FC<TrazabilidadFlowProps> = ({
  totalHechos,
  totalEvaluadas,
  totalActivadas,
  tieneConclusion,
}) => {
  const steps = [
    {
      title: 'Hechos Iniciales',
      desc: `${totalHechos} proposiciones en memoria`,
      icon: <Database className="w-4 h-4 text-emerald-600" />,
      active: totalHechos > 0,
      badge: `${totalHechos}`,
    },
    {
      title: 'Reglas Evaluadas',
      desc: `${totalEvaluadas} condiciones analizadas`,
      icon: <GitBranch className="w-4 h-4 text-slate-600" />,
      active: totalEvaluadas > 0,
      badge: `${totalEvaluadas}`,
    },
    {
      title: 'Reglas Activadas',
      desc: `${totalActivadas} en conjunto conflicto`,
      icon: <Zap className="w-4 h-4 text-indigo-600" />,
      active: totalActivadas > 0,
      badge: `${totalActivadas}`,
    },
    {
      title: 'Conclusión Final',
      desc: tieneConclusion ? 'Deducción completada' : 'En espera',
      icon: <Target className="w-4 h-4 text-teal-600" />,
      active: tieneConclusion,
      badge: tieneConclusion ? '✓' : '—',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-left">
        Flujo de Razonamiento hacia Adelante (Forward Chaining)
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className={`w-full p-3 rounded-xl border text-center transition-all ${
                step.active
                  ? 'bg-slate-50 border-indigo-300 shadow-xs'
                  : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1 rounded-lg bg-white shadow-2xs border border-slate-100">
                  {step.icon}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    step.active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step.badge}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 text-left">{step.title}</div>
              <div className="text-[11px] text-slate-500 text-left truncate">{step.desc}</div>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 text-slate-300">
                {/* Visual spacer on desktop */}
              </div>
            )}
            {idx < steps.length - 1 && (
              <div className="md:hidden my-1 text-slate-300">
                <ArrowDown className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrazabilidadFlow;
