import React, { useState } from 'react';
import { Database, Plus, X, Play, Trash2, Cpu } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface HechoVectorItem {
  nombre: string;
  valor: string;
}

export interface BarraVectorHechosProps {
  hechos: HechoVectorItem[];
  onActualizarHechos: (hechos: HechoVectorItem[]) => void;
  onEjecutarInferencia?: () => void;
  ejecutando?: boolean;
  sugerenciasVariables?: string[];
  totalReglas?: number;
}

export const BarraVectorHechos: React.FC<BarraVectorHechosProps> = ({
  hechos = [],
  onActualizarHechos,
  onEjecutarInferencia,
  ejecutando = false,
  sugerenciasVariables = [],
  totalReglas = 0,
}) => {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  const agregarHecho = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoValor.trim()) return;

    const nombreLimpio = nuevoNombre.trim();
    const valorLimpio = nuevoValor.trim();

    // Actualizar si ya existía o agregar nuevo
    const filtrados = hechos.filter(
      (h) => h.nombre.toLowerCase() !== nombreLimpio.toLowerCase()
    );

    onActualizarHechos([...filtrados, { nombre: nombreLimpio, valor: valorLimpio }]);
    setNuevoNombre('');
    setNuevoValor('');
  };

  const eliminarHecho = (nombre: string) => {
    onActualizarHechos(hechos.filter((h) => h.nombre !== nombre));
  };

  const limpiarTodos = () => {
    onActualizarHechos([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-2xs border border-slate-200/90 p-2.5 flex flex-wrap items-center justify-between gap-3 text-left">
      {/* Título e Indicador del Vector BH */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-2xs">
          <Database className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Base de Hechos (BH)
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {hechos.length}
            </span>
          </div>
          <p className="text-[10px] font-sans text-slate-400">Vector de entrada para el Forward Chaining</p>
        </div>
      </div>

      {/* Chips de Hechos Actuales en el Vector */}
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[200px] max-w-2xl">
        {hechos.length === 0 ? (
          <span className="text-xs text-slate-400 italic font-mono">
            BH vacía. Ingresa un hecho (ej. x = 0) para evaluar las reglas.
          </span>
        ) : (
          hechos.map((h) => (
            <span
              key={h.nombre}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <span className="font-semibold text-slate-900">{h.nombre}</span>
              <span className="text-slate-400">=</span>
              <span className="text-slate-900 font-bold">{h.valor}</span>
              <button
                type="button"
                onClick={() => eliminarHecho(h.nombre)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5 p-0.5 rounded hover:bg-slate-200/60 transition-colors"
                title={`Quitar ${h.nombre} de la BH`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Formulario Rápido para añadir hechos al vector */}
      <form onSubmit={agregarHecho} className="flex items-center gap-1.5 shrink-0">
        <datalist id="sugerencias-hechos">
          {sugerenciasVariables.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <input
          type="text"
          list="sugerencias-hechos"
          placeholder="Atributo (ej. x)"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="w-24 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:ring-1 focus:ring-slate-900"
        />
        <span className="text-xs font-bold text-slate-400">=</span>
        <input
          type="text"
          placeholder="Valor (ej. 0)"
          value={nuevoValor}
          onChange={(e) => setNuevoValor(e.target.value)}
          className="w-20 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:ring-1 focus:ring-slate-900"
        />

        <button
          type="submit"
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
          title="Agregar al vector BH"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {hechos.length > 0 && (
          <button
            type="button"
            onClick={limpiarTodos}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="Limpiar vector BH"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Botón de Ejecutar Forward Chaining */}
      {onEjecutarInferencia && (
        <Button
          type="button"
          onClick={onEjecutarInferencia}
          disabled={ejecutando || totalReglas === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-2xs rounded-md shrink-0"
        >
          {ejecutando ? (
            <Cpu className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          {ejecutando ? 'Infiriendo...' : 'Probar FWC'}
        </Button>
      )}
    </div>
  );
};

export default BarraVectorHechos;
