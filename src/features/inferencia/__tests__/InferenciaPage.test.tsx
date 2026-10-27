import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hecho, Regla, Variable } from '@/features/base-conocimiento/types/types';
import type { EjecucionInferencia } from '../types/types';

const mocks = vi.hoisted(() => ({
  reglas: [] as Regla[],
  variables: [] as Variable[],
  hechos: [] as Hecho[],
  iniciar: vi.fn(),
  avanzar: vi.fn(),
  controlar: vi.fn(),
  ejecutar: vi.fn(),
  validar: vi.fn(),
  navegar: vi.fn(),
  parametros: new URLSearchParams(),
  restaurada: undefined as EjecucionInferencia | undefined,
  setParametros: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'sistema' }),
  useNavigate: () => mocks.navegar,
  useSearchParams: () => [mocks.parametros, mocks.setParametros],
}));
vi.mock('@/config/permisos', () => ({ Permisos: {}, usePuede: () => true }));
vi.mock('@/features/validacion/hooks/useValidacion', () => ({
  useValidarBase: () => ({ mutateAsync: mocks.validar, isPending: false }),
}));
vi.mock('@/features/sistemas-expertos/hooks/useSistemasExpertos', () => ({
  useSistemaExperto: () => ({ data: { nombre: 'Prueba' }, isLoading: false }),
}));
vi.mock('@/features/base-conocimiento/hooks/useBaseConocimiento', () => ({
  useBaseConocimiento: () => ({ data: { id: 'base' } }),
  useHechos: () => ({ data: mocks.hechos }),
  useVariables: () => ({ data: mocks.variables }),
  useReglas: () => ({ data: mocks.reglas }),
  HECHOS_KEY: 'hechos',
  BASE_CONOCIMIENTO_KEY: 'base-conocimiento',
}));
vi.mock('../hooks/useInferencia', () => ({
  useInferencia: () => ({ data: mocks.restaurada, isError: false }),
  useEjecutarInferencia: () => ({ mutateAsync: mocks.ejecutar, isPending: false }),
  useIniciarSimulacion: () => ({ mutateAsync: mocks.iniciar, isPending: false }),
  useAvanzarPasoSimulacion: () => ({ mutateAsync: mocks.avanzar, isPending: false }),
  useControlarSimulacion: () => ({ mutateAsync: mocks.controlar, isPending: false }),
  useDetallesInferencia: () => ({ data: [] }),
  useConflictosInferencia: () => ({ data: [] }),
  useHechosInferidos: () => ({ data: [] }),
  INFERENCIA_DETALLES_KEY: 'detalles',
  INFERENCIA_CONFLICTOS_KEY: 'conflictos',
  INFERENCIA_HECHOS_KEY: 'inferidos',
}));
vi.mock('../components/HechosGeneradosPanel', () => ({ default: () => null }));
vi.mock('../components/ConflictosPanel', () => ({ default: () => null }));
vi.mock('../components/ExplicacionConclusionModal', () => ({ default: () => null }));
vi.mock('../components/ReglasEvaluadasPanel', () => ({ default: () => null }));
vi.mock('../components/TrazabilidadFlow', () => ({ default: () => null }));

import InferenciaPage from '../pages/InferenciaPage';

const regla = (nombre: string, prioridad: number, variables: string[] = []): Regla => ({
  id: nombre,
  nombre,
  prioridad,
  factor_certeza: 1,
  activa: true,
  condiciones: variables.map((id, index) => ({
    id: `${nombre}_${index}`,
    variable_id: id,
    operador: '==',
    valor_esperado: 'sí',
  })),
});

const renderPagina = () => {
  const client = new QueryClient();
  const pagina = () => <QueryClientProvider client={client}><InferenciaPage /></QueryClientProvider>;
  const view = render(pagina());
  return { actualizar: () => view.rerender(pagina()) };
};

const responder = (nombre: string, valor = 'sí') => {
  fireEvent.change(screen.getByPlaceholderText(`Ingrese ${nombre}...`), { target: { value: valor } });
  fireEvent.click(screen.getByRole('button', { name: /Responder y Continuar/i }));
};

