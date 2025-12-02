"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FancyInput } from './FancyInput';
import { api, activeBusiness } from '../../lib/api';
import { useUserStore } from "../../state/userStore";
import { useBusinessStore } from '../../state/businessStore';
import { useTranslation } from '../../hooks/useTranslation';
import { BusinessPickerDialog } from '../business/BusinessPickerDialog';
import { RecoverPasswordModal } from './RecoverPasswordModal';
import type { Business } from '../business/BusinessPickerDialog';

interface LoginFormProps {
	onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
	const [error, setError] = useState<string | null>(null);
	const [businessPickerOpen, setBusinessPickerOpen] = useState(false);
	const [recoverModalOpen, setRecoverModalOpen] = useState(false);
	const [businessOptions, setBusinessOptions] = useState<Business[]>([]);
	const router = useRouter();
	const { setName, setBackendRole, login } = useUserStore();
	const { setActiveBusiness, clearBusiness } = useBusinessStore();
	const { t } = useTranslation();
	// Navegación directa según rol

	const emailValid = /.+@.+\..+/.test(email);
	const passwordValid = password.length >= 6;
	const formValid = emailValid && passwordValid;

	const fetchAndShowBusinessPicker = async (contextLabel: string) => {
		const businesses = await api.listMyBusinesses();
		console.log(`📊 Negocios ${contextLabel}:`, businesses);
		const normalized: Business[] = Array.isArray(businesses)
			? businesses
				.map((biz: any) => ({
					id_negocio: String(biz.id_negocio ?? biz.id ?? biz.idNegocio ?? ''),
					nombre: biz.nombre ?? 'Negocio',
					direccion: biz.direccion ?? null,
					telefono: biz.telefono ?? null,
					correo: biz.correo ?? null,
					logo_url: biz.logo_url ?? null,
					hero_image_url: biz.hero_image_url ?? null,
				}))
				.filter((biz: Business) => Boolean(biz.id_negocio))
			: [];

		if (normalized.length === 0) {
			console.log(`🎯 ${contextLabel} sin negocios disponibles, redirigiendo a crear negocio`);
			router.push('/onboarding/negocio');
			return;
		}

		console.log(`🎯 ${contextLabel} debe seleccionar negocio antes de entrar al POS`);
		try { activeBusiness.clear(); } catch { }
		clearBusiness();
		setBusinessOptions(normalized);
		setBusinessPickerOpen(true);
	};

