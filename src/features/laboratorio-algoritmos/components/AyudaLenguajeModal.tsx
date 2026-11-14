import React from 'react';
import { BookMarked, X, Code } from 'lucide-react';

interface AyudaLenguajeModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export const AyudaLenguajeModal: React.FC<AyudaLenguajeModalProps> = ({
  abierto,
  onCerrar,
}) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <BookMarked className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Guía del Lenguaje de Inferencia (Java SE-1)
              </h2>
              <p className="text-xs text-slate-400">
                Sintaxis pedagógica oficial basada en las clases de Sistemas Expertos.
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

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-6 text-xs text-slate-300 pr-2">
          {/* Tipos de Datos */}
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
              <Code className="h-4 w-4" /> 1. Tipos de Datos Disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <span className="text-amber-400 font-bold">int</span>,{' '}
                <span className="text-amber-400 font-bold">boolean</span>,{' '}
                <span className="text-amber-400 font-bold">String</span>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Tipos primitivos habituales para contadores y banderas.
                </p>
              </div>
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <span className="text-blue-400 font-bold">Regla</span>,{' '}
                <span className="text-blue-400 font-bold">Variable</span>,{' '}
                <span className="text-blue-400 font-bold">Hecho</span>,{' '}
                <span className="text-blue-400 font-bold">BaseHechos</span>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Tipos de dominio académico para la Base de Conocimiento.
                </p>
              </div>
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5 md:col-span-2">
                <span className="text-purple-400 font-bold">Lista&lt;T&gt;</span>,{' '}
                <span className="text-purple-400 font-bold">Pila&lt;T&gt;</span>,{' '}
                <span className="text-purple-400 font-bold">Cola&lt;T&gt;</span>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Colecciones dinámicas tipadas para reglas o hechos (ej: <code>Pila&lt;Variable&gt; HN</code>, <code>Cola&lt;Regla&gt; Q</code>).
                </p>
              </div>
            </div>
          </section>

          {/* Funciones Built-in */}
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
              <Code className="h-4 w-4" /> 2. Funciones de Inferencia de Clase
            </h3>
            <div className="space-y-2 font-mono">
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-emerald-400 font-bold">Hecho Disparar(Regla r, BaseHechos BH)</div>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Evalúa las premisas de la regla contra BH. Si todas se cumplen, deriva y retorna el nuevo <code>Hecho</code>. Si no, retorna <code>null</code>.
                </p>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-emerald-400 font-bold">void Marcar(Regla r)</div>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Marca la regla para que no vuelva a ser evaluada en futuras pasadas (equivale a <code>r.marcada = true</code>).
                </p>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-emerald-400 font-bold">Hecho Preguntar(String pregunta, Variable v)</div>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Pausa la ejecución y abre un diálogo en pantalla para que el usuario ingrese el valor en vivo.
                </p>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-emerald-400 font-bold">boolean BH.add(Hecho h)</div>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Agrega el hecho a la Base de Hechos. Realiza <strong>unificación de clase</strong>: si la variable ya tenía un valor distinto, detecta contradicción sin sobrescribir.
                </p>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-emerald-400 font-bold">boolean BH.contains(Variable v)</div>
                <p className="font-sans text-[11px] text-slate-400 mt-1">
                  Verifica si la variable ya fue unificada y existe en la Base de Hechos.
                </p>
              </div>
            </div>
          </section>

          {/* Operaciones sobre Colecciones */}
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
              <Code className="h-4 w-4" /> 3. Métodos de Colecciones (Pila, Cola, Lista)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-purple-400 font-bold mb-1">Pila&lt;T&gt;</div>
                <ul className="space-y-1 font-sans text-slate-400">
                  <li><code>push(elem)</code>: apila elemento</li>
                  <li><code>pop()</code>: desapila del tope</li>
                  <li><code>vacia()</code>: true si no hay items</li>
                  <li><code>length()</code>: tamaño actual</li>
                </ul>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-cyan-400 font-bold mb-1">Cola&lt;T&gt;</div>
                <ul className="space-y-1 font-sans text-slate-400">
                  <li><code>push(elem)</code> / <code>meter()</code>: encola al final</li>
                  <li><code>pop()</code>: extrae del frente (FIFO)</li>
                  <li><code>vacia()</code>: true si no hay items</li>
                  <li><code>length()</code>: tamaño actual</li>
                </ul>
              </div>

              <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                <div className="text-blue-400 font-bold mb-1">Lista&lt;T&gt;</div>
                <ul className="space-y-1 font-sans text-slate-400">
                  <li><code>get(i)</code>: elemento en índice <code>i</code></li>
                  <li><code>length()</code>: total de elementos</li>
                  <li><code>add(elem)</code>: añade al final</li>
                  <li><code>del(elem)</code>: elimina</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Pie de modal */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex justify-end">
          <button
            onClick={onCerrar}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
