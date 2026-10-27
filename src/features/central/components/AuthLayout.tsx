import type { ReactNode } from 'react';
import { ArrowLeft, Network, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../auth.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell min-h-screen bg-stone-50 text-stone-800 lg:grid lg:grid-cols-[1.05fr_1fr]">
    <aside className="auth-story relative hidden overflow-hidden bg-teal-950 p-14 text-white lg:flex lg:flex-col lg:justify-between">
      <Link to="/" className="relative z-10 flex items-center gap-3 text-sm font-semibold"><span className="rounded-xl border border-teal-700 p-3"><Network size={24} /></span> SISTEMAS EXPERTOS</Link>
      <div className="relative z-10 max-w-lg"><span className="text-xs uppercase tracking-[.25em] text-teal-300">Conocimiento que conecta</span><h2 className="my-7 font-serif text-5xl leading-tight xl:text-6xl">Un solo acceso.<br /><em className="text-teal-300">Todas las posibilidades.</em></h2><p className="max-w-sm text-base leading-8 text-teal-100/75">Un espacio para enseñar, explorar y construir conocimiento. Tu rol te conecta con las herramientas que necesitas.</p></div>
      <p className="relative z-10 flex items-center gap-2 text-xs text-teal-200/70"><ShieldCheck size={17} /> Acceso institucional · Sistemas Expertos</p>
    </aside>
    <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16">
      <Link to="/" className="flex w-fit items-center gap-2 text-xs text-stone-500 hover:text-teal-800"><ArrowLeft size={15} /> Volver al inicio</Link>
      <div className="auth-form mx-auto my-auto w-full max-w-md py-12">{children}</div>
      <p className="text-center text-[11px] text-stone-400">Software de Apoyo a Sistemas Expertos · Entorno académico</p>
    </section>
  </main>;
}
