import React from 'react';
import { FileText, Variable as VariableIcon, Workflow } from 'lucide-react';

export type TabType = 'hechos' | 'variables' | 'reglas';

export interface TabNavigationProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  counts?: {
    hechos?: number;
    variables?: number;
    reglas?: number;
  };
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onChange,
  counts,
}) => {
  const tabs = [
    {
      id: 'hechos' as TabType,
      label: 'Hechos Iniciales',
      icon: <FileText className="w-4 h-4" />,
      count: counts?.hechos,
      color: 'text-emerald-600',
    },
    {
      id: 'variables' as TabType,
      label: 'Variables del Dominio',
      icon: <VariableIcon className="w-4 h-4" />,
      count: counts?.variables,
      color: 'text-sky-600',
    },
    {
      id: 'reglas' as TabType,
      label: 'Reglas de Inferencia',
      icon: <Workflow className="w-4 h-4" />,
      count: counts?.reglas,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer rounded-t-lg ${
              isActive
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className={isActive ? tab.color : 'text-slate-400'}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
