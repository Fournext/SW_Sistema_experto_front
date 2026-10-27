import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, GraduationCap } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authService } from '@/features/auth/services/authService';

const schema = z.object({ nombre: z.string().trim().min(3, 'Ingresa tu nombre completo.'), username: z.string().trim().min(3, 'Usa al menos 3 caracteres.').regex(/^[\w.@+-]+$/, 'Usa letras, números o los símbolos . @ + - _'), email: z.string().trim().email('Ingresa un correo válido.'), password: z.string().min(8, 'Usa al menos 8 caracteres.'), confirmacion: z.string() }).refine(data => data.password === data.confirmacion, { message: 'Las contraseñas no coinciden.', path: ['confirmacion'] });
export default function RegistroEstudiantePage() {
  const [params] = useSearchParams();
  const loginUrl = params.get('next') ? `/central/login?next=${encodeURIComponent(params.get('next')!)}` : '/central/login';
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async ({ nombre, username, email, password }) => {
    setError('');
    try { await authService.registroEstudiante({ nombre, username, email, password }); setComplete(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta.'); }
  });
  return <AuthLayout>{complete ? <div role="status"><CheckCircle2 size={45} className="mb-6 text-teal-700" /><h1 className="font-serif text-3xl">Tu cuenta está lista</h1><p className="my-5 text-sm leading-6 text-stone-500">Ya puedes ingresar con tu usuario y contraseña para acceder a tus actividades.</p><Link to={loginUrl} className="inline-flex rounded-xl bg-teal-800 px-6 py-3 text-sm font-semibold text-white">Continuar al inicio de sesión</Link></div> : <>
    <GraduationCap className="mb-5 text-teal-700" size={32} /><p className="text-xs uppercase tracking-[.2em] text-teal-700">Comienza a explorar</p><h1 className="mb-3 mt-3 font-serif text-4xl">Crea tu cuenta de estudiante</h1><p className="mb-7 text-sm text-stone-500">Aprende haciendo, a tu propio ritmo.</p>
    <form onSubmit={submit} className="space-y-4">
      <Input label="Nombre completo" autoComplete="name" {...register('nombre')} error={errors.nombre?.message} />
      <Input label="Nombre de usuario" autoComplete="username" {...register('username')} error={errors.username?.message} />
      <Input label="Correo electrónico" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
      <Input label="Contraseña" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
      <Input label="Confirmar contraseña" type="password" autoComplete="new-password" {...register('confirmacion')} error={errors.confirmacion?.message} />
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <Button className="w-full" type="submit" size="lg" loading={isSubmitting}>Crear cuenta de estudiante</Button>
    </form><p className="mt-6 text-center text-sm text-stone-500">¿Ya tienes cuenta? <Link className="font-semibold text-teal-800 underline underline-offset-4" to={loginUrl}>Inicia sesión</Link></p>
  </>}</AuthLayout>;
}
