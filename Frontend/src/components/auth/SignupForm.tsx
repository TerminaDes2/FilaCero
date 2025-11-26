"use client";
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LegalModal } from '../../components/legal/LegalModal';
import { FancyInput } from './FancyInput';
import { api } from '../../lib/api';
import { useUserStore } from '../../state/userStore';
import { EmailVerificationModal } from './EmailVerificationModal';
import { useTranslation } from '../../hooks/useTranslation';
import { SmsVerificationModal } from './SmsVerificationModal';
import { CredentialVerificationPrompt } from './CredentialVerificationPrompt';

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
	const { t } = useTranslation();
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
		if(password.length < 8) s.push(t('auth.register.form.suggestions.minChars'));
		if(!/[A-Z]/.test(password)) s.push(t('auth.register.form.suggestions.upper'));
		if(!/[0-9]/.test(password)) s.push(t('auth.register.form.suggestions.number'));
		if(!/[^A-Za-z0-9]/.test(password)) s.push(t('auth.register.form.suggestions.symbol'));
		return s;
		}, [password, t]);

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
			setError(t('auth.register.form.errors.noRole'));
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
			setError(err?.message || t('auth.register.form.errors.createGeneric'));
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

	const [showSmsVerification, setShowSmsVerification] = useState(false);
	const [showCredentialPrompt, setShowCredentialPrompt] = useState(false);
	const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

	const handleVerificationSuccess = useCallback(() => {
		setShowVerificationModal(false);
		setPendingEmail(null);
		setVerificationExpiresAt(null);
		setVerifiedPhone(null);
		setShowSmsVerification(true);
	}, []);

	const handleSmsVerified = useCallback(({ phone }: { phone: string }) => {
		setVerifiedPhone(phone);
		const proceed = () => {
			setShowSmsVerification(false);
			setShowCredentialPrompt(true);
		};
		if (typeof window !== 'undefined') {
			window.setTimeout(proceed, 800);
		} else {
			proceed();
		}
	}, []);

	const handleCredentialContinue = useCallback(() => {
		setShowCredentialPrompt(false);
		const redirectTo = isOwner ? '/onboarding/negocio' : '/onboarding/customer';
		const target = `/verification/credencial?redirect=${encodeURIComponent(redirectTo)}`;
		router.push(target);
	}, [isOwner, router]);

	return (
		<>
		<form onSubmit={submit} className="space-y-4 md:space-y-5" noValidate>
			{error && (
				<div className="flex items-start gap-2.5 text-xs text-rose-800 bg-rose-50/90 border border-rose-200 rounded-xl px-3 py-2.5 shadow-sm">
					<svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{error}</span>
				</div>
			)}
			<FancyInput
				label={t('auth.register.form.name.label')}
				value={name}
				onChange={e=>setName(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,name:true}))}
				error={touched.name && !nameValid ? t('auth.register.form.name.error') : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z' /></svg>}
				hint={!name ? t('auth.register.form.name.hint') : undefined}
			/>
			<FancyInput
				label={t('auth.register.form.email.label')}
				type="email"
				value={email}
				onChange={e=>setEmail(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,email:true}))}
				error={touched.email && !emailValid ? t('auth.register.form.email.error') : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M4 6l8 6 8-6M4 6v12h16V6' /></svg>}
				hint={!email ? t('auth.register.form.email.hint') : undefined}
			/>
			{!isOwner && (
				<>
					<FancyInput
						label={t('auth.register.form.accountNumber.label')}
						value={accountNumber}
						onChange={e=>setAccountNumber(e.target.value)}
						onBlur={()=>setTouched(t=>({...t,accountNumber:true}))}
						error={touched.accountNumber && !accountNumberValid ? t('auth.register.form.accountNumber.error') : undefined}
						leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M3 4h18v5H3zM3 13h18v7H3z'/><path strokeLinecap='round' strokeLinejoin='round' d='M7 17h2m4 0h6'/></svg>}
						hint={accountNumber ? undefined : t('auth.register.form.accountNumber.hint')}
						inputMode="numeric"
						pattern="[0-9]*"
						maxLength={20}
					/>
					<FancyInput
						label={t('auth.register.form.age.label')}
						type="number"
						value={age}
						onChange={e=>setAge(e.target.value)}
						onBlur={()=>setTouched(t=>({...t,age:true}))}
						error={touched.age && !ageValid ? t('auth.register.form.age.error') : undefined}
						leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' /></svg>}
						hint={age ? undefined : t('auth.register.form.age.hint')}
						min={16}
						max={120}
					/>
				</>
			)}
			<FancyInput
				label={t('auth.register.form.password.label')}
				type={showPassword ? 'text' : 'password'}
				value={password}
				onChange={e=>setPassword(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,password:true}))}
				error={touched.password && !passwordStrongEnough ? t('auth.register.form.password.error') : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><rect x='4' y='8' width='16' height='12' rx='2'/><path strokeLinecap='round' strokeLinejoin='round' d='M8 8V6a4 4 0 1 1 8 0v2' /></svg>}
				isPassword
				onTogglePassword={()=>setShowPassword(s=>!s)}
				strength={password ? passwordStrength : undefined}
				hint={!password ? t('auth.register.form.password.hint') : undefined}
			/>
			{password && suggestions.length > 0 && !passwordStrongEnough && (
				<div className="flex flex-wrap gap-1.5 -mt-2">
					{suggestions.map((s, idx) => {
						const colors = [
							{ border: 'border-sun-200/60', bg: 'bg-sun-50/80', text: 'text-sun-700', icon: 'text-sun-500' },
							{ border: 'border-brand-200/60', bg: 'bg-brand-50/80', text: 'text-brand-700', icon: 'text-brand-500' },
							{ border: 'border-emerald-200/60', bg: 'bg-emerald-50/80', text: 'text-emerald-700', icon: 'text-emerald-500' }
						];
						const colorSet = colors[idx % 3];
						return (
							<span
								key={s}
								className={`inline-flex items-center gap-1.5 rounded-lg ${colorSet.bg} border ${colorSet.border} ${colorSet.text} px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm`}
							>
								<svg className={`w-2.5 h-2.5 ${colorSet.icon}`} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.25'>
									<path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
								</svg>
								{s}
							</span>
						);
					})}
				</div>
			)}
			<FancyInput
				label={t('auth.register.form.confirm.label')}
				type={showConfirm ? 'text' : 'password'}
				value={confirm}
				onChange={e=>setConfirm(e.target.value)}
				onBlur={()=>setTouched(t=>({...t,confirm:true}))}
				error={touched.confirm && !confirmValid ? t('auth.register.form.confirm.error') : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' /></svg>}
				isPassword
				onTogglePassword={()=>setShowConfirm(c=>!c)}
				hint={!confirm ? t('auth.register.form.confirm.hint') : undefined}
			/>
			<div className="space-y-4 pt-1.5">
				<div className="flex items-start gap-2.5 rounded-xl bg-gradient-to-br from-white/90 to-gray-50/85 backdrop-blur-sm border border-gray-200/60 p-3 shadow-sm">
					<input
						id="terms"
						type="checkbox"
						checked={acceptedTerms}
						onChange={e=>setAcceptedTerms(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border border-gray-300 text-brand-600 focus:ring-1 focus:ring-brand-500 focus:ring-offset-1 transition-all cursor-pointer"
					/>
						<label htmlFor="terms" className="text-sm leading-relaxed text-gray-700 cursor-pointer">
							{t('auth.register.form.terms.prefix')}{' '}
							<button type="button" onClick={()=>setShowLegal('terminos')} className="font-semibold text-brand-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-sm">
								{t('auth.register.form.terms.termsOfService')}
							</button>{' '}{t('auth.register.form.terms.and')}{' '}
							<button type="button" onClick={()=>setShowLegal('privacidad')} className="font-semibold text-brand-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-sm">
								{t('auth.register.form.terms.privacyPolicy')}
							</button>.
						</label>
				</div>
				{touched.terms && !acceptedTerms && (
					<p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{t('auth.register.form.errors.acceptTerms')}
					</p>
				)}
				<button
				type="submit"
					disabled={!formValid || submitting}
					className="relative w-full group inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 bg-size-200 bg-pos-0 hover:bg-pos-100 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:ring-offset-2 overflow-hidden"
				>
					{/* Shine effect */}
					{!submitting && (
						<div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-900 bg-gradient-to-r from-transparent via-white/18 to-transparent" />
					)}
					{submitting && (
						<span className="inline-flex">
							<svg className='animate-spin h-4 w-4 text-white' viewBox='0 0 24 24'>
								<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'/>
								<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z' />
							</svg>
						</span>
					)}
					<span className="relative z-10">{submitting ? t('auth.register.form.submit.submitting') : t('auth.register.form.submit.create')}</span>
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
		{showSmsVerification && (
			<SmsVerificationModal
				open={showSmsVerification}
				defaultPhone={verifiedPhone ?? undefined}
				onVerified={handleSmsVerified}
			/>
		)}
		{showCredentialPrompt && (
			<CredentialVerificationPrompt
				open={showCredentialPrompt}
				phone={verifiedPhone}
				onContinue={handleCredentialContinue}
			/>
		)}
		</>
	);
};