	const handleBusinessChosen = (business: Business) => {
		const normalizedId = String(business.id_negocio);
		activeBusiness.set(normalizedId);
		setActiveBusiness({
			id_negocio: normalizedId,
			nombre: business.nombre,
			direccion: business.direccion ?? null,
			telefono: business.telefono ?? null,
			correo: business.correo ?? null,
			logo_url: business.logo_url ?? null,
			hero_image_url: business.hero_image_url ?? null,
		});
		setBusinessPickerOpen(false);
		router.push('/pos');
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTouched({ email: true, password: true });
		if (!formValid) return;

		setSubmitting(true);
		setError(null);

		try {
			// 1. Limpiar completamente el storage antes del login para evitar headers grandes
			if (typeof window !== 'undefined') {
				try {
					window.localStorage.removeItem('auth_token');
					window.localStorage.removeItem('auth_user');
					// Limpiar todas las cookies para evitar 431
					document.cookie.split(";").forEach((c) => {
						document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
					});
				} catch { }
			}

			// 2. Hacer login para obtener el token
			const res = await api.login(email.trim().toLowerCase(), password);
			console.log('[LoginForm] Login response received:', { tokenLength: res.token?.length, userEmail: res.user?.email });

			if (typeof window !== 'undefined') {
				window.localStorage.setItem('auth_token', res.token);
				console.log('[LoginForm] Token saved to localStorage');
				// Guardar datos básicos del login temporalmente
				window.localStorage.setItem('auth_user', JSON.stringify(res.user));
			}

			onSuccess?.();
			// 3. Redirección temprana para empleados: si el login ya incluye id_rol === 3
			// redirigimos inmediatamente al POS para mejorar la UX.
			const basicUser = res.user as any;
			console.log('[LoginForm] basicUser from login:', basicUser);
			const basicRoleId = Number(basicUser?.id_rol ?? basicUser?.idRol ?? basicUser?.role?.id_rol ?? basicUser?.role?.id ?? NaN);
			const basicRoleName = (basicUser?.role_name ?? basicUser?.role?.nombre_rol ?? '').toString().toLowerCase();
			if (!Number.isNaN(basicRoleId) && basicRoleId === 3) {
				// Actualizar store y redirigir sin esperar la llamada a /auth/me
				login(res.token, basicUser);
				try {
					const businesses = await api.listMyBusinesses();
					if (Array.isArray(businesses) && businesses.length > 0) {
						const b = businesses[0];
						setActiveBusiness({ id_negocio: String(b.id_negocio ?? b.id ?? b.uuid ?? ''), nombre: b.nombre || '' });
					}
				} catch (e) {
					// ignore
				}
				console.log('🎯 Empleado detectado en login, redirigiendo a /pos');
				router.push('/pos');
				return;
			}
			// Fallback: si el nombre del rol indica empleado (p.ej. 'empleado', 'employee')
			if (basicRoleName && (basicRoleName.includes('emple') || basicRoleName.includes('employee'))) {
				login(res.token, basicUser);
				console.log('🎯 Empleado detectado por role_name, redirigiendo a /pos');
				router.push('/pos');
				return;
			}

			// 4. Obtener información COMPLETA del usuario incluyendo el rol
			console.log('🔄 Obteniendo información completa del usuario...');
			const userInfo = await api.me();

			// 4. Actualizar store con login
			login(res.token, userInfo);

			// 5. Determinar rol y redirigir según reglas de negocio
			const roleName = (userInfo as any).role_name || userInfo.role?.nombre_rol || null;
			// Asegurarse de que idRol sea un número antes de comparar
			const idRol = Number(userInfo.id_rol);

			console.log('👤 Información del usuario:', { roleName, idRol, userInfo });

			// Lógica de redirección según rol
			if (idRol === 4) {
				console.log('🎯 Cliente detectado, redirigiendo a /shop');
				router.push('/shop');
				return;
			}

			if (idRol === 3) {
				try {
					const businesses = await api.listMyBusinesses();
					if (Array.isArray(businesses) && businesses.length > 0) {
						const b = businesses[0];
						setActiveBusiness({ id_negocio: String(b.id_negocio ?? b.id ?? b.uuid ?? ''), nombre: b.nombre || '' });
					}
				} catch (e) {
					// ignore
				}
				console.log('🎯 Empleado detectado, redirigiendo a /pos');
				router.push('/pos');
				return;
			}

			if (idRol === 2 || idRol === 1) {
				console.log('🎯 Admin/Superadmin detectado, verificando negocios...');

				try {
					const businesses = await api.listMyBusinesses();
					console.log('📊 Negocios del admin:', businesses);

					if (businesses && businesses.length > 0) {
						console.log('🎯 Admin con negocio(s), redirigiendo a /pos');
						router.push('/pos');
					} else {
						console.log('🎯 Admin sin negocio, redirigiendo a crear negocio');
						router.push('/onboarding/negocio');
					}
				} catch (businessErr) {
					console.error('❌ Error al obtener negocios:', businessErr);
					router.push('/onboarding/negocio');
				}
				return;
			}

			console.log('🎯 Rol no identificado, redirigiendo a /shop (fallback)');
			router.push('/shop');

		} catch (err: any) {
			console.error('❌ Error en login:', err);

			// Limpiar localStorage en caso de error
			if (typeof window !== 'undefined') {
				window.localStorage.removeItem('auth_token');
				window.localStorage.removeItem('auth_user');
			}

			setError(err?.message || 'Error al iniciar sesión');
		} finally {
			setSubmitting(false);
		}
	};

