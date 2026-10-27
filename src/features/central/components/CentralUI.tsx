import type { ReactNode } from 'react';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
export function CentralHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="central-heading"><div><p className="central-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
export function QueryState({ loading, error, retry }: { loading: boolean; error: Error | null; retry: () => unknown }) {
  if (loading) return <div className="central-state" role="status"><RefreshCw className="animate-spin" size={24} /><p>Cargando información…</p></div>;
  if (error) return <div className="central-state central-error" role="alert"><AlertCircle size={26} /><p>{error.message}</p><button className="central-btn secondary" onClick={retry}>Volver a intentar <ArrowRight size={15} /></button></div>;
  return null;
}
export function Empty({ children }: { children: ReactNode }) { return <p className="central-empty">{children}</p>; }
export function ErrorNotice({ message }: { message: string }) { return message ? <p className="central-notice" role="alert">{message}</p> : null; }
export function EventResult({ value }: { value: string }) { return <span className={`central-badge ${/exito|success|exitoso|correcto/i.test(value) ? 'positive' : ''}`}>{value}</span>; }
