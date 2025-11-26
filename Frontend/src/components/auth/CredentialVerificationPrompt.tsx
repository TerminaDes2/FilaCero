"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface CredentialVerificationPromptProps {
	open: boolean;
	phone?: string | null;
	onContinue: () => void;
}

export const CredentialVerificationPrompt: React.FC<CredentialVerificationPromptProps> = ({
	open,
	phone,
	onContinue,
}) => {
	const { t } = useTranslation();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	if (!open || !isMounted) return null;

	return createPortal(
		<div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4">
			<div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
				<div className="flex items-center gap-3">
					<div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md">
						<Sparkles className="h-5 w-5" />
					</div>
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-500 dark:text-brand-300">
							{t('auth.register.credentialPrompt.badge')}
						</p>
						<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
							{t('auth.register.credentialPrompt.title')}
						</h2>
					</div>
				</div>

				<p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
					{t('auth.register.credentialPrompt.subtitle')}
				</p>

				<div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/15">
					<div className="flex items-start gap-3">
						<ShieldCheck className="mt-0.5 h-5 w-5 text-brand-600 dark:text-brand-300" />
						<div className="space-y-2 text-sm">
							<p className="font-semibold text-brand-700 dark:text-brand-200">
								{t('auth.register.credentialPrompt.steps.title')}
							</p>
							<ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
								<li className="flex items-center gap-2">
									<BadgeCheck className="h-4 w-4 text-brand-500 dark:text-brand-200" />
									<span>{t('auth.register.credentialPrompt.steps.capture')}</span>
								</li>
								<li className="flex items-center gap-2">
									<ShieldCheck className="h-4 w-4 text-brand-500 dark:text-brand-200" />
									<span>{t('auth.register.credentialPrompt.steps.verify')}</span>
								</li>
								<li className="flex items-center gap-2">
									<ArrowRight className="h-4 w-4 text-brand-500 dark:text-brand-200" />
									<span>{t('auth.register.credentialPrompt.steps.next')}</span>
								</li>
							</ul>
							{phone ? (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t('auth.register.credentialPrompt.phoneConfirmed', { phone })}
								</p>
							) : null}
						</div>
					</div>
				</div>

				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
					<button
						type="button"
						onClick={onContinue}
						className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 sm:w-auto"
					>
						{t('auth.register.credentialPrompt.cta')}
						<ArrowRight className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
};
