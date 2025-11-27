"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

type VerificationStage = 'none' | 'email' | 'sms' | 'credential';

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
	const [showSmsVerification, setShowSmsVerification] = useState(false);
	const [showCredentialPrompt, setShowCredentialPrompt] = useState(false);
	const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
	const [pendingEmail, setPendingEmail] = useState<string | null>(null);
	const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null);
	const [verificationSession, setVerificationSession] = useState<string | null>(null);
	const [verificationStage, setVerificationStage] = useState<VerificationStage>('none');
	const [resumingVerification, setResumingVerification] = useState(false);

	const verificationInProgress = verificationStage !== 'none';

	const pendingVerificationMessage = useMemo(() => {
		if (verificationStage === 'email') return t('auth.register.form.pendingVerification.messages.email');
		if (verificationStage === 'sms') return t('auth.register.form.pendingVerification.messages.sms');
		if (verificationStage === 'credential') return t('auth.register.form.pendingVerification.messages.credential');
		return null;
	}, [verificationStage, t]);

	const resetVerificationState = useCallback(() => {
		setShowVerificationModal(false);
		setShowSmsVerification(false);
		setShowCredentialPrompt(false);
		setVerificationStage('none');
		setPendingEmail(null);
		setVerificationExpiresAt(null);
		setVerificationSession(null);
		setVerifiedPhone(null);
		setError(null);
		setResumingVerification(false);
		try {
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem('preRegSession');
				window.localStorage.removeItem('preRegExpiresAt');
				window.localStorage.removeItem('preRegEmail');
			}
		} catch {}
	}, []);

	const resumePendingVerification = useCallback(async () => {
		if (resumingVerification || verificationStage === 'none') return;
		setResumingVerification(true);
		try {
			if (verificationStage === 'email') {
				let sessionToUse = verificationSession;
				if (!sessionToUse && typeof window !== 'undefined') {
					sessionToUse = window.localStorage.getItem('preRegSession');
				}
				if (!sessionToUse) {
					setError(t('auth.register.form.pendingVerification.errors.sessionExpired'));
					resetVerificationState();
					return;
				}
				const result = await api.resendRegister(sessionToUse);
				setVerificationSession(result.session ?? sessionToUse);
				setVerificationExpiresAt(result.expiresAt ?? null);
				try {
					if (typeof window !== 'undefined') {
						window.localStorage.setItem('preRegSession', result.session ?? sessionToUse);
						if (result.expiresAt) window.localStorage.setItem('preRegExpiresAt', result.expiresAt);
					}
				} catch {}
				setShowSmsVerification(false);
				setShowCredentialPrompt(false);
				setShowVerificationModal(true);
				setVerificationStage('email');
				setError(null);
			} else if (verificationStage === 'sms') {
				setShowVerificationModal(false);
				setShowCredentialPrompt(false);
				setShowSmsVerification(true);
				setError(null);
			} else if (verificationStage === 'credential') {
				setShowVerificationModal(false);
				setShowSmsVerification(false);
				setShowCredentialPrompt(true);
				setError(null);
			}
		} catch (err: any) {
			setError(err?.message || t('auth.register.form.pendingVerification.errors.resendFailed'));
		} finally {
			setResumingVerification(false);
		}
	}, [resumingVerification, verificationStage, verificationSession, t, resetVerificationState]);

	useEffect(() => {
		if (verificationStage === 'none' || !pendingEmail) return;
		const normalized = email.trim().toLowerCase();
		if (!normalized || normalized !== pendingEmail) {
			resetVerificationState();
		}
	}, [email, pendingEmail, verificationStage, resetVerificationState]);

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
		const normalizedEmail = email.trim().toLowerCase();
		if (verificationStage !== 'none') {
			if (pendingEmail && normalizedEmail !== pendingEmail) {
				resetVerificationState();
			} else {
				setError(t('auth.register.form.errors.pendingVerification'));
				await resumePendingVerification();
				return;
			}
		}
		// Exigir selección de rol explícita para evitar registros ambiguos
		if(!role) {
			setError(t('auth.register.form.errors.noRole'));
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const roleName: 'usuario' | 'admin' = isOwner ? 'admin' : 'usuario';
			const res = await api.register(
				name.trim(),
				normalizedEmail,
				password,
				roleName,
				accountNumberClean || undefined,
				ageValue
			);
			if (res.requiresVerification) {
				setPendingEmail(normalizedEmail);
				setVerificationExpiresAt(res.expiresAt ?? null);
				setVerificationSession(res.session ?? null);
				setVerificationStage('email');
				setShowSmsVerification(false);
				setShowCredentialPrompt(false);
				setVerifiedPhone(null);
				try {
					if (typeof window !== 'undefined') {
						if (res.session) window.localStorage.setItem('preRegSession', res.session);
						if (res.expiresAt) window.localStorage.setItem('preRegExpiresAt', res.expiresAt);
						window.localStorage.setItem('preRegEmail', normalizedEmail);
					}
				} catch {}
				setShowVerificationModal(true);
			} else {
				resetVerificationState();
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
		setVerificationStage('email');
		setShowSmsVerification(false);
		setShowCredentialPrompt(false);
		setVerifiedPhone(null);
		setError(t('auth.register.form.errors.pendingVerification'));
	}, [t]);

	const handleVerificationSuccess = useCallback(() => {
		setShowVerificationModal(false);
		setVerificationStage('sms');
		setVerificationSession(null);
		setVerificationExpiresAt(null);
		setShowSmsVerification(true);
		setError(null);
	}, []);

	const handleSmsVerified = useCallback(({ phone }: { phone: string }) => {
		setVerifiedPhone(phone);
		setVerificationStage('credential');
		setError(null);
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

	const handleSmsClose = useCallback(() => {
		setShowSmsVerification(false);
		setVerificationStage('sms');
		setShowCredentialPrompt(false);
		setVerifiedPhone(null);
		setError(t('auth.register.form.errors.pendingVerification'));
	}, [t]);

	const handleCredentialContinue = useCallback(() => {
		resetVerificationState();
		const redirectTo = isOwner ? '/onboarding/negocio' : '/onboarding/customer';
		const target = `/verification/credencial?redirect=${encodeURIComponent(redirectTo)}`;
		router.push(target);
	}, [isOwner, resetVerificationState, router]);

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
				<div className="flex items-start gap-2.5 rounded-xl border border-gray-200/60 bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 p-3 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-700/60 dark:from-slate-950/90 dark:via-slate-950/85 dark:to-slate-950/70 dark:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.75)]">
					<input
						id="terms"
						type="checkbox"
						checked={acceptedTerms}
						onChange={e=>setAcceptedTerms(e.target.checked)}
						className="mt-0.5 h-4 w-4 rounded-md border border-gray-300 bg-white/60 text-brand-600 transition-all focus:ring-1 focus:ring-brand-500 focus:ring-offset-1 focus:ring-offset-white cursor-pointer dark:border-slate-600 dark:bg-slate-900/60 dark:text-brand-300 dark:focus:ring-brand-300 dark:focus:ring-offset-slate-950"
					/>
						<label htmlFor="terms" className="text-sm leading-relaxed text-gray-700 transition-colors cursor-pointer dark:text-slate-200">
							{t('auth.register.form.terms.prefix')}{' '}
							<button type="button" onClick={()=>setShowLegal('terminos')} className="rounded-sm font-semibold text-brand-600 underline-offset-2 transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-300 dark:hover:text-brand-200 dark:focus-visible:ring-brand-300/80">
								{t('auth.register.form.terms.termsOfService')}
							</button>{' '}{t('auth.register.form.terms.and')}{' '}
							<button type="button" onClick={()=>setShowLegal('privacidad')} className="rounded-sm font-semibold text-brand-600 underline-offset-2 transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-brand-300 dark:hover:text-brand-200 dark:focus-visible:ring-brand-300/80">
								{t('auth.register.form.terms.privacyPolicy')}
							</button>.
						</label>
				</div>
				{touched.terms && !acceptedTerms && (
					<p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{t('auth.register.form.errors.acceptTerms')}
					</p>
				)}
				<button
				type="submit"
					disabled={!formValid || submitting || verificationInProgress || resumingVerification}
					className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#D55D7B] via-[#9864FF] to-[#42A8C2] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#9864FF]/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:ring-offset-2 focus:ring-offset-white hover:-translate-y-[1px] hover:shadow-xl hover:shadow-[#9864FF]/35 active:translate-y-0 active:shadow-lg disabled:cursor-not-allowed disabled:from-slate-500 disabled:via-slate-500 disabled:to-slate-500 disabled:text-slate-200 disabled:shadow-none disabled:hover:-translate-y-0 disabled:hover:shadow-none dark:shadow-[0_25px_55px_-30px_rgba(87,63,190,0.9)] dark:hover:shadow-[0_30px_65px_-30px_rgba(87,63,190,0.95)] dark:focus:ring-brand-300/70 dark:focus:ring-offset-slate-950"
				>
					<div className="absolute inset-0">
						<div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-80 dark:from-white/12 dark:via-transparent dark:to-white/5" />
						<div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 blur-sm transition-all duration-[1100ms] group-hover:translate-x-[120%] group-hover:opacity-100 dark:via-white/30" />
						<div className="pointer-events-none absolute -inset-6 scale-75 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_55%)] opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top,rgba(152,100,255,0.45),transparent_65%)]" />
					</div>
					{submitting && (
						<span className="relative inline-flex">
							<svg className='h-4 w-4 animate-spin text-white' viewBox='0 0 24 24'>
								<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'/>
								<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z' />
							</svg>
						</span>
					)}
					<span className="relative z-10 tracking-wide">
						{submitting
							? t('auth.register.form.submit.submitting')
							: verificationInProgress
								? t('auth.register.form.submit.pending')
								: t('auth.register.form.submit.create')}
					</span>
					{!submitting && !verificationInProgress && (
						<svg className="relative z-10 h-5 w-5 transform transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					)}
				</button>
				{verificationInProgress && pendingVerificationMessage && (
					<div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/95 px-3 py-2.5 text-xs text-amber-800 shadow-sm transition dark:border-amber-300/60 dark:bg-amber-500/25 dark:text-amber-100">
						<svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.596c.75 1.335-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.67-1.742-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-.75-6.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" clipRule="evenodd" />
						</svg>
						<div className="space-y-1.5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-100">
								{t('auth.register.form.pendingVerification.title')}
							</p>
							<p className="text-xs leading-relaxed text-amber-800 dark:text-amber-100/95">
								{pendingVerificationMessage}
							</p>
							<button
								type="button"
								onClick={() => { void resumePendingVerification(); }}
								disabled={resumingVerification}
								className="inline-flex items-center gap-1 rounded-lg border border-amber-400/80 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-500 hover:text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:ring-offset-1 focus:ring-offset-amber-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-amber-300/70 dark:text-amber-100 dark:hover:border-amber-200 dark:hover:text-amber-50 dark:focus:ring-amber-200/70 dark:focus:ring-offset-slate-950"
							>
								{resumingVerification ? (
									<>
										<svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
											<circle cx="10" cy="10" r="8" className="opacity-30" />
											<path className="opacity-80" d="M18 10a8 8 0 0 0-8-8" />
										</svg>
										<span>{t('auth.register.form.pendingVerification.resending')}</span>
									</>
								) : (
									<>
										<svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
											<path d="M2 10a8 8 0 1114.32 4.906l1.387 1.387a.75.75 0 01-1.06 1.06l-1.387-1.386A8 8 0 012 10zm8-6.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm.75 3.25a.75.75 0 00-1.5 0v3.25c0 .414.336.75.75.75h2.75a.75.75 0 000-1.5H10.75V6.75z" />
										</svg>
										<span>{t('auth.register.form.pendingVerification.resume')}</span>
									</>
								)}
							</button>
						</div>
					</div>
				)}
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
				onClose={handleSmsClose}
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
