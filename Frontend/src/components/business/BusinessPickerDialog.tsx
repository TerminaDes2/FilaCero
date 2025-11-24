"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export type Business = {
	id_negocio: string;
	nombre: string;
	direccion?: string | null;
	telefono?: string | null;
	correo?: string | null;
	logo_url?: string | null;
	hero_image_url?: string | null;
};

interface Props {
	open: boolean;
	businesses: Business[];
	onChoose: (b: Business) => void;
	onCreateNew?: () => void;
	onClose?: () => void;
}

export function BusinessPickerDialog({ open, businesses, onChoose, onCreateNew, onClose }: Props) {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const hasAny = businesses && businesses.length > 0;
	const [showCreate, setShowCreate] = useState<boolean>(!hasAny);
	const [creating, setCreating] = useState(false);
	const [err, setErr] = useState<string | null>(null);
	const [form, setForm] = useState({ nombre: "", correo: "", telefono: "", direccion: "" });
	const selected = useMemo(
		() => businesses.find((b) => String(b.id_negocio) === String(selectedId)) || null,
		[selectedId, businesses]
	);
	const hadBusinesses = useRef(hasAny);

	useEffect(() => {
		if (!hasAny) {
			setShowCreate(true);
		} else if (!hadBusinesses.current && showCreate) {
			setShowCreate(false);
		}
		hadBusinesses.current = hasAny;
	}, [hasAny, showCreate]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
			<div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-lg" onClick={onClose} aria-hidden />
			<div className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-[0_10px_40px_-6px_rgba(0,0,0,0.5)] border border-white/15 bg-white/95">
				<header className="px-6 py-5 border-b border-white/20 bg-white/60 backdrop-blur flex items-center gap-3">
					<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 border border-white/60">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 21V8l9-5 9 5v13" />
							<path d="M9 22V12h6v10" />
						</svg>
					</span>
					<div className="flex-1">
						<h3 className="text-[15px] font-semibold text-gray-900">{showCreate ? "Crea un negocio" : "Elige tu negocio"}</h3>
						<p className="text-xs mt-0.5 text-gray-600">
							{showCreate
								? "Completa los datos básicos para empezar a vender."
								: "Selecciona con cuál quieres operar ahora. Puedes cambiarlo cuando quieras."}
						</p>
					</div>
				</header>

				<div className="p-6 space-y-4">
					{showCreate && (
						<form
							className="space-y-3"
							onSubmit={async (e) => {
								e.preventDefault();
								setErr(null);
								if (!form.nombre.trim()) {
									setErr("El nombre es obligatorio");
									return;
								}
								if (form.correo && !/.+@.+\..+/.test(form.correo)) {
									setErr("Correo inválido");
									return;
								}

								try {
									setCreating(true);
									const created = await api.createBusiness({
										nombre: form.nombre.trim(),
										direccion: form.direccion.trim() || undefined,
										telefono: form.telefono.trim() || undefined,
										correo: form.correo.trim() || undefined
									});
									const b: Business = {
										id_negocio: String(created.id_negocio ?? created.id ?? created.idNegocio),
										nombre: created.nombre ?? form.nombre.trim(),
										direccion: (created.direccion ?? form.direccion) || null,
										telefono: (created.telefono ?? form.telefono) || null,
										correo: (created.correo ?? form.correo) || null,
										logo_url: created.logo_url ?? null,
										hero_image_url: created.hero_image_url ?? null
									};
									onChoose(b);
								} catch (error: any) {
									setErr(error?.message || "No se pudo crear el negocio");
								} finally {
									setCreating(false);
								}
							}}
						>
							{err && (
								<div className="text-[12px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2">{err}</div>
							)}
							<div>
								<label className="block text-xs font-medium mb-1 text-gray-600">Nombre del negocio</label>
								<input
									className="w-full h-11 px-3 rounded-xl bg-white/90 border border-gray-300/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
									value={form.nombre}
									onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
									placeholder="Ej. La Taquería del Centro"
									required
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-medium mb-1 text-gray-600">Correo (opcional)</label>
									<input
										className="w-full h-11 px-3 rounded-xl bg-white/90 border border-gray-300/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
										value={form.correo}
										onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
										placeholder="contacto@ejemplo.com"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium mb-1 text-gray-600">Teléfono (opcional)</label>
									<input
										className="w-full h-11 px-3 rounded-xl bg-white/90 border border-gray-300/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
										value={form.telefono}
										onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
										placeholder="(555) 123-4567"
									/>
								</div>
							</div>
							<div>
								<label className="block text-xs font-medium mb-1 text-gray-600">Dirección (opcional)</label>
								<input
									className="w-full h-11 px-3 rounded-xl bg-white/90 border border-gray-300/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
									value={form.direccion}
									onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
									placeholder="Calle 123, Colonia, Ciudad"
								/>
							</div>
							<div className="flex items-center justify-between pt-2">
								<button
									type="button"
									className="px-3 h-10 rounded-lg text-gray-700 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
									onClick={() => {
										setShowCreate(false);
										setErr(null);
									}}
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={creating || !form.nombre.trim()}
									className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-brand-600 text-white font-semibold disabled:bg-gray-300 shadow-glow hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
								>
									{creating && (
										<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
											<circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
											<path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
										</svg>
									)}
									Crear y continuar
								</button>
							</div>
						</form>
					)}

					{!showCreate && hasAny && (
						<>
							<p className="text-sm text-gray-600">Selecciona con cuál quieres operar ahora. Podrás cambiarlo luego.</p>
							<ul className="max-h-72 overflow-auto -mx-2 pr-2 space-y-2">
								{businesses.map((b) => (
									<li key={b.id_negocio}>
										<button
											type="button"
											onClick={() => setSelectedId(String(b.id_negocio))}
											className={`w-full text-left px-4 py-3 rounded-2xl border flex items-center gap-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
												String(selectedId) === String(b.id_negocio) ? "ring-2 ring-brand-500 bg-brand-50" : "hover:bg-black/5"
											}`}
											aria-pressed={String(selectedId) === String(b.id_negocio)}
											style={{ borderColor: "rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.92)", color: "#0f172a" }}
										>
											<div className="flex-1 min-w-0">
												<div className="font-medium truncate">{b.nombre}</div>
												{(b.direccion || b.telefono) && (
													<div className="text-xs truncate text-gray-600">
														{[b.direccion, b.telefono].filter(Boolean).join(" • ")}
													</div>
												)}
											</div>
											<span
												className={`inline-flex h-5 w-5 rounded-full ring-1 ${
													String(selectedId) === String(b.id_negocio) ? "bg-brand-600 ring-brand-600" : "ring-gray-300"
												}`}
											/>
										</button>
									</li>
								))}
							</ul>

							<div className="flex items-center justify-between pt-2">
								<button
									type="button"
									onClick={() => {
										if (onCreateNew) onCreateNew();
										setShowCreate(true);
									}}
									className="inline-flex items-center gap-2 px-3 h-10 rounded-lg text-brand-600 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
								>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M12 5v14M5 12h14" />
									</svg>
									Agregar otro negocio
								</button>
								<button
									type="button"
									disabled={!selected}
									onClick={() => selected && onChoose(selected)}
									className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-brand-600 text-white font-semibold disabled:bg-gray-300 shadow-glow hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
								>
									Continuar
								</button>
							</div>
						</>
					)}
				</div>
				<footer className="px-6 py-4 border-t border-white/20 bg-white/60 backdrop-blur flex items-center justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-3 h-9 text-sm rounded-lg text-gray-700 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
					>
						Cerrar
					</button>
				</footer>
			</div>
		</div>
	);
}
export {};
