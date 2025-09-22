"use client";
import React, { useState } from 'react';
import { FancyInput } from './FancyInput';

interface LoginFormProps {
	onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [touched, setTouched] = useState<{[k:string]:boolean}>({});

	const emailValid = /.+@.+\..+/.test(email);
	const passwordValid = password.length >= 6;
	const formValid = emailValid && passwordValid;

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		setTouched({ email: true, password: true });
		if(!formValid) return;
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			onSuccess?.();
		}, 1200);
	};

	return (
		<form onSubmit={submit} className="space-y-6">
			{/* Supportive microcopy / context */}
			<div className="text-[11px] leading-relaxed -mb-1 rounded-lg border border-white/60 dark:border-white/10 bg-gradient-to-r from-brand-50/70 to-emerald-50/60 dark:from-white/5 dark:to-white/5 px-3 py-2 text-gray-600 dark:text-slate-300 flex items-start gap-3">
				<svg className='w-5 h-5 mt-0.5 text-brand-600 dark:text-brand-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
					<rect x='3' y='10' width='18' height='11' rx='2' />
					<path strokeLinecap='round' strokeLinejoin='round' d='M8 10V8a4 4 0 0 1 8 0v2' />
					<path strokeLinecap='round' strokeLinejoin='round' d='M12 14v3' />
				</svg>
				<p>
					Acceso seguro a tu panel. Tus credenciales se envían cifradas. <span className="hidden sm:inline">¿Nuevo aquí? Regístrate desde el enlace inferior.</span>
				</p>
			</div>
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
					<input type='checkbox' className='h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500' />
					<span>Recordarme</span>
				</label>
				<button type='button' className='font-medium text-brand-600 dark:text-brand-400 hover:underline'>¿Olvidaste tu contraseña?</button>
			</div>
			<button
				type="submit"
				disabled={!formValid || submitting}
				className="relative w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 shadow-sm hover:shadow-md transition active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400"
			>
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
			<p className="text-xs text-gray-500 dark:text-slate-400 text-center">Al continuar aceptas nuestros <a href="#" className='underline hover:text-brand-600 dark:hover:text-brand-300'>Términos</a>.</p>
		</form>
	);
};
