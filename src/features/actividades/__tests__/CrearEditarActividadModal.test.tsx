import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CrearEditarActividadModal from '../components/CrearEditarActividadModal';

vi.mock('@/features/sistemas-expertos/hooks/useSistemasExpertos', () => ({
  useSistemasExpertos: () => ({ data: [{ id: 's1', nombre: 'Redes', estado: 'ACTIVO' }] }),
}));

const completar = () => {
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Diseña un diagnóstico' } });
  fireEvent.change(screen.getByLabelText('Enunciado e instrucciones'), { target: { value: 'Crea reglas para diagnosticar problemas de red.' } });
};

describe('Configuración de actividades', () => {
  it('crea una actividad de construcción sin exigir BC docente y sin inferencia por defecto', async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    render(<CrearEditarActividadModal isOpen onClose={vi.fn()} onSubmit={enviar} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Crear una BC/ }));
    completar();
    expect(screen.queryByLabelText('Base de conocimiento del docente')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Crear y editar la BC propia')).toBeChecked();
    expect(screen.getByLabelText('Ejecutar inferencia directa')).not.toBeChecked();
    expect(screen.getByLabelText('Evaluar paso a paso')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Crear actividad' }));
    await waitFor(() => expect(enviar).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'CREACION_BC', sistema_experto_id: null,
      permisos: expect.objectContaining({ editar_bc: true, inferencia_directa: false, simulacion: false }),
    })));
  });

  it('permite configurar solo inferencia sin mostrar BC y jamás habilita editar el original', async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    render(<CrearEditarActividadModal isOpen onClose={vi.fn()} onSubmit={enviar} isLoading={false} />);
    completar();
    fireEvent.change(screen.getByLabelText('Base de conocimiento del docente'), { target: { value: 's1' } });
    fireEvent.click(screen.getByLabelText('Consultar la base de conocimiento'));
    expect(screen.getByLabelText('Crear y editar la BC propia')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Crear actividad' }));
    await waitFor(() => expect(enviar).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'ANALISIS_BC', sistema_experto_id: 's1',
      permisos: expect.objectContaining({ ver_bc: false, editar_bc: false, editor_visual: false, inferencia_directa: true }),
    })));
  });

  it('conserva el formulario abierto y muestra el error si falla la publicación', async () => {
    const cerrar = vi.fn();
    render(<CrearEditarActividadModal isOpen onClose={cerrar} onSubmit={vi.fn().mockRejectedValue(new Error('La BC debe estar activa.'))} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Crear una BC/ })); completar();
    fireEvent.click(screen.getByRole('button', { name: 'Crear actividad' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La BC debe estar activa.');
    expect(cerrar).not.toHaveBeenCalled();
  });
});
