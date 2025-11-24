"use client";
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LegalModal } from '../../components/legal/LegalModal';
import { FancyInput } from './FancyInput';
import { api } from '../../lib/api';
import { useUserStore } from '../../state/userStore';
import { EmailVerificationModal } from './EmailVerificationModal';

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
	const [accountNumber, setAccountNumber] = useState("");
	const [age, setAge] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [touched, setTouched] = useState<{[k:string]:boolean}>({});
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [showLegal, setShowLegal] = useState<null | 'terminos' | 'privacidad'>(null);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { role } = useUserStore();
	const isOwner = role === 'OWNER';
	const [showVerificationModal, setShowVerificationModal] = useState(false);
	const [pendingEmail, setPendingEmail] = useState<string | null>(null);
	const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null);
	const [verificationSession, setVerificationSession] = useState<string | null>(null);

	const emailValid = /.+@.+\..+/.test(email);
	const passwordStrength = computeStrength(password);
	const passwordStrongEnough = passwordStrength >= 3; // must hit 3 of 4
	const confirmValid = confirm.length > 0 && confirm === password;
	const nameValid = name.trim().length >= 2;
	const accountNumberClean = accountNumber.trim();
	const accountNumberValid =
		isOwner || accountNumberClean === "" || /^[0-9]{5,20}$/.test(accountNumberClean);
	const ageValue = age === "" ? undefined : Number(age);
	const ageValid =
		isOwner ||
		age === "" ||
		 (ageValue !== undefined &&
		 Number.isInteger(ageValue) &&
		 ageValue >= 16 &&
		 ageValue <= 120);
	const baseValid =
		emailValid &&
		passwordStrongEnough &&
		confirmValid &&
		nameValid &&
		(isOwner || accountNumberValid) &&
		(isOwner || ageValid);
	const formValid = baseValid && acceptedTerms;

	const suggestions = useMemo(() => {
		const s: string[] = [];
		if(password.length < 8) s.push('Usa al menos 8 caracteres');
		if(!/[A-Z]/.test(password)) s.push('Incluye una mayúscula');
		if(!/[0-9]/.test(password)) s.push('Añade un número');
		if(!/[^A-Za-z0-9]/.test(password)) s.push('Añade un símbolo');
		return s;
	}, [password]);

	const submit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setTouched({
			name: true,
			email: true,
			password: true,
			confirm: true,
			terms: true,
			accountNumber: !isOwner,
			age: !isOwner,
		});
		if(!formValid) return;
		// Exigir selección de rol explícita para evitar registros ambiguos
		if(!role) {
			setError('Selecciona un rol (Cliente o Negocio) antes de continuar.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const roleName: 'usuario' | 'admin' = isOwner ? 'admin' : 'usuario';
			const normalizedEmail = email.trim().toLowerCase();
			const res = await api.register(
				name.trim(),
				normalizedEmail,
				password,
				roleName
			);
			if (res.requiresVerification) {
				setPendingEmail(normalizedEmail);
				setVerificationExpiresAt(res.expiresAt ?? null);
				setVerificationSession(res.session ?? null);
				try {
					if (typeof window !== 'undefined') {
						if (res.session) window.localStorage.setItem('preRegSession', res.session);
						if (res.expiresAt) window.localStorage.setItem('preRegExpiresAt', res.expiresAt);
						window.localStorage.setItem('preRegEmail', normalizedEmail);
					}
				} catch {}
				setShowVerificationModal(true);
			} else {
				onSuccess?.();
				router.push(isOwner ? '/onboarding/negocio' : '/onboarding/customer');
			}
		} catch (err: any) {
			setError(err?.message || 'Error al crear la cuenta');
		} finally {
			setSubmitting(false);
		}
	};

	const handleVerificationClosed = useCallback(() => {
		setShowVerificationModal(false);
		setPendingEmail(null);
		setVerificationExpiresAt(null);
		setVerificationSession(null);
		try {
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem('preRegSession');
				window.localStorage.removeItem('preRegExpiresAt');
				window.localStorage.removeItem('preRegEmail');
			}
		} catch {}
	}, []);

	const handleVerificationSuccess = useCallback(() => {
		setShowVerificationModal(false);
		setPendingEmail(null);
		setVerificationExpiresAt(null);
		onSuccess?.();
		router.push(isOwner ? '/onboarding/negocio' : '/onboarding/customer');
	}, [isOwner, onSuccess, router]);

	return (
		<>
		<form onSubmit={submit} className="space-y-5" noValidate>
			{error && (
				<div className="flex items-start gap-3 text-sm text-rose-800 bg-rose-50 border-2 border-rose-200 rounded-2xl px-4 py-3 shadow-sm animate-pulse">
					<svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{error}</span>
				</div>
			)}
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
			{!isOwner && (
				<>
					<FancyInput
						label="Número de cuenta"
						value={accountNumber}
						onChange={e=>setAccountNumber(e.target.value)}
						onBlur={()=>setTouched(t=>({...t,accountNumber:true}))}
						error={touched.accountNumber && !accountNumberValid ? 'Debe contener entre 5 y 20 dígitos' : undefined}
						leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M3 4h18v5H3zM3 13h18v7H3z'/><path strokeLinecap='round' strokeLinejoin='round' d='M7 17h2m4 0h6'/></svg>}
						hint={accountNumber ? undefined : 'Opcional, solo números'}
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={20}
					/>
					<FancyInput
						label="Edad"
						type="number"
						value={age}
						onChange={e=>setAge(e.target.value)}
						onBlur={()=>setTouched(t=>({...t,age:true}))}
						error={touched.age && !ageValid ? 'Selecciona una edad entre 16 y 120' : undefined}
						leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' /></svg>}
						hint={age ? undefined : 'Opcional, utilizada para beneficios estudiantiles'}
						min={16}
						max={120}
					/>
				</>
			)}
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
				<div className="flex flex-wrap gap-2 -mt-2">
					{suggestions.map((s, idx) => {
						const colors = [
							{ border: 'border-sun-300/60', bg: 'bg-sun-50/80', text: 'text-sun-700', icon: 'text-sun-500' },
							{ border: 'border-brand-200/60', bg: 'bg-brand-50/80', text: 'text-brand-700', icon: 'text-brand-500' },
							{ border: 'border-emerald-200/60', bg: 'bg-emerald-50/80', text: 'text-emerald-700', icon: 'text-emerald-500' }
						];
						const colorSet = colors[idx % 3];
						return (
							<span
								key={s}
								className={`inline-flex items-center gap-1.5 rounded-xl ${colorSet.bg} border ${colorSet.border} ${colorSet.text} px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm transition-all hover:scale-105`}
							>
								<svg className={`w-3 h-3 ${colorSet.icon}`} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
									<path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
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
			<div className="space-y-5 pt-2">
				<div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm border-2 border-gray-200/60 p-4 shadow-sm hover:shadow-md transition-all duration-200">
					<input
						id="terms"
						type="checkbox"
						checked={acceptedTerms}
						onChange={e=>setAcceptedTerms(e.target.checked)}
						className="mt-1 h-5 w-5 rounded-lg border-2 border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all cursor-pointer"
					/>
						<label htmlFor="terms" className="text-sm leading-relaxed text-gray-700 cursor-pointer">
							Acepto los {' '}
							<button type="button" onClick={()=>setShowLegal('terminos')} className="font-semibold text-brand-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-sm">
								Términos de Servicio
							</button>{' '}y la{' '}
							<button type="button" onClick={()=>setShowLegal('privacidad')} className="font-semibold text-brand-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-sm">
								Política de Privacidad
							</button>.
						</label>
				</div>
				{touched.terms && !acceptedTerms && (
					<p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Debes aceptar los términos para continuar.
					</p>
				)}
				<button
				type="submit"
					disabled={!formValid || submitting}
					className="relative w-full group inline-flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 bg-size-200 bg-pos-0 hover:bg-pos-100 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-base font-bold px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand-400/50 overflow-hidden"
				>
					{/* Shine effect */}
					{!submitting && (
						<div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
					)}
					{submitting && (
						<span className="inline-flex">
							<svg className='animate-spin h-5 w-5 text-white' viewBox='0 0 24 24'>
								<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'/>
								<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z' />
							</svg>
						</span>
					)}
					<span className="relative z-10">{submitting ? 'Creando tu cuenta...' : 'Crear mi cuenta'}</span>
					{!submitting && (
						<svg className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					)}
				</button>
				<LegalModal
					open={!!showLegal}
					initialTab={showLegal === 'terminos' ? 'terminos' : 'privacidad'}
					onClose={()=>setShowLegal(null)}
				/>
			</div>


		</form>
		{pendingEmail && verificationSession && (
			<EmailVerificationModal
				open={showVerificationModal}
				email={pendingEmail}
				expiresAt={verificationExpiresAt}
				session={verificationSession}
				onClose={handleVerificationClosed}
				onVerified={() => handleVerificationSuccess()}
			/>
		)}
		</>
	);
};
