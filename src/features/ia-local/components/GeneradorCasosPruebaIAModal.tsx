import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type {
  Hecho,
  Regla,
  Variable,
} from '@/features/base-conocimiento/types/types';
import type { SistemaExperto } from '@/features/sistemas-expertos/types/types';
import type { HechoVectorItem } from '@/features/inferencia/components/BarraVectorHechos';
import iaLocalService from '../services/iaLocalService';
import { useIALocalStore } from '../store/useIALocalStore';
import type { CasoPruebaGeneradoIA } from '../types/iaLocal.types';

export interface GeneradorCasosPruebaIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  sistemaId: string;
  sistema?: Pick<SistemaExperto, 'nombre' | 'descripcion'> | null;
  variables: Variable[];
  hechos: Hecho[];
  reglas: Regla[];
  onCargarVector: (hechosVector: HechoVectorItem[]) => void;
  onEjecutarCaso?: (hechosVector: HechoVectorItem[]) => Promise<{
    conclusionFinal: string | null;
    reglasActivadas: string[];
  }>;
}

const badgeCategoria: Record<
  CasoPruebaGeneradoIA['categoria'],
  { label: string; variant: 'success' | 'warning' | 'neutral' }
> = {
  positivo: { label: 'Caso Positivo', variant: 'success' },
  borde: { label: 'Caso Límite', variant: 'warning' },
  negativo: { label: 'Sin Disparo', variant: 'neutral' },
};

