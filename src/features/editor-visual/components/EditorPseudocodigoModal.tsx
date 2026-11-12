import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Code2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  HelpCircle,
  Workflow,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import baseConocimientoService from '@/features/base-conocimiento/services/baseConocimientoService';
import type {
  Regla,
  Variable,
  TipoDato,
  CondicionItemInput,
  ConclusionItemInput,
} from '@/features/base-conocimiento/types/types';
import {
  parsearPseudocodigo,
  generarPseudocodigo,
  type ResultadoParseo,
} from '../utils/parserPseudocodigo';

export interface EditorPseudocodigoModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseConocimientoId: string | number;
  reglasActuales: Regla[];
  variablesExistentes: Variable[];
  onReglasActualizadas: () => Promise<void> | void;
}

export const EditorPseudocodigoModal: React.FC<EditorPseudocodigoModalProps> = ({
  isOpen,
  onClose,
  baseConocimientoId,
  reglasActuales = [],
  variablesExistentes = [],
  onReglasActualizadas,
}) => {
  const [codigo, setCodigo] = useState('');
  const [resultadoParseo, setResultadoParseo] = useState<ResultadoParseo>({
    exito: true,
    reglas: [],
    errores: [],
  });
  const [compilando, setCompilando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [panelAyudaAbierto, setPanelAyudaAbierto] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Inicializar el código al abrir con las reglas actuales de la base
  useEffect(() => {
    if (isOpen) {
      const inicial = generarPseudocodigo(reglasActuales, variablesExistentes);
      setCodigo(inicial);
      const parseado = parsearPseudocodigo(inicial);
      setResultadoParseo(parseado);
      setMensajeExito(null);
    }
  }, [isOpen, reglasActuales, variablesExistentes]);

  // Validar en tiempo real cuando cambia el texto
  const handleCodigoChange = (nuevoTexto: string) => {
    setCodigo(nuevoTexto);
    const parseado = parsearPseudocodigo(nuevoTexto);
    setResultadoParseo(parseado);
    setMensajeExito(null);
  };

  // Manejar indentación con la tecla Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const espacios = '  ';

      const nuevoValor =
        textarea.value.substring(0, start) +
        espacios +
        textarea.value.substring(end);

      handleCodigoChange(nuevoValor);

      // Reubicar cursor después de la tabulación
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + espacios.length;
      }, 0);
    }
  };

  // Sincronizar scroll entre el gutter de números de línea y el textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Copiar código al portapapeles
  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Ignorar fallo de portapapeles
    }
  };

  // Insertar texto en la posición del cursor
  const insertarTexto = (textoAInsertar: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      handleCodigoChange(codigo + '\n' + textoAInsertar);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nuevoValor =
      codigo.substring(0, start) +
      textoAInsertar +
      codigo.substring(end);

    handleCodigoChange(nuevoValor);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textoAInsertar.length;
    }, 0);
  };

  // Insertar plantilla de nueva regla
  const insertarPlantilla = () => {
    const siguienteNum = (resultadoParseo.reglas.length || 0) + 1;
    const plantilla = `\nREGLA R${siguienteNum} [Prioridad: 10]:\n  SI X = 0\n  ENTONCES P = a\n`;
    insertarTexto(plantilla);
  };

  // Detectar tipo de dato para variables creadas al vuelo
  const inferirTipoDato = (valor: string): TipoDato => {
    const trimmed = valor.trim().toLowerCase();
    if (['true', 'false', 'si', 'no', 'sí', 'verdadero', 'falso'].includes(trimmed)) {
      return 'BOOLEANO';
    }
    if (trimmed !== '' && !isNaN(Number(trimmed))) {
      return trimmed.includes('.') ? 'DECIMAL' : 'ENTERO';
    }
    return 'TEXTO';
  };

  // Compilar y guardar todas las reglas en la Base de Conocimiento
  const handleCompilarYAplicar = async () => {
    const parseado = parsearPseudocodigo(codigo);
    if (!parseado.exito || parseado.reglas.length === 0) {
      return;
    }

    setCompilando(true);
    setMensajeExito(null);

    try {
      // 1. Identificar todas las variables mencionadas en el pseudocódigo
      const varsMencionadas = new Map<string, TipoDato>();
      parseado.reglas.forEach((r) => {
        r.condiciones.forEach((c) => {
          if (!varsMencionadas.has(c.variable_nombre)) {
            varsMencionadas.set(c.variable_nombre, inferirTipoDato(c.valor_esperado));
          }
        });
        r.conclusiones.forEach((conc) => {
          if (!varsMencionadas.has(conc.variable_nombre)) {
            varsMencionadas.set(conc.variable_nombre, inferirTipoDato(conc.valor_resultante));
          }
        });
      });

      // 2. Crear variables que aún no existan en la Base de Conocimiento
      const varsExistentesMap = new Map<string, Variable>();
      variablesExistentes.forEach((v) => {
        varsExistentesMap.set(v.nombre.trim().toLowerCase(), v);
      });

      for (const [nombreVar, tipoInferred] of varsMencionadas.entries()) {
        const norm = nombreVar.trim().toLowerCase();
        if (!varsExistentesMap.has(norm)) {
          try {
            const nuevaVar = await baseConocimientoService.crearVariable(baseConocimientoId, {
              nombre: nombreVar.trim(),
              tipo: tipoInferred,
              tipo_dato: tipoInferred,
              descripcion: `Variable creada automáticamente desde el editor de pseudocódigo`,
            });
            varsExistentesMap.set(norm, nuevaVar);
          } catch {
            // Continuar si la variable ya existía o fue creada en paralelo
          }
        }
      }

      // 3. Crear o actualizar cada regla parseada
      const reglasExistentesMap = new Map<string, Regla>();
      reglasActuales.forEach((r) => {
        reglasExistentesMap.set(r.nombre.trim().toLowerCase(), r);
      });

      let creadasOActualizadas = 0;

      for (const rParseada of parseado.reglas) {
        const condsPayload: CondicionItemInput[] = rParseada.condiciones.map((c) => ({
          variable_nombre: c.variable_nombre,
          operador: c.operador,
          valor_esperado: c.valor_esperado,
          tipo_dato: inferirTipoDato(c.valor_esperado),
        }));

        const concsPayload: ConclusionItemInput[] = rParseada.conclusiones.map((conc) => ({
          variable_nombre: conc.variable_nombre,
          valor_resultante: conc.valor_resultante,
          tipo_dato: inferirTipoDato(conc.valor_resultante),
        }));

        const reglaExistente = reglasExistentesMap.get(rParseada.nombre.trim().toLowerCase());

        if (reglaExistente?.id) {
          // Actualizar regla completa existente
          await baseConocimientoService.actualizarReglaCompleta(reglaExistente.id, {
            nombre: rParseada.nombre.trim(),
            prioridad: rParseada.prioridad,
            descripcion: rParseada.descripcion || undefined,
            activa: true,
            expresion_logica: rParseada.expresion_logica,
            condiciones: condsPayload,
            conclusiones: concsPayload,
          });
        } else {
          // Crear nueva regla completa
          await baseConocimientoService.crearReglaCompleta(baseConocimientoId, {
            nombre: rParseada.nombre.trim(),
            prioridad: rParseada.prioridad,
            descripcion: rParseada.descripcion || undefined,
            activa: true,
            expresion_logica: rParseada.expresion_logica,
            condiciones: condsPayload,
            conclusiones: concsPayload,
          });
        }

        creadasOActualizadas++;
      }

      setMensajeExito(`¡Se compilaron y sincronizaron ${creadasOActualizadas} regla(s) en el lienzo correctamente!`);

      // Refrescar los nodos y la base de conocimiento en la vista visual
      await onReglasActualizadas();

      // Cerrar modal automáticamente tras una breve confirmación
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { mensaje?: string; error?: string } } };
      const mensaje =
        errObj?.response?.data?.mensaje ||
        errObj?.response?.data?.error ||
        'Error al compilar y guardar las reglas. Verifica la sintaxis.';
      setResultadoParseo((prev) => ({
        ...prev,
        exito: false,
        errores: [{ linea: 1, mensaje }],
      }));
    } finally {
      setCompilando(false);
    }
  };

  if (!isOpen) return null;

  const totalLineas = Math.max(codigo.split('\n').length, 12);
  const numerosLinea = Array.from({ length: totalLineas }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden text-left">
        {/* Cabecera del Editor */}
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-2xs font-mono">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  Editor de Reglas (Pseudocódigo / DSL)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {resultadoParseo.reglas.length} regla(s)
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Escribe o pega tus reglas usando notación natural (<code className="text-stone-700 font-mono">SI... ENTONCES...</code> o <code className="text-stone-700 font-mono">IF... THEN...</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={insertarPlantilla}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Insertar plantilla de regla"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>+ Plantilla</span>
            </button>

            <button
              type="button"
              onClick={handleCopiar}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Copiar pseudocódigo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelAyudaAbierto(!panelAyudaAbierto)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                panelAyudaAbierto
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'
              }`}
              title="Mostrar panel de ayuda y sintaxis"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={compilando}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Editor: Área de Código + Asistente Lateral */}
        <div className="flex-1 flex min-h-0 relative bg-slate-950 text-slate-100">
          {/* Números de línea */}
          <div
            ref={gutterRef}
            className="w-12 py-3 bg-slate-900 border-r border-slate-800 text-right pr-3 select-none overflow-hidden font-mono text-xs text-slate-500 leading-6 shrink-0"
          >
            {numerosLinea.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>

          {/* Área de texto de código */}
          <div className="flex-1 relative flex flex-col">
            <textarea
              ref={textareaRef}
              value={codigo}
              onChange={(e) => handleCodigoChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              placeholder="R1: IF X = 0 THEN P = a..."
              className="w-full h-full p-3 bg-transparent text-slate-100 font-mono text-xs sm:text-sm leading-6 resize-none focus:outline-hidden selection:bg-teal-500/30 selection:text-teal-200"
            />
          </div>

          {/* Panel Lateral de Ayuda / Asistente (Colapsable) */}
          {panelAyudaAbierto && (
            <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto text-xs space-y-4 shrink-0 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Asistente de Sintaxis
                </span>
                <button
                  type="button"
                  onClick={() => setPanelAyudaAbierto(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Variables existentes clicables */}
              <div>
                <p className="font-semibold text-slate-200 mb-1.5">Variables en la BC:</p>
                {variablesExistentes.length === 0 ? (
                  <p className="text-slate-500 italic">No hay variables aún. Puedes escribir cualquier nombre y se creará automáticamente.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {variablesExistentes.map((v) => (
                      <button
                        key={v.id || v.nombre}
                        type="button"
                        onClick={() => insertarTexto(v.nombre)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 hover:bg-teal-900/40 hover:text-teal-200 border border-slate-700 transition-colors font-mono cursor-pointer"
                        title={`Insertar ${v.nombre} en el código`}
                      >
                        {v.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ejemplos de Sintaxis */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <p className="font-semibold text-slate-200 mb-1">Formato Cuaderno (1 línea):</p>
                  <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-teal-300 border border-slate-800 overflow-x-auto">
                    {`R1) IF X = 0 THEN P = a\nR2: IF H != a THEN X = 20\nR3: IF X > 10 THEN Z = 0`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-slate-200 mb-1">Formato Bloque Estructurado:</p>
                  <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-teal-300 border border-slate-800 overflow-x-auto">
                    {`REGLA R1 [Prioridad: 10]:\n  SI X > 0 Y Z = 0\n  ENTONCES P = a`}
                  </pre>
                </div>

                <div>
                  <p className="font-semibold text-slate-200 mb-1">Operadores Válidos:</p>
                  <p className="font-mono text-slate-400">= , != , &gt; , &lt; , &gt;= , &lt;=</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Estado y Errores de Validación */}
        <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            {mensajeExito ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {mensajeExito}
              </span>
            ) : resultadoParseo.exito ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sintaxis correcta: {resultadoParseo.reglas.length} regla(s) lista(s) para sincronizar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {resultadoParseo.errores[0]
                    ? `Línea ${resultadoParseo.errores[0].linea}: ${resultadoParseo.errores[0].mensaje}`
                    : 'Error en la sintaxis del pseudocódigo'}
                </span>
              </span>
            )}
          </div>

          {/* Acciones de pie */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={compilando}
              className="text-stone-700 border-stone-300"
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCompilarYAplicar}
              disabled={compilando || !resultadoParseo.exito || resultadoParseo.reglas.length === 0}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-2 shadow-sm"
            >
              {compilando ? <Spinner size="sm" /> : <Workflow className="w-3.5 h-3.5" />}
              <span>{compilando ? 'Compilando...' : 'Compilar y Sincronizar con Lienzo'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPseudocodigoModal;
