import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import httpClient from '@/services/httpClient';
import UnirseCursoPage from '../pages/UnirseCursoPage';

vi.mock('@/services/httpClient', () => ({ default: { post: vi.fn() } }));
const abrir = (ruta: string) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
  <MemoryRouter initialEntries={[ruta]}><Routes><Route path="/cursos/unirse" element={<UnirseCursoPage />} /><Route path="/cursos/:id" element={<p>Curso inscrito</p>} /></Routes></MemoryRouter>
</QueryClientProvider>);

describe('Inscripción en cursos', () => {
  it('conserva el token del enlace y pide confirmar antes de inscribir', async () => {
    vi.mocked(httpClient.post).mockReset().mockResolvedValue({ data: { data: { id: 'c1' } } });
    abrir('/cursos/unirse?token=secreto');
    expect(httpClient.post).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Código de ingreso')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));
    expect(await screen.findByText('Curso inscrito')).toBeInTheDocument();
    expect(httpClient.post).toHaveBeenCalledWith('/cursos/unirse/', { token: 'secreto' });
  });
  it('permite corregir un código inválido después de mostrar el error', async () => {
    vi.mocked(httpClient.post).mockReset().mockRejectedValueOnce(new Error('Código inválido')).mockResolvedValue({ data: { data: { id: 'c1' } } });
    abrir('/cursos/unirse');
    fireEvent.change(screen.getByLabelText(/Código de ingreso/), { target: { value: 'incorrecto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Código inválido');
    fireEvent.change(screen.getByLabelText(/Código de ingreso/), { target: { value: 'correcto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));
    expect(await screen.findByText('Curso inscrito')).toBeInTheDocument();
  });
});