export const GeneradorCasosPruebaIAModal: React.FC<GeneradorCasosPruebaIAModalProps> = ({
  isOpen,
  onClose,
  sistemaId,
  sistema,
  variables,
  hechos,
  reglas,
  onCargarVector,
  onEjecutarCaso,
}) => {
  const {
    estado,
    backendActivo,
    progresoPct,
    mensajeProgreso,
    casosPorSistema,
    guardarCasosPrueba,
    actualizarResultadoCaso,
    limpiarCasosPrueba,
    setModalGestorAbierto,
    abortarGeneracion,
  } = useIALocalStore();

  const casos = casosPorSistema[sistemaId] || [];
  const [cantidadCasos, setCantidadCasos] = useState(4);
  const [enfoque, setEnfoque] = useState<'completo' | 'positivos' | 'borde'>('completo');
  const [generando, setGenerando] = useState(false);
  const [streamParcial, setStreamParcial] = useState('');
  const [ejecutandoId, setEjecutandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerar = async () => {
    setError(null);
    setStreamParcial('');
    setGenerando(true);
    try {
      const nuevos = await iaLocalService.generarCasosPruebaCompletos(
        { sistema, variables, hechos, reglas },
        cantidadCasos,
        enfoque,
        (acumulado) => setStreamParcial(acumulado)
      );
      guardarCasosPrueba(sistemaId, nuevos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron generar los casos de prueba. Verifica el modelo cargado.'
      );
    } finally {
      setGenerando(false);
    }
  };

  const handleCargar = (caso: CasoPruebaGeneradoIA) => {
    onCargarVector(
      caso.hechosEntrada.map((h) => ({ nombre: h.nombre, valor: h.valor }))
    );
    onClose();
  };

  const handleProbar = async (caso: CasoPruebaGeneradoIA) => {
    if (!onEjecutarCaso) return;
    setEjecutandoId(caso.id);
    setError(null);
    try {
      const vector = caso.hechosEntrada.map((h) => ({
        nombre: h.nombre,
        valor: h.valor,
      }));
      const res = await onEjecutarCaso(vector);
      const esperadoNorm = caso.conclusionEsperada.toLowerCase().trim();
      const obtenidoNorm = (res.conclusionFinal || 'sin conclusión').toLowerCase().trim();
      const coincide =
        esperadoNorm === 'sin conclusión'
          ? !res.conclusionFinal
          : Boolean(
              res.conclusionFinal &&
                (obtenidoNorm.includes(esperadoNorm) ||
                  esperadoNorm.includes(obtenidoNorm))
            );

      actualizarResultadoCaso(sistemaId, caso.id, {
        conclusionObtenida: res.conclusionFinal,
        coincide,
        reglasActivadas: res.reglasActivadas,
        ejecutadoEn: new Date().toLocaleTimeString('es-ES'),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al ejecutar el caso de prueba en el motor.'
      );
    } finally {
      setEjecutandoId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generador de Casos de Prueba Completos (IA Local)"
      description="Sintetiza escenarios con vectores de entrada y conclusiones esperadas a partir de tus reglas activas."
      size="xl"
    >
      <div className="space-y-4">
        {/* Barra de configuración */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-700">
            <label className="flex items-center gap-1.5 font-medium">
              <span>Casos:</span>
              <select
                value={cantidadCasos}
                onChange={(e) => setCantidadCasos(Number(e.target.value))}
                disabled={generando}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1 font-mono text-xs"
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 font-medium">
              <span>Cobertura:</span>
              <select
                value={enfoque}
                onChange={(e) =>
                  setEnfoque(e.target.value as 'completo' | 'positivos' | 'borde')
                }
                disabled={generando}
                className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs"
              >
                <option value="completo">Equilibrada (Positivos + Borde + Negativo)</option>
                <option value="positivos">Solo casos positivos</option>
                <option value="borde">Casos límite y umbrales</option>
              </select>
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
            {casos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5 text-stone-500" />}
                onClick={() => limpiarCasosPrueba(sistemaId)}
                disabled={generando}
              >
                Limpiar
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              loading={generando}
              disabled={reglas.length === 0}
              icon={<FlaskConical className="w-4 h-4" />}
              onClick={() => void handleGenerar()}
            >
              {generando
                ? estado === 'descargando'
                  ? `Cargando IA (${progresoPct}%)`
                  : 'Diseñando casos...'
                : 'Generar Batería de Pruebas'}
            </Button>
          </div>
        </div>

        {reglas.length === 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Debes tener al menos una regla definida en la Base de Conocimiento para generar casos de prueba.
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {generando && (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-stone-700">
              <div className="flex items-center gap-2 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span>
                  {estado === 'descargando'
                    ? `${mensajeProgreso} (${progresoPct}%)`
                    : backendActivo === 'cpu'
                    ? 'Generando casos de prueba en CPU/RAM...'
                    : 'Generando casos de prueba en WebGPU...'}
                </span>
              </div>
              <button
                type="button"
                onClick={abortarGeneracion}
                className="text-[11px] font-medium text-rose-700 hover:underline cursor-pointer"
              >
                Detener
              </button>
            </div>
            {estado === 'descargando' && (
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${Math.max(4, progresoPct)}%` }}
                />
              </div>
            )}
            {streamParcial && (
              <pre className="max-h-28 overflow-y-auto rounded-lg bg-white border border-stone-200 p-2 text-[11px] font-mono text-stone-600 whitespace-pre-wrap">
                {streamParcial}
              </pre>
            )}
          </div>
        )}

        {/* Listado de casos */}
        <div className="space-y-3 max-h-[54vh] overflow-y-auto pr-1">
          {casos.length === 0 && !generando && (
            <div className="py-10 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
              Aún no has generado casos de prueba para este sistema experto. Pulsa en{' '}
              <strong className="text-stone-600">Generar Batería de Pruebas</strong>.
            </div>
          )}

          {casos.map((caso) => {
            const cat = badgeCategoria[caso.categoria] || badgeCategoria.positivo;
            const probando = ejecutandoId === caso.id;

            return (
              <div
                key={caso.id}
                className="p-4 rounded-xl border border-stone-200 bg-white space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-sm font-bold text-stone-900">{caso.titulo}</h5>
                      <Badge variant={cat.variant} size="sm">
                        {cat.label}
                      </Badge>
                      {caso.ultimoResultado && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            caso.ultimoResultado.coincide
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {caso.ultimoResultado.coincide ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {caso.ultimoResultado.coincide ? 'Coincide' : 'Difiere'}
                        </span>
                      )}
                    </div>
                    {caso.descripcion && (
                      <p className="text-xs text-stone-500 mt-0.5">{caso.descripcion}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => handleCargar(caso)}
                    >
                      Cargar en Vector BH
                    </Button>
                    {onEjecutarCaso && (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={probando}
                        icon={<Play className="w-3.5 h-3.5 fill-current" />}
                        onClick={() => void handleProbar(caso)}
                      >
                        Probar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Vector de hechos */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
                    Vector BH:
                  </span>
                  {caso.hechosEntrada.length === 0 ? (
                    <span className="text-xs italic text-stone-400">(Vacío)</span>
                  ) : (
                    caso.hechosEntrada.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-stone-50 border border-stone-200 font-mono text-xs text-stone-800"
                      >
                        <span className="font-semibold">{h.nombre}</span> ={' '}
                        <span className="font-bold text-teal-800">{h.valor}</span>
                      </span>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
                  <div>
                    <span className="text-stone-400 font-semibold">Conclusión esperada: </span>
                    <span className="font-mono font-bold text-stone-800">
                      {caso.conclusionEsperada}
                    </span>
                  </div>
                  {caso.ultimoResultado && (
                    <div>
                      <span className="text-stone-400 font-semibold">Motor devolvió: </span>
                      <span className="font-mono font-bold text-teal-800">
                        {caso.ultimoResultado.conclusionObtenida || 'Sin conclusión'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-stone-100">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GeneradorCasosPruebaIAModal;

