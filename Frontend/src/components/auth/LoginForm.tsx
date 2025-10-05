"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FancyInput } from './FancyInput';
import { api } from '../../lib/api';

interface LoginFormProps {
	onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [touched, setTouched] = useState<{[k:string]:boolean}>({});
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const emailValid = /.+@.+\..+/.test(email);
	const passwordValid = password.length >= 6;
	const formValid = emailValid && passwordValid;

		const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTouched({ email: true, password: true });
		if(!formValid) return;
			setSubmitting(true);
			setError(null);
			try {
						const res = await api.login(email.trim().toLowerCase(), password);
						if (typeof window !== 'undefined') {
							window.localStorage.setItem('auth_token', res.token);
							window.localStorage.setItem('auth_user', JSON.stringify(res.user));
						}
				onSuccess?.();
				// Redirige a POS o home; ajusta según flujo
				router.push('/pos');
			} catch (err: any) {
				setError(err?.message || 'Error al iniciar sesión');
			} finally {
				setSubmitting(false);
			}
	};

	return (
		<form onSubmit={submit} className="space-y-6" aria-describedby="login-hint">
			{/* Supportive microcopy / context */}
			<div id="login-hint" className="text-[11px] leading-relaxed -mb-1 rounded-lg border border-white/60 dark:border-white/10 bg-gradient-to-r from-brand-50/70 to-emerald-50/60 dark:from-white/5 dark:to-white/5 px-3 py-2 text-gray-600 dark:text-slate-300 flex items-start gap-3">
				<svg className='w-5 h-5 mt-0.5 text-brand-600 dark:text-brand-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
					<rect x='3' y='10' width='18' height='11' rx='2' />
					<path strokeLinecap='round' strokeLinejoin='round' d='M8 10V8a4 4 0 0 1 8 0v2' />
					<path strokeLinecap='round' strokeLinejoin='round' d='M12 14v3' />
				</svg>
				<p>
					Acceso seguro a tu panel. Tus credenciales se envían cifradas. <span className="hidden sm:inline">¿Nuevo aquí? Regístrate desde el enlace inferior.</span>
				</p>
			</div>
					{error && (
						<div className="text-[12px] text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200/70 dark:border-rose-800 rounded-md px-3 py-2">
							{error}
						</div>
					)}
					<FancyInput
				label="Correo electrónico"
				type="email"
				value={email}
				onChange={e=>setEmail(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,email:true}))}
				error={touched.email && !emailValid ? 'Ingresa un correo válido' : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M4 6l8 6 8-6M4 6v12h16V6' /></svg>}
				hint={email ? undefined : 'Usa el correo con el que te registraste'}
			/>
			<FancyInput
				label="Contraseña"
				type={showPassword ? 'text' : 'password'}
				value={password}
				onChange={e=>setPassword(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,password:true}))}
				error={touched.password && !passwordValid ? 'Mínimo 6 caracteres' : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><rect x='4' y='8' width='16' height='12' rx='2'/><path strokeLinecap='round' strokeLinejoin='round' d='M8 8V6a4 4 0 1 1 8 0v2' /></svg>}
				isPassword
				onTogglePassword={()=>setShowPassword(s=>!s)}
				hint={!password ? 'Tu contraseña segura' : undefined}
			/>
			<div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
				<label className="inline-flex items-center gap-2 cursor-pointer select-none">
					<input type='checkbox' className='appearance-none h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 checked:bg-brand-600 checked:border-brand-600' />
					<span>Recordarme</span>
				</label>
				<button type='button' className='font-medium text-brand-600 dark:text-brand-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded'>¿Olvidaste tu contraseña?</button>
			</div>
			<button
				type="submit"
				disabled={!formValid || submitting}
				className="group relative w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 shadow-sm hover:shadow-md transition active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400"
			>
				<span className="absolute -top-2 right-2 kbd-hint opacity-0 group-focus-visible:opacity-100">Enter para entrar</span>
				{submitting && (
					<span className="absolute left-4 inline-flex">
						<svg className='animate-spin h-4 w-4 text-white' viewBox='0 0 24 24'>
							<circle className='opacity-30' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'/>
							<path className='opacity-90' fill='currentColor' d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z' />
						</svg>
					</span>
				)}
				{submitting ? 'Ingresando...' : 'Entrar'}
			</button>

		  
          <div className="text-center pt-1">
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-600">
                ¿Eres nuevo en FilaCero?{' '}
                <a 
                  href="/auth/register"
                  className="text-brand-600 font-medium hover:underline"
                > 
                  Crea una cuenta
                </a>
              </p>
            </div>
          </div>		
		  </form>
	);
};