describe('Preguntas durante la inferencia paso a paso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validar.mockReset().mockResolvedValue({
      id: 'validacion', base_conocimiento_id: 'base', es_valida: true,
      total_errores: 0, total_advertencias: 0, resumen: 'Base válida', incidencias: [],
    });
    mocks.parametros = new URLSearchParams();
    mocks.restaurada = undefined;
    mocks.variables = ['a', 'b', 'c', 'intermedio', 'inactiva'].map((nombre) => ({
      id: nombre,
      nombre,
      tipo: 'TEXTO',
      es_inicial: nombre !== 'intermedio',
    }));
    mocks.hechos = [];
    mocks.reglas = [];
    mocks.iniciar.mockResolvedValue({ id: 'sesion', estado: 'INICIADA' });
    mocks.avanzar.mockResolvedValue({ id: 'sesion', estado: 'EJECUTANDO', paso_actual: 1 });
    mocks.controlar.mockResolvedValue({ id: 'sesion', estado: 'INICIADA' });
    mocks.ejecutar.mockResolvedValue({ estado: 'FINALIZADA' });
  });

  it.each(['directo', 'simulacion'])('bloquea %s antes de preguntar si la BC tiene errores y permite ir a validarla', async (modo) => {
    mocks.reglas = [regla('R1', 1, ['a'])];
    mocks.validar.mockResolvedValue({
      id: 'validacion', es_valida: false, total_errores: 1, total_advertencias: 0,
      resumen: 'Se encontró un error', incidencias: [{
        id: 'e1', codigo: 'VAL-002', severidad: 'ERROR', entidad_nombre: 'R1',
        descripcion: 'Las reglas tienen conclusiones contradictorias.', sugerencia: 'Revisa las condiciones.',
      }],
    });
    renderPagina();
    if (modo === 'directo') fireEvent.click(screen.getByRole('button', { name: 'Modo Directo' }));
    fireEvent.click(screen.getByRole('button', { name: modo === 'directo' ? 'Ejecutar Directo (Hechos Actuales)' : 'Iniciar Simulación' }));
    expect(await screen.findByText('No se puede iniciar la inferencia')).toBeInTheDocument();
    expect(screen.getByText('Las reglas tienen conclusiones contradictorias.')).toBeInTheDocument();
    expect(screen.getByText('Revisa las condiciones.')).toBeInTheDocument();
    expect(mocks.validar).toHaveBeenCalledWith('base');
    expect(mocks.iniciar).not.toHaveBeenCalled();
    expect(mocks.ejecutar).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Ingrese a...')).not.toBeInTheDocument();
    expect(screen.queryByText('Ejecutar Inferencia con Respuestas')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ir a validar BC' }));
    expect(mocks.navegar).toHaveBeenCalledWith('/sistemas/sistema/validacion');
  });

  it.each(['directo', 'simulacion'])('espera la validación y permite iniciar %s con advertencias', async (modo) => {
    let resolver!: (resultado: unknown) => void;
    mocks.validar.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve; }));
    renderPagina();
    if (modo === 'directo') fireEvent.click(screen.getByRole('button', { name: 'Modo Directo' }));
    const boton = screen.getByRole('button', { name: modo === 'directo' ? 'Ejecutar Directo (Hechos Actuales)' : 'Iniciar Simulación' });
    fireEvent.click(boton);
    expect(boton).toBeDisabled();
    expect(mocks.ejecutar).not.toHaveBeenCalled();
    expect(mocks.iniciar).not.toHaveBeenCalled();
    resolver({ id: 'validacion', es_valida: true, total_errores: 0, total_advertencias: 2, incidencias: [] });
    const iniciar = modo === 'directo' ? mocks.ejecutar : mocks.iniciar;
    await waitFor(() => expect(iniciar).toHaveBeenCalledTimes(1));
    expect(mocks.validar.mock.invocationCallOrder[0]).toBeLessThan(iniciar.mock.invocationCallOrder[0]);
    expect(screen.queryByText('No se puede iniciar la inferencia')).not.toBeInTheDocument();
  });

  it('bloquea un fallo de validación y vuelve a consultar al reintentar', async () => {
    mocks.validar.mockRejectedValueOnce(new Error('Sin conexión'));
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    expect(await screen.findByText(/No se pudo validar la base de conocimiento/)).toBeInTheDocument();
    expect(mocks.iniciar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cerrar', { selector: 'span' }));
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    await waitFor(() => expect(mocks.iniciar).toHaveBeenCalledTimes(1));
    expect(mocks.validar).toHaveBeenCalledTimes(2);
  });

  it('valida otra vez al terminar las preguntas para no iniciar con una BC que cambió', async () => {
    mocks.reglas = [regla('R1', 1, ['a'])];
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    await screen.findByPlaceholderText('Ingrese a...');
    mocks.validar.mockResolvedValue({
      es_valida: false, total_errores: 1, resumen: 'Regla incompleta', incidencias: [],
    });
    responder('a');
    expect(await screen.findByText('No se puede iniciar la inferencia')).toBeInTheDocument();
    expect(mocks.iniciar).not.toHaveBeenCalled();
    expect(mocks.validar).toHaveBeenCalledTimes(2);
  });

  it('solo inferencia solicita entradas sin necesitar las reglas privadas de la BC', async () => {
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><InferenciaPage entradasActividad={[
      { nombre: 'Temperatura', tipo_dato: 'ENTERO', pregunta: '¿Qué temperatura observaste?' },
    ]} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Modo Directo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar Directo (Hechos Actuales)' }));
    expect(await screen.findByText('¿Qué temperatura observaste?')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '38' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar Inferencia con Respuestas' }));
    await waitFor(() => expect(mocks.ejecutar).toHaveBeenCalledWith({ hechos_iniciales: [
      expect.objectContaining({ nombre: 'Temperatura', tipo_dato: 'ENTERO', valor: '38' }),
    ] }));
    expect(mocks.reglas).toEqual([]);
  });

  it('pregunta los datos de todas las reglas por prioridad, sin repetir compartidos ni pedir intermedios', async () => {
    mocks.reglas = [
      regla('R3', 1, ['a', 'c', 'intermedio']),
      { ...regla('Inactiva', 10, ['inactiva']), activa: false },
      regla('R2', 2, ['a', 'b']),
      regla('R1 sin preguntas', 3),
    ];
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    expect(await screen.findByText('R2')).toBeInTheDocument();
    responder('a');
    expect(mocks.iniciar).not.toHaveBeenCalled();
    responder('b');
    expect(mocks.iniciar).not.toHaveBeenCalled();
    expect(screen.getByText('R3')).toBeInTheDocument();
    responder('c');
    await waitFor(() => expect(mocks.iniciar).toHaveBeenCalledTimes(1));
    expect(mocks.iniciar).toHaveBeenCalledWith({ hechos_iniciales: [
      { nombre: 'a', valor: 'sí', tipo_dato: 'TEXTO' },
      { nombre: 'b', valor: 'sí', tipo_dato: 'TEXTO' },
      { nombre: 'c', valor: 'sí', tipo_dato: 'TEXTO' },
    ] });
    fireEvent.click(await screen.findByRole('button', { name: 'Avanzar inferencia' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('incluye hechos iniciales y entidades con pregunta configurada', async () => {
    mocks.variables = [{ id: 'a', nombre: 'a', tipo: 'TEXTO', es_inicial: false, pregunta: '¿Dato A?' }];
    mocks.hechos = [{ id: 'h', nombre: 'h', valor: '', tipo_dato: 'TEXTO', es_inicial: true }];
    mocks.reglas = [regla('R1', 2, ['a']), {
      ...regla('R2', 1),
      condiciones: [{ id: 'ch', hecho_id: 'h', operador: '==', valor_esperado: 'sí' }],
    }];
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Preguntas de Evaluación' }));
    expect(await screen.findByText('¿Dato A?')).toBeInTheDocument();
    responder('a');
    expect(mocks.iniciar).not.toHaveBeenCalled();
    responder('h');
    await waitFor(() => expect(mocks.iniciar).toHaveBeenCalledTimes(1));
    expect(mocks.iniciar.mock.calls[0][0].hechos_iniciales.map((h: Hecho) => h.nombre)).toEqual(['a', 'h']);
  });

  it('completa todas las preguntas del avance y conserva respuestas al cancelar o reintentar un error', async () => {
    mocks.reglas = [regla('R1', 3)];
    const pagina = renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    await screen.findByRole('button', { name: 'Avanzar inferencia' });
    // Nuevas entradas disponibles después de iniciar la sesión.
    mocks.reglas = [regla('R1', 3), regla('R2', 2, ['a', 'b']), regla('R3', 1, ['a', 'c'])];
    pagina.actualizar();
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar inferencia' }));
    responder('a');
    expect(mocks.avanzar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar inferencia' }));
    responder('b');
    expect(mocks.avanzar).not.toHaveBeenCalled();
    mocks.avanzar.mockRejectedValueOnce(new Error('Error de red'));
    responder('c');
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar inferencia' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledTimes(2));
    const esperado = { simulacionId: 'sesion', datos: { hechos_nuevos: [
      { nombre: 'a', valor: 'sí', tipo_dato: 'TEXTO' },
      { nombre: 'b', valor: 'sí', tipo_dato: 'TEXTO' },
      { nombre: 'c', valor: 'sí', tipo_dato: 'TEXTO' },
    ] } };
    expect(mocks.avanzar).toHaveBeenNthCalledWith(1, esperado);
    expect(mocks.avanzar).toHaveBeenNthCalledWith(2, esperado);
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar inferencia' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledTimes(3));
    expect(mocks.avanzar).toHaveBeenLastCalledWith({ simulacionId: 'sesion' });
  });

  it('vuelve a preguntar al reiniciar la simulación', async () => {
    mocks.reglas = [regla('R1', 1, ['a'])];
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    await screen.findByPlaceholderText('Ingrese a...');
    responder('a');
    fireEvent.click(await screen.findByRole('button', { name: 'Reiniciar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Iniciar Simulación' }));
    expect(await screen.findByPlaceholderText('Ingrese a...')).toBeInTheDocument();
    expect(mocks.iniciar).toHaveBeenCalledTimes(1);
  });

  it('muestra las reglas activadas y la conclusión devueltas por la inferencia directa con cuestionario', async () => {
    mocks.hechos = [{
      id: 'conexion', nombre: 'Conexion Internet', valor: 'false', tipo_dato: 'BOOLEANO',
      es_inicial: true, pregunta: '¿Hay conexión?',
    }];
    mocks.reglas = [{
      ...regla('R Directa', 1),
      condiciones: [{ id: 'c', hecho_id: 'conexion', operador: '==', valor_esperado: 'true' }],
    }];
    mocks.ejecutar.mockResolvedValue({
      ejecucion_id: 'directa', estado: 'FINALIZADA', conclusion_final: 'Conexión disponible',
      reglas_evaluadas: ['EVALUADA', 'ACTIVADA', 'EJECUTADA'].map((estado) => ({
        regla_id: 'R Directa', regla: 'R Directa', estado, condiciones_cumplidas: true,
        resultado_generado: estado === 'EJECUTADA' ? 'diagnóstico = Conexión disponible' : null,
      })),
    });
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Modo Directo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar Directo (Hechos Actuales)' }));
    expect(await screen.findByText('¿Hay conexión?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sí / Verdadero' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ejecutar Inferencia con Respuestas' }));
    await waitFor(() => expect(mocks.ejecutar).toHaveBeenCalledTimes(1));
    expect(mocks.ejecutar.mock.calls[0][0].hechos_iniciales).toEqual([
      expect.objectContaining({ nombre: 'Conexion Internet', valor: 'true', tipo_dato: 'BOOLEANO' }),
    ]);
    expect(await screen.findByText('1 activadas')).toBeInTheDocument();
    expect(screen.getByText('R Directa')).toBeInTheDocument();
    expect(screen.getByText('Conexión disponible')).toBeInTheDocument();
    expect(mocks.iniciar).not.toHaveBeenCalled();
  });

  it('alterna avances usando el siguiente destino que devuelve el servidor', async () => {
    mocks.iniciar.mockResolvedValue({ id: 'sesion', estado: 'INICIADA', numero_vuelta: 1,
      siguiente_regla: { id: 'r1', nombre: 'Primera', prioridad: 10 } });
    mocks.avanzar.mockResolvedValueOnce({ id: 'sesion', estado: 'EJECUTANDO', paso_actual: 1,
      numero_vuelta: 1, siguiente_regla: { id: 'r2', nombre: 'Segunda', prioridad: 9 } });
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Evaluar siguiente regla' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledWith({
      simulacionId: 'sesion', datos: { modo_evaluacion: 'POR_REGLA' },
    }));
    expect(await screen.findByText('Segunda')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar inferencia' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenLastCalledWith({ simulacionId: 'sesion' }));
  });

  it('mantiene el número de paso visible al avanzar entre reglas de la misma vuelta', async () => {
    mocks.iniciar.mockResolvedValue({ id: 'sesion', estado: 'INICIADA', paso_actual: 0, paso_visual_actual: 0 });
    mocks.avanzar
      .mockResolvedValueOnce({ id: 'sesion', estado: 'EJECUTANDO', paso_actual: 1, paso_visual_actual: 1 })
      .mockResolvedValueOnce({ id: 'sesion', estado: 'EJECUTANDO', paso_actual: 2, paso_visual_actual: 1 });
    renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Evaluar siguiente regla' }));
    await waitFor(() => expect(screen.getByText(/Paso actual:/)).toHaveTextContent('Paso actual: 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Evaluar siguiente regla' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/Paso actual:/)).toHaveTextContent('Paso actual: 1');
  });

  it('recuerda el avance pequeño mientras completa preguntas adicionales', async () => {
    const pagina = renderPagina();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Simulación' }));
    await screen.findByRole('button', { name: 'Evaluar siguiente regla' });
    mocks.reglas = [regla('R1', 1, ['a', 'b'])];
    pagina.actualizar();
    fireEvent.click(screen.getByRole('button', { name: 'Evaluar siguiente regla' }));
    responder('a');
    expect(mocks.avanzar).not.toHaveBeenCalled();
    responder('b');
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledTimes(1));
    expect(mocks.avanzar).toHaveBeenCalledWith({ simulacionId: 'sesion', datos: {
      modo_evaluacion: 'POR_REGLA', hechos_nuevos: [
        { nombre: 'a', valor: 'sí', tipo_dato: 'TEXTO' },
        { nombre: 'b', valor: 'sí', tipo_dato: 'TEXTO' },
      ],
    } });
  });

  it('recupera la sesión desde la URL y continúa sin volver a solicitar los datos iniciales', async () => {
    mocks.parametros = new URLSearchParams('simulacion=guardada');
    mocks.reglas = [regla('R1', 1, ['a'])];
    mocks.restaurada = { id: 'guardada', estado: 'EJECUTANDO', paso_actual: 4, numero_vuelta: 2,
      siguiente_regla: { id: 'R1', nombre: 'R1', prioridad: 1 },
      hechos_iniciales_snapshot: [{ nombre: 'a', valor: 'sí', tipo_dato: 'TEXTO' }],
    };
    renderPagina();
    fireEvent.click(await screen.findByRole('button', { name: 'Evaluar siguiente regla' }));
    await waitFor(() => expect(mocks.avanzar).toHaveBeenCalledWith({
      simulacionId: 'guardada', datos: { modo_evaluacion: 'POR_REGLA' },
    }));
    expect(screen.queryByPlaceholderText('Ingrese a...')).not.toBeInTheDocument();
    expect(mocks.iniciar).not.toHaveBeenCalled();
  });
});
