import React, { useState } from 'react';
import { Settings, X, Check, ArrowDownUp } from 'lucide-react';
import type { SnapshotBC } from '../types/contracts';

interface ConfiguracionEjecucionModalProps {
  abierto: boolean;
  onCerrar: () => void;
  snapshot?: SnapshotBC | null;
  onGuardarConfig: (config: {
    ordenReglasIds?: string[];
    hechosOverride?: Record<string, unknown>;
    parametros?: Record<string, unknown>;
  }) => void;
}

export const ConfiguracionEjecucionModal: React.FC<ConfiguracionEjecucionModalProps> = ({
  abierto,
  onCerrar,
  snapshot,
  onGuardarConfig,
}) => {
  const [ordenInverso, setOrdenInverso] = useState(false);
  const [metaNombre, setMetaNombre] = useState('');
  const [hechosCustom, setHechosCustom] = useState('');

  if (!abierto) return null;

  const handleGuardar = () => {
    let ordenIds: string[] | undefined = undefined;
    if (snapshot?.reglas) {
      const ids = snapshot.reglas.map((r) => r.id);
      ordenIds = ordenInverso ? [...ids].reverse() : ids;
    }

    const parametros: Record<string, unknown> = {};
    if (metaNombre.trim()) {
      parametros['Meta'] = metaNombre.trim();
    }

    let hechosOverride: Record<string, unknown> | undefined = undefined;
    if (hechosCustom.trim()) {
      try {
        hechosOverride = JSON.parse(hechosCustom);
      } catch {
        // Formato clave=valor simple
        hechosOverride = {};
        hechosCustom.split('\n').forEach((line) => {
          const parts = line.split('=');
          if (parts.length === 2 && hechosOverride) {
            hechosOverride[parts[0].trim()] = parts[1].trim();
          }
        });
      }
    }

    onGuardarConfig({
      ordenReglasIds: ordenIds,
      hechosOverride,
      parametros,
    });
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Configuración de la Corrida
              </h3>
              <p className="text-xs text-slate-400">
                Personalice el orden de evaluación de reglas y hechos iniciales.
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-300">
          {/* Orden de Reglas */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4 text-indigo-400" />
                <span className="font-semibold text-slate-200">
                  Invertir Orden de la Base de Reglas
                </span>
              </div>
              <input
                type="checkbox"
                checked={ordenInverso}
                onChange={(e) => setOrdenInverso(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
            </label>
            <p className="text-[11px] text-slate-500 mt-1 pl-6">
              Por defecto se evalúa de R1 a Rn por prioridad. Actívelo para recorrer de Rn a R1.
            </p>
          </div>

          {/* Meta Específica */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Variable Meta (Para algoritmos con 1 Meta)
            </label>
            <input
              type="text"
              value={metaNombre}
              onChange={(e) => setMetaNombre(e.target.value)}
              placeholder="Ej. Diagnostico, Carrera, Meta"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Hechos Iniciales Personalizados */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sobrescribir Hechos Iniciales (Opcional)
            </label>
            <textarea
              value={hechosCustom}
              onChange={(e) => setHechosCustom(e.target.value)}
              placeholder={'Formato: Variable=Valor (una por línea)\nFiebre=Si\nTos=No'}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onCerrar}
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Check className="h-4 w-4" />
            Aplicar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

