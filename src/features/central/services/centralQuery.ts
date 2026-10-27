import { useQuery } from '@tanstack/react-query';

export function useCentralQuery<T>(key: string, queryFn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: ['central', key], queryFn, enabled });
}

export function dateLabel(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}
