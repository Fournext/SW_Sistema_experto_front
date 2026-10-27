import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/authStore';
import { destinoPostLogin } from '@/features/auth/utils/destinoPostLogin';

const schema = z.object({ username: z.string().trim().min(1, 'Escribe tu nombre de usuario.'), password: z.string().min(1, 'Escribe tu contraseña.') });
export default function CentralLoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const status = useAuthStore(state => state.status);
  const login = useAuthStore(state => state.login);
  const restaurar = useAuthStore(state => state.restaurarSesion);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  useEffect(() => { void restaurar(); }, [restaurar]);
  useEffect(() => { if (status === 'autenticado' && user) navigate(destinoPostLogin(user, params.get('next')), { replace: true }); }, [status, user, navigate, params]);
  const submit = handleSubmit(async values => {
    setError('');
    try {
      const result = await authService.login(values.username, values.password);
      login({ access: result.access, refresh: result.refresh }, result.user);
      navigate(destinoPostLogin(result.user, params.get('next')), { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.'); }
  });
  return <AuthLayout>
    <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-800"><ShieldCheck size={25} /></div>
    <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-teal-700">Admin Central & Autenticación</p>
    <h1 className="mt-3 font-serif text-4xl text-stone-900">Bienvenido de nuevo</h1>
    <p className="mb-8 mt-3 text-sm leading-6 text-stone-500">Ingresa con tu cuenta para continuar a tu espacio de trabajo.</p>
    <form onSubmit={submit} className="space-y-5">
      <Input label="Usuario" autoComplete="username" {...register('username')} error={errors.username?.message} />
      <Input label="Contraseña" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <Button type="submit" loading={isSubmitting} disabled={status === 'cargando'} className="w-full" size="lg" icon={<ArrowRight size={18} />} iconPosition="right">Ingresar a la plataforma</Button>
    </form>
    <div className="mt-8 border-t border-stone-200 pt-6 text-center text-sm text-stone-500">¿Eres estudiante? <Link className="font-semibold text-teal-800 underline underline-offset-4" to={params.get('next') ? `/registro-estudiante?next=${encodeURIComponent(params.get('next')!)}` : '/registro-estudiante'}>Regístrate aquí</Link></div>
  </AuthLayout>;
}