	// ... el resto del código permanece igual ...
	return (
		<form onSubmit={submit} className="space-y-6" aria-describedby="login-hint">
			{/* Supportive microcopy / context */}
			<div id="login-hint" className="-mb-1 flex items-start gap-3 rounded-lg border border-white/60 bg-gradient-to-r from-brand-50/70 to-emerald-50/60 px-3 py-2 text-[11px] leading-relaxed text-gray-600 shadow-sm dark:border-slate-700/70 dark:bg-gradient-to-r dark:from-slate-900/75 dark:via-slate-900/80 dark:to-slate-900/70 dark:text-slate-200/90 dark:shadow-[0_18px_32px_-28px_rgba(2,6,23,0.7)]">
				<svg className='w-5 h-5 mt-0.5 text-brand-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
					<rect x='3' y='10' width='18' height='11' rx='2' />
					<path strokeLinecap='round' strokeLinejoin='round' d='M8 10V8a4 4 0 0 1 8 0v2' />
					<path strokeLinecap='round' strokeLinejoin='round' d='M12 14v3' />
				</svg>
				<p>
					{t('auth.login.hint')} <span className="hidden sm:inline">{t('auth.login.newAccount')} {t('auth.login.createAccount')}</span>
				</p>
			</div>

			{error && (
				<div className="text-[12px] text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200/70 dark:border-rose-800 rounded-md px-3 py-2">
					{error || t('auth.login.errorGeneric')}
				</div>
			)}

			<FancyInput
				label={t('auth.login.emailLabel')}
				type="email"
				value={email}
				onChange={e => setEmail(e.target.value)}
				onBlur={() => setTouched(t => ({ ...t, email: true }))}
				error={touched.email && !emailValid ? t('auth.login.emailError') : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><path strokeLinecap='round' strokeLinejoin='round' d='M4 6l8 6 8-6M4 6v12h16V6' /></svg>}
				hint={email ? undefined : t('auth.login.emailHint')}
			/>

			<FancyInput
				label={t('auth.login.passwordLabel')}
				type={showPassword ? 'text' : 'password'}
				value={password}
				onChange={e => setPassword(e.target.value)}
				onBlur={() => setTouched(t => ({ ...t, password: true }))}
				error={touched.password && !passwordValid ? t('auth.login.passwordError') : undefined}
				leftIcon={<svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2'><rect x='4' y='8' width='16' height='12' rx='2' /><path strokeLinecap='round' strokeLinejoin='round' d='M8 8V6a4 4 0 1 1 8 0v2' /></svg>}
				isPassword
				onTogglePassword={() => setShowPassword(s => !s)}
				hint={!password ? t('auth.login.passwordHint') : undefined}
			/>

			<div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
				<label className="inline-flex items-center gap-2 cursor-pointer select-none">
					<input type='checkbox' className='h-4 w-4 appearance-none rounded border-gray-300 text-brand-600 focus:ring-brand-500 checked:border-brand-600 checked:bg-brand-600 dark:border-slate-600 dark:bg-slate-900 dark:checked:border-brand-500 dark:focus:ring-offset-slate-950' />
					<span>{t('auth.login.remember')}</span>
				</label>
				<button
					type="button"
					onClick={() => setRecoverModalOpen(true)}
					className='font-medium text-brand-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded'
				>
					{t('auth.login.forgot')}
				</button>
			</div>

			<button
				type="submit"
				disabled={!formValid || submitting}
				className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f43f5e] via-[#ec4899] to-[#14b8a6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-xl hover:brightness-[1.02] active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-[#f472b6]/60 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:from-gray-500 disabled:via-gray-500 disabled:to-gray-500 dark:from-[#fb7185] dark:via-[#f472b6] dark:to-[#22d3ee] dark:shadow-[0_18px_54px_-30px_rgba(45,212,191,0.55)] dark:focus:ring-[#22d3ee]/60 dark:focus:ring-offset-slate-950"
			>
				<span className="absolute -top-2 right-2 kbd-hint opacity-0 group-focus-visible:opacity-100">Enter para entrar</span>
				{submitting && (
					<span className="absolute left-4 inline-flex">
						<svg className='animate-spin h-4 w-4 text-white' viewBox='0 0 24 24'>
							<circle className='opacity-30' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
							<path className='opacity-90' fill='currentColor' d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z' />
						</svg>
					</span>
				)}
				{submitting ? t('auth.login.submitting') : t('auth.login.submit')}
			</button>

			<div className="pt-1 text-center">
				<div className="border-t border-gray-200 pt-3 dark:border-slate-800/70">
					<p className="text-xs text-gray-600 dark:text-slate-300">
						{t('auth.login.newAccount')}&nbsp;
						<a
							href="/auth/register"
							className="font-medium text-brand-600 hover:underline dark:text-brand-300"
						>
							{t('auth.login.createAccount')}
						</a>
					</p>
				</div>
			</div>

			<BusinessPickerDialog
				open={businessPickerOpen}
				businesses={businessOptions}
				onChoose={handleBusinessChosen}
				onCreateNew={() => {
					setBusinessPickerOpen(false);
					router.push('/onboarding/negocio');
				}}
				onClose={() => setBusinessPickerOpen(false)}
			/>

			<RecoverPasswordModal
				open={recoverModalOpen}
				onClose={() => setRecoverModalOpen(false)}
				initialEmail={email}
			/>
		</form>
	);
};