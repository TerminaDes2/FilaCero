"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCategoriesStore } from "../../../pos/categoriesStore";
import { api, activeBusiness } from "../../../lib/api";

interface NewProductPanelProps {
  onClose: () => void;
  onProductCreated: () => void;
}

export const NewProductPanel: React.FC<NewProductPanelProps> = ({
  onClose,
  onProductCreated,
}) => {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const isMounted = useRef(true);

  // --- Estados de Imagen (Paso 1) ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- Manejador de Imagen (Paso 1) ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // --- Limpieza de Imagen (Paso 1) ---
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const categories = useCategoriesStore((state) => state.categories);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

  const updateCategories = useCallback(async () => {
    if (!isMounted.current) return;
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      await fetchCategories();
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      if (isMounted.current) {
        setCategoriesError("No se pudieron cargar las categorías. Intenta nuevamente.");
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoadingCategories(false);
      }
    }
  }, [fetchCategories]);

  useEffect(() => {
    updateCategories().catch(() => {});
  }, [updateCategories]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (category && !categories.some((cat) => cat.id === category)) {
      setCategory("");
    }
  }, [categories, category]);

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === category)?.name ?? "",
    [categories, category],
  );

  const generateSku = () => {
    if (!nombre.trim()) return;
    const gen = nombre.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 16);
    setSku(gen);
  };

  // --- handleSubmit (MODIFICADO - Paso 6) ---
  const handleSubmit = useCallback(
    async () => {
      setError("");
      if (!nombre.trim() || precio <= 0) {
        setError("El nombre y el precio son obligatorios.");
        return;
      }
      setSaving(true);

      try {
        // 1. Preparamos el payload de datos JSON
        const productPayload: any = {
          nombre: nombre.trim(),
          precio: Number(precio),
          estado: active ? "activo" : "inactivo",
          media: [], // Tu backend avanzado espera esto
        };

        if (sku) productPayload.codigo_barras = sku;

        // Lógica para resolver ID de categoría
        if (category) {
          const categoryFromStore = categories.find((cat) => cat.id === category);
          if (categoryFromStore) {
            const idCandidate = categoryFromStore.id.trim();
            const nameCandidate = categoryFromStore.name.trim();
            const identifier = /^\d+$/.test(idCandidate) ? idCandidate : nameCandidate;
            if (identifier) {
              productPayload.id_categoria = identifier;
            }
          } else if (category.trim()) {
            productPayload.id_categoria = category.trim();
          }
        }
        
        // --- 2. ¡AQUÍ ESTÁ LA MODIFICACIÓN FINAL! ---
        // Llamamos a la nueva api.createProductWithImage que soporta imagen opcional
        const created = await api.createProductWithImage(productPayload, imageFile);
              
        const productId = String(created?.id_producto ?? created?.id);

        // 3. Lógica de inventario (sin cambios)
        const negocioId =
          activeBusiness.get() || process.env.NEXT_PUBLIC_NEGOCIO_ID || "";
        const stockInicial = Math.max(Number(stock) || 0, 0);

        if (negocioId && productId) {
          try {
            await api.createInventory({
              id_negocio: negocioId,
              id_producto: productId,
              cantidad_actual: stockInicial,
              stock_minimo: 0,
            });
          } catch (invErr: any) {
            if (invErr?.status !== 409) {
              console.warn("No se pudo registrar inventario inicial:", invErr);
            }
          }
        }

        onProductCreated();
      } catch (err: any) {
        let msg = err?.message || "Ocurrió un error al guardar el producto.";
        if (err?.status === 401) msg = "No autenticado. Inicia sesión para crear productos.";
        if (err?.status === 403) msg = "No tienes permisos para crear productos (requiere rol admin).";
        if (err?.status === 400)
          msg = "Datos inválidos (JSON) o error de archivo (ej. no es imagen).";
        setError(msg);
        console.error("Error al crear producto:", err);
      } finally {
        setSaving(false);
      }
    },
    [nombre, precio, active, sku, category, categories, stock, onProductCreated, imageFile],
  );
  // --- FIN DE handleSubmit ---

  // Foco inicial
  useEffect(() => {
    const t = setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 60);
    return () => clearTimeout(t);
  }, []);

  // Listeners de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        if (!saving) handleSubmit();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving, handleSubmit]);

  return (
    <>
      {/* Overlay */}
      <button
        aria-label="Cerrar editor"
        onClick={onClose}
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] cursor-default z-[90]"
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 h-screen w-[92vw] sm:w-[440px] md:w-[480px] shadow-2xl z-[110] flex flex-col"
        style={{
          background: "var(--pos-card-bg)",
          borderLeft: "1px solid var(--pos-card-border)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center gap-3"
          style={{ borderColor: "var(--pos-card-border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--pos-badge-stock-bg)",
              color: "var(--pos-chip-text)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="7" width="14" height="10" rx="2" />
              <path d="M7 7V5h14v10h-2" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--pos-text-muted)" }}
            >
              Nuevo
            </div>
            <h2
              className="text-xl font-extrabold truncate"
              style={{ color: "var(--pos-text-heading)" }}
            >
              {nombre || "Producto"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 transition-colors"
            style={{ background: "var(--pos-accent-green)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="text-[12px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Información básica */}
          <section
            className="rounded-2xl p-4 space-y-3"
            style={{
              background: "var(--pos-bg-sand)",
              border: "1px solid var(--pos-border-soft)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-extrabold"
                style={{ color: "var(--pos-text-heading)" }}
              >
                Información básica
              </h3>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  background: "var(--pos-badge-stock-bg)",
                  color: "var(--pos-chip-text)",
                }}
              >
                {selectedCategoryName || "Categoría"}
              </span>
            </div>

            {/* Nombre */}
            <div>
              <label
                className="block text-xs mb-1 font-semibold"
                style={{ color: "var(--pos-text-heading)" }}
              >
                Nombre
              </label>
              <input
                ref={nameInputRef}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2"
                style={{
                  height: "var(--pos-control-h)",
                  borderRadius: "var(--pos-control-radius)",
                  background: "var(--pos-card-bg)",
                  border: "1px solid var(--pos-card-border)",
                  color: "var(--pos-text-heading)",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* SKU */}
              <div>
                <label
                  className="block text-xs mb-1 font-semibold"
                  style={{ color: "var(--pos-text-heading)" }}
                >
                  SKU
                </label>
                <div className="flex gap-2">
                  <input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="flex-1 rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2"
                    style={{
                      height: "var(--pos-control-h)",
                      borderRadius: "var(--pos-control-radius)",
                      background: "var(--pos-card-bg)",
                      border: "1px solid var(--pos-card-border)",
                      color: "var(--pos-text-heading)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    className="px-3 rounded-lg text-xs font-semibold transition-colors"
                    style={{
                      height: "var(--pos-control-h)",
                      borderRadius: "var(--pos-control-radius)",
                      background: "var(--pos-card-bg)",
                      border: "1px solid var(--pos-card-border)",
                      color: "var(--pos-text-heading)",
                    }}
                  >
                    Generar
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    className="block text-xs mb-1 font-semibold"
                    style={{ color: "var(--pos-text-heading)" }}
                  >
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      updateCategories().catch(() => {});
                    }}
                    className="text-[11px] font-semibold text-[var(--pos-text-muted)] hover:text-[var(--pos-text-heading)] transition-colors"
                    disabled={loadingCategories}
                  >
                    Actualizar
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="appearance-none w-full rounded-lg pl-3 pr-8 text-sm focus:outline-none focus-visible:ring-2"
                    style={{
                      height: "var(--pos-control-h)",
                      borderRadius: "var(--pos-control-radius)",
                      background: "var(--pos-card-bg)",
                      border: "1px solid var(--pos-card-border)",
                      color: "var(--pos-text-heading)",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      appearance: "none",
                    }}
                    disabled={loadingCategories && categories.length === 0}
                  >
                    <option value="">Sin categoría</option>

                    {loadingCategories && categories.length === 0 && (
                      <option value="" disabled>
                        Cargando categorías…
                      </option>
                    )}

                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--pos-text-muted)" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>

                {categoriesError && (
                  <p className="mt-1 text-[11px] text-rose-600">{categoriesError}</p>
                )}
              </div>
            </div>
          </section>

          {/* Sección de Imagen */}
          <section 
            className='rounded-2xl p-4 space-y-3' 
            style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}
          >
            <h3 className='text-sm font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>
              Imagen del producto
            </h3>
            
            {/* Vista previa de la imagen */}
            {imagePreview && (
              <div className='relative group'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePreview} 
                  alt="Vista previa del producto" 
                  className='w-full h-48 object-cover rounded-lg border' 
                  style={{ borderColor: 'var(--pos-card-border)' }} 
                />
                <button
                  type='button'
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className='absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none'
                  aria-label="Quitar imagen"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Botón para subir (oculta el input real) */}
            {!imagePreview && (
              <label 
                className='w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:bg-black/5' 
                style={{ borderColor: 'var(--pos-card-border)', color: 'var(--pos-text-muted)' }}
              >
                <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' /></svg>
                <span className='mt-2 text-sm font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Subir una imagen</span>
                <span className='text-xs'>Click para seleccionar</span>
                <input 
                  type='file' 
                  className='hidden' 
                  accept="image/png, image/jpeg" 
                  onChange={handleImageChange} 
                />
              </label>
            )}
          </section>

          {/* Precio y stock */}
          <section
            className="rounded-2xl p-4 space-y-3"
            style={{
              background: "var(--pos-bg-sand)",
              border: "1px solid var(--pos-border-soft)",
            }}
          >
            <h3
              className="text-sm font-extrabold"
              style={{ color: "var(--pos-text-heading)" }}
            >
              Precio y stock
            </h3>

            <div className="grid grid-cols-2 gap-3 items-end">
              {/* Precio */}
              <div>
                <label
                  className="block text-xs mb-1 font-semibold"
                  style={{ color: "var(--pos-text-heading)" }}
                >
                  Precio
                </label>
                <div className="relative">
                  <span
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-sm px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "var(--pos-badge-stock-bg)",
                      color: "var(--pos-chip-text)",
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(parseFloat(e.target.value || "0"))}
                    className="w-full rounded-lg pl-8 pr-3 text-sm tabular-nums focus:outline-none focus-visible:ring-2"
                    style={{
                      height: "var(--pos-control-h)",
                      borderRadius: "var(--pos-control-radius)",
                      background: "var(--pos-card-bg)",
                      border: "1px solid var(--pos-card-border)",
                      color: "var(--pos-text-heading)",
                    }}
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label
                  className="block text-xs mb-1 font-semibold"
                  style={{ color: "var(--pos-text-heading)" }}
                >
                  Stock
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value || "0", 10))}
                  className="w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2"
                  style={{
                    height: "var(--pos-control-h)",
                    borderRadius: "var(--pos-control-radius)",
                    background: "var(--pos-card-bg)",
                    border: "1px solid var(--pos-card-border)",
                    color: "var(--pos-text-heading)",
                  }}
                />
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--pos-text-heading)" }}
              >
                Estado
              </span>

              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                  active ? "text-white" : ""
                }`}
                style={
                  active
                    ? { background: "var(--pos-accent-green)" }
                    : {
                        background: "var(--pos-card-bg)",
                        border: "1px solid var(--pos-card-border)",
                        color: "var(--pos-text-heading)",
                      }
                }
              >
                {active ? "Activo" : "Inactivo"}
              </button>
            </div>
          </section>

          {/* Vista previa */}
          <section
            className="rounded-2xl p-4"
            style={{
              background: "var(--pos-card-bg)",
              border: "1px solid var(--pos-card-border)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--pos-text-muted)" }}
                >
                  Vista previa
                </div>
                <h4
                  className="text-base font-extrabold truncate"
                  style={{ color: "var(--pos-text-heading)" }}
                >
                  {nombre || "Producto"}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    style={{
                      background: "var(--pos-badge-stock-bg)",
                      color: "var(--pos-chip-text)",
                    }}
                  >
                    {selectedCategoryName || "Categoría"}
                  </span>

                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums"
                    style={{
                      background: "var(--pos-badge-price-bg)",
                      color: "var(--pos-text-heading)",
                    }}
                  >
                    ${precio.toFixed(2)}
                  </span>
                </div>
              </div>

              <span
                className="text-[11px]"
                style={{ color: "var(--pos-text-muted)" }}
              >
                SKU: {sku || "—"}
              </span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className="p-5 border-t flex items-center justify-between gap-2"
          style={{ borderColor: "var(--pos-card-border)" }}
        >
          <div className="text-[11px] text-[var(--pos-text-muted)] hidden sm:block">
            Esc para cerrar
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 rounded-lg text-sm font-semibold transition-colors"
              style={{
                height: "var(--pos-control-h)",
                borderRadius: "var(--pos-control-radius)",
                background: "var(--pos-card-bg)",
                border: "1px solid var(--pos-card-border)",
                color: "var(--pos-text-heading)",
              }}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              className="px-5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2"
              style={{ height: "var(--pos-control-h)", background: "var(--pos-accent-green)" }}
              disabled={saving}
            >
              {saving ? "Creando…" : "Crear →"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};