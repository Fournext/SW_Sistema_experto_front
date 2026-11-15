import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Database,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  useHechosMutations,
  useReglasMutations,
  useVariablesMutations,
} from '@/features/base-conocimiento/hooks/useBaseConocimiento';
import type {
  CrearReglaCompletaDTO,
  Hecho,
  Regla,
  Variable,
} from '@/features/base-conocimiento/types/types';
import type { SistemaExperto } from '@/features/sistemas-expertos/types/types';
import iaLocalService from '../services/iaLocalService';
import { useIALocalStore } from '../store/useIALocalStore';
import type { BorradorReglasIA } from '../types/iaLocal.types';

export interface GeneradorReglasIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseConocimientoId: number | string | undefined;
  sistema?: Pick<SistemaExperto, 'nombre' | 'descripcion'> | null;
  variables: Variable[];
  hechos: Hecho[];
  reglas: Regla[];
}

export const GeneradorReglasIAModal: React.FC<GeneradorReglasIAModalProps> = ({
  isOpen,
  onClose,
  baseConocimientoId,
  sistema,
  variables,
  hechos,
  reglas,
}) => {
  const { estado, backendActivo, progresoPct, mensajeProgreso, setModalGestorAbierto, abortarGeneracion } =
    useIALocalStore();
  const variablesMut = useVariablesMutations(baseConocimientoId);
  const hechosMut = useHechosMutations(baseConocimientoId);
  const reglasMut = useReglasMutations(baseConocimientoId);

  const [instruccion, setInstruccion] = useState('');
  const [cantidadReglas, setCantidadReglas] = useState(3);
  const [soloExistentes, setSoloExistentes] = useState(false);

  const [generando, setGenerando] = useState(false);
  const [streamParcial, setStreamParcial] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  const [borrador, setBorrador] = useState<BorradorReglasIA | null>(null);
  const [reglasMarcadas, setReglasMarcadas] = useState<Record<number, boolean>>({});
  const [varsMarcadas, setVarsMarcadas] = useState<Record<number, boolean>>({});
  const [hechosMarcados, setHechosMarcados] = useState<Record<number, boolean>>({});

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruccion.trim()) return;

    setError(null);
    setExitoMsg(null);
    setStreamParcial('');
    setGenerando(true);
    try {
      const resultado = await iaLocalService.generarBorradorReglas(
        { sistema, variables, hechos, reglas },
        instruccion.trim(),
        cantidadReglas,
        soloExistentes,
        (acumulado) => setStreamParcial(acumulado)
      );

      setBorrador(resultado);
      const rMap: Record<number, boolean> = {};
      resultado.reglas.forEach((_, idx) => {
        rMap[idx] = true;
      });
      const vMap: Record<number, boolean> = {};
      resultado.variables.forEach((v, idx) => {
        vMap[idx] = !v.yaExiste;
      });
      const hMap: Record<number, boolean> = {};
      resultado.hechos.forEach((h, idx) => {
        hMap[idx] = !h.yaExiste;
      });
      setReglasMarcadas(rMap);
      setVarsMarcadas(vMap);
      setHechosMarcados(hMap);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron generar reglas válidas. Intenta especificar más el dominio.'
      );
    } finally {
      setGenerando(false);
    }
  };

  const handleGuardarSeleccion = async () => {
    if (!borrador || !baseConocimientoId) return;
    setGuardando(true);
    setError(null);
    setExitoMsg(null);

    try {
      const mapaVars = new Map<string, string | number>();
      variables.forEach((v) => mapaVars.set(v.nombre.toLowerCase().trim(), v.id));

      const mapaHechos = new Map<string, string | number>();
      hechos.forEach((h) => mapaHechos.set(h.nombre.toLowerCase().trim(), h.id));

      // 1. Crear variables nuevas seleccionadas
      for (let i = 0; i < borrador.variables.length; i++) {
        if (!varsMarcadas[i]) continue;
        const v = borrador.variables[i];
        const key = v.nombre.toLowerCase().trim();
        if (mapaVars.has(key)) continue;

        const creada = await variablesMut.crear.mutateAsync({
          nombre: v.nombre,
          tipo: v.tipo,
          tipo_dato: v.tipo,
          valor_por_defecto: v.valor_por_defecto || '',
          descripcion: v.descripcion || '',
          es_inicial: v.es_inicial ?? true,
          pregunta: v.pregunta || '',
        });
        mapaVars.set(key, creada.id);
      }

      // 2. Crear hechos nuevos seleccionados
      for (let i = 0; i < borrador.hechos.length; i++) {
        if (!hechosMarcados[i]) continue;
        const h = borrador.hechos[i];
        const key = h.nombre.toLowerCase().trim();
        if (mapaHechos.has(key) || mapaVars.has(key)) continue;

        const creado = await hechosMut.crear.mutateAsync({
          nombre: h.nombre,
          valor: h.valor,
          tipo_dato: h.tipo_dato,
          es_inicial: h.es_inicial ?? false,
          pregunta: h.pregunta || '',
        });
        mapaHechos.set(key, creado.id);
      }

      // 3. Crear reglas seleccionadas
      let reglasGuardadas = 0;
      for (let i = 0; i < borrador.reglas.length; i++) {
        if (!reglasMarcadas[i]) continue;
        const r = borrador.reglas[i];

        const condicionesDTO = r.condiciones.map((c, cIdx) => {
          const key = c.referencia.toLowerCase().trim();
          const varId = mapaVars.get(key) ?? null;
          const hechoId = varId == null ? mapaHechos.get(key) ?? null : null;
          return {
            variable_nombre: c.referencia,
            variable_id: varId,
            hecho_id: hechoId,
            operador: c.operador === '==' ? '=' : c.operador,
            valor_esperado: c.valor_esperado,
            orden: cIdx + 1,
          };
        });

        const conclusionesDTO = r.conclusiones.map((cl) => {
          const key = cl.destino.toLowerCase().trim();
          const varId = mapaVars.get(key) ?? null;
          const hechoId = varId == null ? mapaHechos.get(key) ?? null : null;
          return {
            variable_nombre: cl.destino,
            variable_resultante_id: varId,
            hecho_resultante_id: hechoId,
            valor_resultante: cl.valor_resultante,
          };
        });

        const payload: CrearReglaCompletaDTO = {
          nombre: r.nombre,
          descripcion: r.descripcion,
          prioridad: r.prioridad,
          factor_certeza: r.factor_certeza,
          activa: true,
          condiciones: condicionesDTO,
          conclusiones: conclusionesDTO,
        };

        await reglasMut.crearCompleta.mutateAsync(payload);
        reglasGuardadas++;
      }

      setExitoMsg(`Se incorporaron ${reglasGuardadas} regla(s) a la Base de Conocimiento.`);
      setTimeout(() => {
        onClose();
        setBorrador(null);
        setExitoMsg(null);
      }, 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al guardar las reglas generadas en el backend.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asistente de Diseño de Reglas (IA Local)"
      description="Genera variables, hechos y reglas IF-THEN directamente en tu navegador sin enviar la base de conocimiento a APIs externas."
      size="xl"
    >
      <div className="space-y-5">
        <form onSubmit={handleGenerar} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Describe el conocimiento experto o las reglas que deseas modelar
            </label>
            <textarea
              rows={3}
              value={instruccion}
              onChange={(e) => setInstruccion(e.target.value)}
              placeholder="Ej: Genera reglas para diagnosticar fallas de conectividad en un router doméstico evaluando estado_luces, ping_gateway y resolucion_dns..."
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
              disabled={generando || guardando}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-700">
              <label className="flex items-center gap-2 font-medium">
                <span>Cantidad de reglas:</span>
                <select
                  value={cantidadReglas}
                  onChange={(e) => setCantidadReglas(Number(e.target.value))}
                  disabled={generando || guardando}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1 font-mono text-xs"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloExistentes}
                  onChange={(e) => setSoloExistentes(e.target.checked)}
                  disabled={generando || guardando}
                  className="rounded border-stone-300 text-teal-700 focus:ring-teal-600"
                />
                <span>Usar solo variables/hechos existentes ({variables.length + hechos.length})</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalGestorAbierto(true)}
                className="text-xs font-mono text-stone-500 hover:text-teal-800 underline cursor-pointer"
              >
                {estado === 'listo' ? 'Cambiar modelo' : 'Configurar modelo'}
              </button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={generando}
                disabled={!instruccion.trim() || guardando}
                icon={<Cpu className="w-4 h-4" />}
              >
                {generando
                  ? estado === 'descargando'
                    ? `Cargando IA (${progresoPct}%)`
                    : 'Generando borrador...'
                  : 'Generar Borrador'}
              </Button>
            </div>
          </div>
        </form>

        {generando && (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-stone-800">
                {estado === 'descargando'
                  ? `Preparando modelo (${backendActivo === 'cpu' ? 'RAM' : 'GPU'} · ${progresoPct}%)`
                  : `Generando respuesta (${backendActivo === 'cpu' ? 'RAM/CPU' : 'GPU'}) · ${streamParcial.length} caracteres`}
              </span>
              {estado === 'generando' && (
                <button
                  type="button"
                  onClick={() => abortarGeneracion()}
                  className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer"
                >
                  Detener
                </button>
              )}
            </div>
            {estado === 'descargando' && (
              <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-teal-700 transition-all duration-300"
                  style={{ width: `${progresoPct}%` }}
                />
              </div>
            )}
            <p className="text-[11px] font-mono text-stone-500 truncate">
              {estado === 'descargando'
                ? mensajeProgreso
                : streamParcial
                ? streamParcial.slice(-140)
                : 'Procesando prompt inicial (en CPU puede tardar unos segundos antes del primer token)...'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {exitoMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exitoMsg}</span>
          </div>
        )}

        {borrador && (
          <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1 border-t border-stone-200 pt-4">
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950">
              <strong className="font-semibold">Síntesis de diseño: </strong>
              {borrador.resumen}
            </div>

            {/* Variables nuevas propuestas */}
            {borrador.variables.filter((v) => !v.yaExiste).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
                  Variables nuevas sugeridas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {borrador.variables.map((v, idx) =>
                    v.yaExiste ? null : (
                      <label
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer hover:border-teal-300"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(varsMarcadas[idx])}
                          onChange={(e) =>
                            setVarsMarcadas((prev) => ({ ...prev, [idx]: e.target.checked }))
                          }
                          className="mt-0.5 rounded border-stone-300 text-teal-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-stone-900">{v.nombre}</span>
                            <Badge variant="neutral" size="sm">
                              {v.tipo}
                            </Badge>
                          </div>
                          {v.descripcion && (
                            <p className="text-[11px] text-stone-500 mt-0.5">{v.descripcion}</p>
                          )}
                        </div>
                      </label>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Hechos nuevos propuestos */}
            {borrador.hechos.filter((h) => !h.yaExiste).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-700" />
                  Hechos nuevos sugeridos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {borrador.hechos.map((h, idx) =>
                    h.yaExiste ? null : (
                      <label
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer hover:border-amber-300"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(hechosMarcados[idx])}
                          onChange={(e) =>
                            setHechosMarcados((prev) => ({ ...prev, [idx]: e.target.checked }))
                          }
                          className="mt-0.5 rounded border-stone-300 text-teal-700"
                        />
                        <div>
                          <span className="font-mono font-bold text-stone-900">
                            {h.nombre} = {h.valor}
                          </span>
                          <span className="ml-2 text-[10px] font-mono text-stone-500">
                            [{h.tipo_dato}]
                          </span>
                        </div>
                      </label>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Reglas propuestas */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-teal-700" />
                Reglas IF - THEN propuestas ({borrador.reglas.length})
              </h4>
              {borrador.reglas.map((r, idx) => (
                <label
                  key={idx}
                  className={`block p-3.5 rounded-xl border transition-all cursor-pointer ${
                    reglasMarcadas[idx]
                      ? 'border-teal-300 bg-white shadow-2xs'
                      : 'border-stone-200 bg-stone-50/70 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={Boolean(reglasMarcadas[idx])}
                        onChange={(e) =>
                          setReglasMarcadas((prev) => ({ ...prev, [idx]: e.target.checked }))
                        }
                        className="rounded border-stone-300 text-teal-700"
                      />
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                        {r.nombre}
                      </span>
                      <span className="text-xs text-stone-600">{r.descripcion}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500 shrink-0">
                      <span>P:{r.prioridad}</span>
                      <span>·</span>
                      <span>FC:{(r.factor_certeza * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="pt-2.5 font-mono text-xs space-y-1.5">
                    {r.condiciones.map((c, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {cIdx === 0 ? 'IF' : 'AND'}
                        </span>
                        <span className="text-stone-900 font-semibold">{c.referencia}</span>
                        <span className="text-amber-700 font-bold">{c.operador}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-950 font-bold">
                          {c.valor_esperado}
                        </span>
                      </div>
                    ))}
                    {r.conclusiones.map((cl, clIdx) => (
                      <div key={clIdx} className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-950 border border-teal-300">
                          {clIdx === 0 ? 'THEN' : 'AND'}
                        </span>
                        <span className="text-stone-900 font-semibold">{cl.destino}</span>
                        <span className="text-teal-700 font-bold">=</span>
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-950 font-bold">
                          {cl.valor_resultante}
                        </span>
                      </div>
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          {borrador && (
            <Button
              variant="primary"
              loading={guardando}
              disabled={Object.values(reglasMarcadas).every((v) => !v)}
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => void handleGuardarSeleccion()}
            >
              Guardar en Base de Conocimiento
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GeneradorReglasIAModal;

