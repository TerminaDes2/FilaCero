"use client";
import React, { useState, useMemo } from 'react';
import { LegalModal } from '../../components/legal/LegalModal';
import { FancyInput } from './FancyInput';

interface SignupFormProps {
	onSuccess?: () => void;
}

function computeStrength(pw: string): number {
	let score = 0;
	if(pw.length >= 8) score++;
	if(/[A-Z]/.test(pw)) score++;
	if(/[0-9]/.test(pw)) score++;
	if(/[^A-Za-z0-9]/.test(pw)) score++;
	return score; // 0 - 4
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [touched, setTouched] = useState<{[k:string]:boolean}>({});
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [showLegal, setShowLegal] = useState<null | 'terminos' | 'privacidad'>(null);

	const emailValid = /.+@.+\..+/.test(email);
	const passwordStrength = computeStrength(password);
	const passwordStrongEnough = passwordStrength >= 3; // must hit 3 of 4
	const confirmValid = confirm.length > 0 && confirm === password;
	const nameValid = name.trim().length >= 2;
	const baseValid = emailValid && passwordStrongEnough && confirmValid && nameValid;
	const formValid = baseValid && acceptedTerms;

	const suggestions = useMemo(() => {
		const s: string[] = [];
		if(password.length < 8) s.push('Usa al menos 8 caracteres');
		if(!/[A-Z]/.test(password)) s.push('Incluye una mayúscula');
		if(!/[0-9]/.test(password)) s.push('Añade un número');
		if(!/[^A-Za-z0-9]/.test(password)) s.push('Añade un símbolo');
		return s;
	}, [password]);

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
		if(!formValid) return;
		setSubmitting(true);
		setTimeout(()=>{
			setSubmitting(false);
			onSuccess?.();
		}, 1400);
	};

	return (
		<form onSubmit={submit} className="space-y-6" noValidate>

			<FancyInput
				label="Nombre"
				value={name}
				onChange={e=>setName(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,name:true}))}
				error={touched.name && !nameValid ? 'Mínimo 2 caracteres' : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z' /></svg>}
				hint={!name ? 'Ingresa tu nombre' : undefined}
			/>
			<FancyInput
				label="Correo electrónico"
				type="email"
				value={email}
				onChange={e=>setEmail(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,email:true}))}
				error={touched.email && !emailValid ? 'Correo inválido' : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M4 6l8 6 8-6M4 6v12h16V6' /></svg>}
				hint={!email ? 'Usa un correo válido que controles' : undefined}
			/>
			<FancyInput
				label="Contraseña"
				type={showPassword ? 'text' : 'password'}
				value={password}
				onChange={e=>setPassword(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,password:true}))}
				error={touched.password && !passwordStrongEnough ? 'Fortalece tu contraseña' : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><rect x='4' y='8' width='16' height='12' rx='2'/><path strokeLinecap='round' strokeLinejoin='round' d='M8 8V6a4 4 0 1 1 8 0v2' /></svg>}
				isPassword
				onTogglePassword={()=>setShowPassword(s=>!s)}
				strength={password ? passwordStrength : undefined}
				hint={!password ? 'Debe ser robusta' : undefined}
			/>
			{password && suggestions.length > 0 && !passwordStrongEnough && (
				<div className="flex flex-wrap gap-1.5 -mt-2">
					{suggestions.map((s, idx) => {
						const accentClass = idx % 3 === 0 ? 'border-sun-300 text-sun-700 dark:text-sun-300' : idx % 3 === 1 ? 'border-brand-200 text-brand-700 dark:text-brand-300' : 'border-emerald-200 text-emerald-700 dark:text-emerald-300';
						const iconColor = idx % 3 === 0 ? 'text-sun-400 dark:text-sun-300' : idx % 3 === 1 ? 'text-brand-500 dark:text-brand-300' : 'text-emerald-400 dark:text-emerald-300';
						return (
							<span
								key={s}
								className={`inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-white/10 border ${accentClass} px-2 py-1 text-[10px] font-medium shadow-sm backdrop-blur-sm`}
							>
								<svg className={`w-2.5 h-2.5 ${iconColor}`} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
									<path strokeLinecap='round' strokeLinejoin='round' d='M12 3v4M12 17v4M4 12h4m8 0h4M7.8 7.8l2.8 2.8m2.8 2.8 2.8 2.8m0-8.4-2.8 2.8m-2.8 2.8-2.8 2.8' />
								</svg>
								{s}
							</span>
						);
					})}
				</div>
			)}
			<FancyInput
				label="Confirmar contraseña"
				type={showConfirm ? 'text' : 'password'}
				value={confirm}
				onChange={e=>setConfirm(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,confirm:true}))}
				error={touched.confirm && !confirmValid ? 'No coincide' : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>}
				isPassword
				onTogglePassword={()=>setShowConfirm(c=>!c)}
				hint={!confirm ? 'Repite la contraseña' : undefined}
			/>
			<div className="space-y-4">
				<div className="flex items-start gap-3 rounded-md bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
					<input
						id="terms"
						type="checkbox"
						checked={acceptedTerms}
						onChange={e=>setAcceptedTerms(e.target.checked)}
						className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:bg-slate-800 dark:border-white/20"
					/>
						<label htmlFor="terms" className="text-xs leading-relaxed text-gray-600 dark:text-slate-300">
							Acepto los {' '}
							<button type="button" onClick={()=>setShowLegal('terminos')} className="font-medium text-brand-600 dark:text-brand-400 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-sm">
								Términos de Servicio
							</button>{' '}y la{' '}
							<button type="button" onClick={()=>setShowLegal('privacidad')} className="font-medium text-brand-600 dark:text-brand-400 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-sm">
								Política de Privacidad
							</button>.
						</label>
				</div>
				{touched.terms && !acceptedTerms && (
					<p className="text-[11px] text-rose-600 dark:text-rose-400">Debes aceptar los términos para continuar.</p>
				)}
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
					{submitting ? 'Creando...' : 'Crear cuenta'}
				</button>
				<LegalModal
					open={!!showLegal}
					initialTab={showLegal === 'terminos' ? 'terminos' : 'privacidad'}
					onClose={()=>setShowLegal(null)}
				/>
			</div>


		</form>

	);
};
