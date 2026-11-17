import React, { useState } from 'react';
import {
  BookMarked,
  X,
  Code,
  Terminal,
  CheckCircle2,
  Sparkles,
  Database,
  Boxes,
} from 'lucide-react';

interface AyudaLenguajeModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

type TabKey = 'funciones' | 'dominio' | 'colecciones' | 'control';

export const AyudaLenguajeModal: React.FC<AyudaLenguajeModalProps> = ({
  abierto,
  onCerrar,
}) => {
  const [tabActiva, setTabActiva] = useState<TabKey>('funciones');

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[92vh] flex flex-col ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shadow-inner">
              <BookMarked className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Guía Oficial del Lenguaje de Inferencia (Java SE-1)
                </h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Totalmente Actualizada
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Catálogo completo de funciones nativas predefinidas, objetos de dominio, tipos de datos y estructuras de control.
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de pestañas */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pt-3 pb-2 text-xs font-medium">
          <button
            onClick={() => setTabActiva('funciones')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tabActiva === 'funciones'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>1. Funciones Nativas (Built-ins)</span>
          </button>

          <button
            onClick={() => setTabActiva('dominio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tabActiva === 'dominio'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>2. Reglas, Hechos & Variables</span>
          </button>

          <button
            onClick={() => setTabActiva('colecciones')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tabActiva === 'colecciones'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>3. Tipos & Colecciones (Pila/Cola/Lista)</span>
          </button>

          <button
            onClick={() => setTabActiva('control')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tabActiva === 'control'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>4. Estructuras & Operadores</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 text-xs text-slate-300">
          {/* TAB 1: FUNCIONES NATIVAS (BUILT-INS) */}
          {tabActiva === 'funciones' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-3 text-xs text-indigo-300 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-100">Disponibles de inmediato:</span> Todas estas funciones ya están implementadas en el motor. No necesitas definirlas ni escribirlas en tu código; puedes llamarlas directamente.
                </div>
              </div>

              {/* Inferencia de reglas */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Inferencia y Disparo de Reglas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-emerald-400 font-bold text-[11px]">
                      Hecho Disparar(Regla r, BaseHechos BH)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Evalúa las premisas de la regla contra la Base de Hechos. Si se cumplen todas, genera y devuelve el <code>Hecho</code> derivado de su conclusión. Si no se cumplen, retorna <code>null</code>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-emerald-400 font-bold text-[11px]">
                      Hecho[] DispararTodos(Regla r, BaseHechos BH)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Evalúa la regla y retorna un arreglo con todos los hechos derivados de sus conclusiones (cuando tiene múltiples conclusiones).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-cyan-400 font-bold text-[11px]">
                      boolean marcada(Regla r | Variable v)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Retorna <code>true</code> si la regla o variable ya fue marcada como activada o consultada (polimórfica: admite tanto Regla como Variable).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-cyan-400 font-bold text-[11px]">
                      void Marcar(Regla r | Variable v) / marcar(...)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Marca la regla o variable en la memoria del motor (se puede escribir con mayúscula o minúscula).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 md:col-span-2">
                    <div className="font-mono text-cyan-400 font-bold text-[11px]">
                      void DesmarcarReglas() o DesmarcarReglas(Regla[] R)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Limpia la marca de todas las reglas para iniciar una pasada o corrida limpia sin marcas previas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Variables y Consulta al Cliente */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                  Marcado de Variables y Consulta al Cliente (Ejercicios 7 y 8)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      void DesmarcarVariables()
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Reinicia el registro de variables preguntadas, permitiendo que una nueva corrida de inferencia comience con el cuestionario limpio.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      void MarcarVariablesDeLaBH()
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Marca de inmediato todas las variables que ya tienen hechos en la BH inicial para que el sistema nunca le pregunte al cliente por datos ya conocidos.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      Hecho Preguntar(String texto, Variable v) / Pregunta(...)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Suspende la ejecución, abre el modal de consulta interactiva para el usuario y retorna el <code>Hecho</code> con la respuesta.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      Variable getVarPremisa(Regla r) o r.getVarPremisa()
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Extrae la variable correspondiente a la premisa atómica de la regla.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      boolean Consultada(Variable v)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Retorna <code>true</code> si la variable ya fue consultada previamente al cliente en la corrida.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      boolean HechoNativo(Variable v)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Retorna <code>true</code> si la variable es nativa (es decir, una variable de entrada preguntable al cliente).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 md:col-span-2">
                    <div className="font-mono text-amber-400 font-bold text-[11px]">
                      Lista&lt;Variable&gt; ObtenerHechosNativos(Regla[] R)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Extrae y retorna una lista con todas las variables nativas involucradas en las premisas de las reglas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metas, Trazas y Salida */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                  Metas, Trazas y Consola
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-purple-400 font-bold text-[11px]">
                      boolean TodasUnificadas(BaseHechos BH, Lista&lt;Variable&gt; metas)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Retorna <code>true</code> si todas las variables meta de la lista ya tienen un hecho unificado en la <code>BH</code>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-purple-400 font-bold text-[11px]">
                      void MostrarMeta(Variable meta, BaseHechos BH)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Imprime en la consola el valor alcanzado para la meta o notifica que no fue alcanzada.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-purple-400 font-bold text-[11px]">
                      void RegistrarPasada(int pasada)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Registra el evento de inicio de una nueva pasada de inferencia en el historial de eventos del laboratorio.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-purple-400 font-bold text-[11px]">
                      void MostrarLosHechosDisparados(BaseHechos BH)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Imprime en la consola de salida el listado de todos los hechos derivados presentes en la Base de Hechos.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 md:col-span-2">
                    <div className="font-mono text-purple-400 font-bold text-[11px]">
                      void println(String msg) / print(msg) / Mostrar(msg)
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Imprime un mensaje en la terminal de texto de la simulación. Admite concatenación con <code>+</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OBJETOS DE DOMINIO (REGLAS, HECHOS, VARIABLES, BH) */}
          {tabActiva === 'dominio' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 text-xs text-blue-300">
                A continuación se detallan todas las propiedades, campos y métodos disponibles para cada objeto del Sistema Experto.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                {/* Objeto Regla */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                  <div className="font-bold text-blue-400 text-xs flex items-center justify-between">
                    <span>Objeto: Regla (r)</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 font-sans">Dominio</span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Representa una regla de la Base de Conocimiento con sus condiciones y conclusiones.
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-sans">
                    <li>
                      <code className="text-cyan-300 font-mono">r.nombre</code>: Identificador legible de la regla (ej: <code>"R1"</code>, <code>"R2"</code>).
                    </li>
                    <li>
                      <code className="text-cyan-300 font-mono">r.marcada</code>: Booleano que indica si la regla ya disparó (lectura y escritura).
                    </li>
                    <li>
                      <code className="text-cyan-300 font-mono">r.orden</code> / <code className="text-cyan-300 font-mono">r.prioridad</code>: Número entero de orden o prioridad en la BC.
                    </li>
                    <li>
                      <code className="text-emerald-300 font-mono">r.getVarPremisa()</code>: Método que retorna la <code>Variable</code> de la premisa atómica.
                    </li>
                    <li>
                      <code className="text-emerald-300 font-mono">r.getNombre()</code>: Retorna el nombre en texto de la regla.
                    </li>
                  </ul>
                  <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 font-sans">
                    <span className="font-semibold text-slate-200">Funciones directas:</span> <code>Disparar(r, BH)</code>, <code>marcar(r)</code>, <code>marcada(r)</code>, <code>VariablesPremisa(r)</code>.
                  </div>
                </div>

                {/* Objeto Variable */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                  <div className="font-bold text-amber-400 text-xs flex items-center justify-between">
                    <span>Objeto: Variable (v)</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-sans">Dominio</span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Representa un atributo o variable del sistema (nativa, intermedia o meta).
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-sans">
                    <li>
                      <code className="text-amber-300 font-mono">v.nombre</code>: Nombre de la variable (ej: <code>"Fiebre"</code>, <code>"Tos"</code>).
                    </li>
                    <li>
                      <code className="text-amber-300 font-mono">v.tipo_dato</code>: Tipo de dato esperado (<code>"TEXTO"</code>, <code>"NUMERICO"</code>, <code>"BOOLEANO"</code>).
                    </li>
                    <li>
                      <code className="text-amber-300 font-mono">v.es_nativa</code>: <code>true</code> si es un hecho nativo (preguntable al usuario).
                    </li>
                    <li>
                      <code className="text-amber-300 font-mono">v.marcada</code>: <code>true</code> si ya fue consultada al cliente.
                    </li>
                    <li>
                      <code className="text-emerald-300 font-mono">v.getNombre()</code>: Retorna el nombre en texto de la variable.
                    </li>
                  </ul>
                  <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 font-sans">
                    <span className="font-semibold text-slate-200">Funciones directas:</span> <code>marcar(v)</code>, <code>marcada(v)</code>, <code>Consultada(v)</code>, <code>HechoNativo(v)</code>, <code>Preguntar("...", v)</code>.
                  </div>
                </div>

                {/* Objeto Hecho */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                  <div className="font-bold text-emerald-400 text-xs flex items-center justify-between">
                    <span>Objeto: Hecho (h)</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-sans">Dominio</span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Representa la unificación de una variable con su valor concreto asignado.
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-sans">
                    <li>
                      <code className="text-emerald-300 font-mono">h.variable</code>: Nombre en texto de la variable asociada.
                    </li>
                    <li>
                      <code className="text-emerald-300 font-mono">h.valor</code>: Valor unificado (ej: <code>"Si"</code>, <code>"38.5"</code>).
                    </li>
                    <li>
                      <code className="text-emerald-300 font-mono">h.tipo_dato</code>: Tipo de dato del valor.
                    </li>
                    <li>
                      <code className="text-cyan-300 font-mono">h.getVar()</code>: Retorna el objeto <code>Variable</code> vinculado.
                    </li>
                    <li>
                      <code className="text-cyan-300 font-mono">h.getValorTexto()</code>: Retorna el valor formateado como String.
                    </li>
                    <li>
                      <code className="text-cyan-300 font-mono">h.getValorNumero()</code>: Retorna el valor numérico (double).
                    </li>
                  </ul>
                  <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 font-sans">
                    <span className="font-semibold text-slate-200">Operaciones típicas:</span> <code>BH.add(h)</code>, <code>if (h != null)</code>, <code>if (h == null)</code>.
                  </div>
                </div>

                {/* Objeto BaseHechos */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                  <div className="font-bold text-purple-400 text-xs flex items-center justify-between">
                    <span>Objeto: BaseHechos (BH)</span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 font-sans">Memoria</span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Memoria de trabajo que contiene todos los hechos afirmados o derivados.
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-sans">
                    <li>
                      <code className="text-purple-300 font-mono">BH.add(h)</code>: Incorpora el hecho a la BH. Retorna <code>true</code> si fue añadido.
                    </li>
                    <li>
                      <code className="text-purple-300 font-mono">BH.contains(v)</code>: Retorna <code>true</code> si la variable ya tiene un hecho en la BH.
                    </li>
                    <li>
                      <code className="text-purple-300 font-mono">BH.get(v)</code>: Retorna el <code>Hecho</code> asociado a la variable en la BH.
                    </li>
                    <li>
                      <code className="text-purple-300 font-mono">BH.length()</code> o <code className="text-purple-300 font-mono">BH.length</code>: Cantidad de hechos en la BH.
                    </li>
                  </ul>
                  <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 font-sans">
                    <span className="font-semibold text-slate-200">Funciones directas:</span> <code>MarcarVariablesDeLaBH(BH)</code>, <code>MostrarLosHechosDisparados(BH)</code>, <code>TodasUnificadas(BH, metas)</code>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIPOS Y COLECCIONES */}
          {tabActiva === 'colecciones' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Primitivos */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Tipos Primitivos y Arreglos
                  </h4>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                    <li><span className="text-amber-400">int</span>: Enteros (contadores, pasadas, índices). Ej: <code>int pasada = 1;</code></li>
                    <li><span className="text-amber-400">double</span>: Números de punto flotante. Ej: <code>double temp = 38.5;</code></li>
                    <li><span className="text-amber-400">boolean</span>: Valores de verdad: <code>true</code> o <code>false</code>.</li>
                    <li><span className="text-amber-400">String</span>: Cadenas de texto. Concatenación con <code>+</code>.</li>
                    <li><span className="text-amber-400">null</span>: Referencia nula para comprobar si una regla disparó o si una cola/pila está vacía.</li>
                    <li><span className="text-amber-400">Tipo[]</span>: Arreglos nativos con longitud <code>arr.length</code> y corchetes <code>arr[i]</code>.</li>
                  </ul>
                </div>

                {/* Resumen de Dominio */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" /> Colecciones Genéricas
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Las colecciones permiten almacenar cualquier tipo: <code>Cola&lt;Regla&gt;</code>, <code>Pila&lt;Variable&gt;</code>, <code>Lista&lt;Hecho&gt;</code>, etc.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Instanciación con operador <code>new</code>:
                  </p>
                  <pre className="bg-slate-900 p-2 rounded text-[10px] text-indigo-300 font-mono border border-slate-800">
{`Cola<Regla> Q = new Cola<Regla>();
Pila<Variable> HN = new Pila<Variable>();
Lista<Variable> metas = new Lista<Variable>();`}
                  </pre>
                </div>
              </div>

              {/* Colecciones Dinámicas */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <h4 className="font-bold text-slate-200 text-xs">
                  Métodos de Colecciones Dinámicas (Pila, Cola y Lista)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                  {/* Pila */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <div className="text-purple-400 font-bold mb-1.5 text-xs">Pila&lt;T&gt; (LIFO)</div>
                    <p className="font-sans text-[11px] text-slate-400 mb-2">Pila de Hechos Nativos (Ej. 8).</p>
                    <ul className="space-y-1 text-slate-300">
                      <li><code>push(elem)</code>: Apila elemento al tope.</li>
                      <li><code>pop()</code>: Desapila y retorna el tope.</li>
                      <li><code>vacia()</code>: true si no tiene elementos.</li>
                      <li><code>length()</code>: Cantidad de elementos.</li>
                    </ul>
                  </div>

                  {/* Cola */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <div className="text-cyan-400 font-bold mb-1.5 text-xs">Cola&lt;T&gt; (FIFO)</div>
                    <p className="font-sans text-[11px] text-slate-400 mb-2">Cola Q de Reglas (Ej. 13).</p>
                    <ul className="space-y-1 text-slate-300">
                      <li><code>meter(elem)</code>: Encola al final.</li>
                      <li><code>pop()</code>: Desencola el primer elemento.</li>
                      <li><code>vacia()</code>: true si está vacía.</li>
                      <li><code>length()</code>: Cantidad encolada.</li>
                    </ul>
                  </div>

                  {/* Lista */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                    <div className="text-blue-400 font-bold mb-1.5 text-xs">Lista&lt;T&gt; (Indexada)</div>
                    <p className="font-sans text-[11px] text-slate-400 mb-2">Listas de Metas y Hechos.</p>
                    <ul className="space-y-1 text-slate-300">
                      <li><code>add(elem)</code>: Añade al final.</li>
                      <li><code>get(i)</code>: Elemento en índice i.</li>
                      <li><code>del(elem)</code>: Elimina elemento.</li>
                      <li><code>contains(elem)</code>: Verifica existencia.</li>
                      <li><code>vacia()</code>: true si está vacía.</li>
                      <li><code>length()</code>: Cantidad de elementos.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ESTRUCTURAS DE CONTROL & EJEMPLOS */}
          {tabActiva === 'control' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <div className="font-bold text-slate-200 text-xs font-sans">
                  Ejemplo Canónico: FWC con getReglaNoMarcada y Marcado de Variables
                </div>
                <pre className="text-indigo-300 overflow-x-auto bg-slate-900 p-3 rounded-lg border border-slate-800">
{`Regla getReglaNoMarcada(Regla[] R) {
    for (int i = 0; i < R.length; i++) {
        if (!marcada(R[i])) {
            Variable v = R[i].getVarPremisa();
            if (!marcada(v)) {
                return R[i];
            }
        }
    }
    return null;
}

void FWC(Regla[] R, BaseHechos BH) {
    DesmarcarReglas();
    DesmarcarVariables();
    MarcarVariablesDeLaBH();
    
    int pasada = 0;
    while (true) {
        pasada++;
        RegistrarPasada(pasada);
        
        int antes = BH.length();
        
        // Consulta previa a la primera regla no marcada
        Regla r = getReglaNoMarcada(R);
        if (r != null) {
            Variable v = r.getVarPremisa();
            if (!marcada(v)) {
                Hecho h = Preguntar("¿Valor de " + v.nombre + "?", v);
                marcar(v);
                if (h != null) {
                    BH.add(h);
                }
            }
        }
        
        FWCPasada(R, BH);
        
        if (antes == BH.length()) {
            break; // Condición de parada de punto fijo
        }
    }
    MostrarLosHechosDisparados(BH);
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5">
                  <span className="font-bold text-slate-200">Ciclos y Bucles:</span>
                  <ul className="list-disc pl-4 text-slate-400 space-y-1 text-[11px]">
                    <li><code>for (int i = 0; i &lt; R.length; i++) &#123; ... &#125;</code></li>
                    <li><code>while (condición) &#123; ... &#125;</code> o bucles infinitos con <code>while (true)</code></li>
                    <li>Control de flujo con <code>break;</code> y <code>continue;</code>.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5">
                  <span className="font-bold text-slate-200">Condicionales y Operadores:</span>
                  <ul className="list-disc pl-4 text-slate-400 space-y-1 text-[11px]">
                    <li><code>if (condición) &#123; ... &#125; else &#123; ... &#125;</code></li>
                    <li>Comparación: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code></li>
                    <li>Lógica booleana: <code>&&</code> (o <code>^</code> / <code>∧</code>), <code>||</code>, <code>!</code></li>
                    <li>Aritmética básica: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code>, <code>++</code>, <code>--</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Máquina Virtual Java SE-1 • Laboratorio de Algoritmos
          </p>
          <button
            onClick={onCerrar}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
