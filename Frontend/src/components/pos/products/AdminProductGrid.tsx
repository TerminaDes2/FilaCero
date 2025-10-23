"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, activeBusiness } from "../../../lib/api";
import { EditProductPanel } from "./EditProductPanel";
import { EditStockPanel } from "./EditStockPanel";
import { useConfirm } from "../../system/ConfirmProvider";

type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number | null; // null => sin información de inventario
  categoryId: string | null;
  categoryName: string;
  active: boolean;
};

type ApiProduct = {
  id_producto: string | number;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  imagen: string | null;
  estado: string | null; // 'activo' | 'inactivo' | null
  codigo_barras?: string | null;
  stock?: number | string | null;
  category?: string | null;
  id_categoria?: string | number | null;
};

export interface AdminProductGridProps {
  search: string;
  view: "grid" | "list";
}

export const AdminProductGrid: React.FC<AdminProductGridProps> = ({
  search,
  view,
}) => {
  const confirm = useConfirm();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null); // holds product id during toggle/delete
  const [invState, setInvState] = useState<any[]>([]); // inventario actual para el negocio

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiProducts: ApiProduct[] = await api.getProducts({ search });
      // Inventario opcional (se mantiene para panel de edición)
      const negocioId =
        activeBusiness.get() || process.env.NEXT_PUBLIC_NEGOCIO_ID || "";
      let invList: any[] = [];
      let stockByProduct: Map<string, number> | undefined;
      if (negocioId) {
        try {
          invList = await api.getInventory({ id_negocio: negocioId });
          stockByProduct = new Map();
          for (const inv of invList) {
            if (inv.id_producto && inv.cantidad_actual != null) {
              stockByProduct.set(
                String(inv.id_producto),
                Number(inv.cantidad_actual)
              );
            }
          }
        } catch (e) {
          console.warn("Inventario no disponible para AdminProductGrid:", e);
        }
      }
      const adapted: AdminProduct[] = apiProducts.map((p) => {
        const id = String(p.id_producto);
        const priceNum =
          typeof p.precio === "number"
            ? p.precio
            : parseFloat(String(p.precio));
        let stockValue: number | null = null;
        if (p.stock !== undefined) {
          if (p.stock === null) {
            stockValue = null;
          } else {
            const parsed =
              typeof p.stock === "number"
                ? p.stock
                : parseFloat(String(p.stock));
            stockValue = Number.isNaN(parsed) ? null : parsed;
          }
        } else if (stockByProduct?.has(id)) {
          stockValue = stockByProduct.get(id) ?? null;
        }
        const categoryId =
          p.id_categoria != null ? String(p.id_categoria) : null;
        const rawCategoryName =
          typeof p.category === "string" ? p.category.trim() : "";
        return {
          id,
          name: p.nombre,
          sku: (p.codigo_barras as any) || "",
          price: isNaN(priceNum) ? 0 : priceNum,
          stock: stockValue,
          categoryId,
          categoryName: rawCategoryName || "Sin categoría",
          active: (p.estado ?? "activo") === "activo",
        };
      });
      setItems(adapted);
      setSelection([]);
      setInvState(invList);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const allSelected = selection.length > 0 && selection.length === items.length;
  const toggle = (id: string) =>
    setSelection((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    );
  const toggleAll = () =>
    setSelection(allSelected ? [] : items.map((p) => p.id));

  const list = useMemo(() => {
    return items; // el ordenado/estado se puede añadir luego
  }, [items]);

  const startEdit = (id: string) => setEditingId(id);
  const closeEdit = () => setEditingId(null);
  const startEditStock = (id: string) => setEditingStockId(id);
  const closeEditStock = () => setEditingStockId(null);

  const handleToggleActive = async (p: AdminProduct) => {
    try {
      const ok = await confirm({
        title: p.active ? "Desactivar producto" : "Activar producto",
        description: p.active
          ? "El producto dejará de estar disponible para la venta."
          : "El producto estará disponible para la venta.",
        confirmText: p.active ? "Desactivar" : "Activar",
        cancelText: "Cancelar",
        tone: "accent",
      });
      if (!ok) return;
      setActionBusy(p.id);
      await api.updateProduct(p.id, {
        estado: p.active ? "inactivo" : "activo",
      });
      await load();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo cambiar el estado.");
    } finally {
      setActionBusy(null);
    }
  };

  const handleDelete = async (p: AdminProduct) => {
    const ok = await confirm({
      title: "Eliminar producto",
      description: `¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    });
    if (!ok) return;
    try {
      setActionBusy(p.id);
      await api.deleteProduct(p.id);
      await load();
    } catch (e: any) {
      console.error(e);
      let msg = e?.message || "No se pudo eliminar el producto.";
      if (e?.status === 409) msg = "No se puede eliminar: tiene dependencias.";
      alert(msg);
    } finally {
      setActionBusy(null);
    }
  };

  if (loading)
    return <div className="text-center py-24">Cargando productos…</div>;
  if (error)
    return <div className="text-center py-24 text-red-500">{error}</div>;
  if (list.length === 0) {
    return (
      <div className="h-[60vh] min-h-[340px] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div
            className="text-[11px] font-semibold uppercase tracking-wide mb-1"
            style={{ color: "var(--pos-text-muted)" }}
          >
            Sin resultados
          </div>
          <p
            className="text-sm mb-3"
            style={{ color: "var(--pos-text-heading)" }}
          >
            No encontramos productos que coincidan con tu búsqueda.
          </p>
        </div>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="relative flex-1 min-h-0 overflow-auto rounded-lg border border-[var(--pos-card-border)] bg-[var(--pos-card-bg)]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-[var(--pos-badge-stock-bg)] text-left">
            <tr>
              <th className="px-3 py-2 w-10">
                <input
                  aria-label="Seleccionar todos los productos"
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-[var(--pos-accent-green)]"
                />
              </th>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2 text-right">Precio</th>
              <th className="px-3 py-2 text-right">Stock</th>
              <th className="px-3 py-2 text-right">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const selected = selection.includes(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-t border-[var(--pos-card-border)] ${
                    selected ? "bg-[var(--pos-badge-stock-bg)]" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      aria-label="Seleccionar producto"
                      type="checkbox"
                      className="accent-[var(--pos-accent-green)]"
                      checked={selected}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td
                    className="px-3 py-2"
                    style={{ color: "var(--pos-text-heading)" }}
                  >
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-[var(--pos-text-muted)]">
                    {p.sku || "—"}
                  </td>
                  <td
                    className="px-3 py-2 text-right tabular-nums"
                    style={{ color: "var(--pos-text-heading)" }}
                  >
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--pos-text-muted)]">
                    {p.stock == null ? (
                      "—"
                    ) : p.stock === 0 ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--pos-badge-stock-bg)",
                          color: "var(--pos-danger-text)",
                        }}
                      >
                        Agotado
                      </span>
                    ) : p.stock < 5 ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--pos-badge-price-bg)",
                          color: "var(--pos-text-heading)",
                        }}
                      >
                        Bajo stock
                      </span>
                    ) : (
                      p.stock
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`text-xs font-medium ${
                        p.active
                          ? "text-[var(--pos-accent-green)]"
                          : "text-[var(--pos-text-muted)]"
                      }`}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => startEdit(p.id)}
                        className="h-8 px-2 rounded-md text-xs font-medium"
                        style={{
                          background: "var(--pos-badge-stock-bg)",
                          color: "var(--pos-chip-text)",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => startEditStock(p.id)}
                        className="h-8 px-2 rounded-md text-xs font-medium"
                        style={{
                          background: "var(--pos-badge-stock-bg)",
                          color: "var(--pos-chip-text)",
                        }}
                      >
                        Stock
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        disabled={actionBusy === p.id}
                        className="h-8 px-2 rounded-md text-xs font-medium disabled:opacity-60"
                        style={{
                          background: "var(--pos-badge-stock-bg)",
                          color: "var(--pos-chip-text)",
                        }}
                      >
                        {p.active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={actionBusy === p.id}
                        className="h-8 px-2 rounded-md text-xs font-medium disabled:opacity-60"
                        style={{
                          background: "var(--pos-badge-stock-bg)",
                          color: "var(--pos-danger-text)",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {editingId &&
          (() => {
            const p = items.find((i) => i.id === editingId);
            if (!p) return null;
            return (
              <EditProductPanel
                initial={{
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  price: p.price,
                  category: p.categoryId ?? "",
                  active: p.active,
                }}
                onClose={closeEdit}
                onSaved={async () => {
                  await load();
                  closeEdit();
                }}
              />
            );
          })()}
        {editingStockId &&
          (() => {
            const p = items.find((i) => i.id === editingStockId);
            if (!p) return null;
            const negocioId =
              activeBusiness.get() || process.env.NEXT_PUBLIC_NEGOCIO_ID || "";
            let inv: any | undefined;
            if (negocioId) {
              inv = invState.find(
                (x) =>
                  String(x.id_producto) === p.id &&
                  String(x.id_negocio) === String(negocioId)
              );
            }
            return (
              <EditStockPanel
                product={{ id: p.id, name: p.name, sku: p.sku }}
                inventory={
                  inv
                    ? {
                        id: String(inv.id_inventario),
                        cantidad_actual: Number(inv.cantidad_actual),
                        stock_minimo: Number(inv.stock_minimo || 0),
                      }
                    : undefined
                }
                onClose={closeEditStock}
                onSaved={async () => {
                  await load();
                  closeEditStock();
                }}
              />
            );
          })()}
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto pr-1 pb-4 custom-scroll-area">
      {/* Select all sticky */}
      <div className="sticky top-0 z-[5] mb-2">
        <label className="w-full rounded-lg px-3 py-2 flex items-center gap-3 bg-[var(--pos-card-bg)] border border-[var(--pos-card-border)] cursor-pointer shadow-sm">
          <input
            type="checkbox"
            className="accent-[var(--pos-accent-green)]"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--pos-text-heading)" }}
          >
            Seleccionar todos ({list.length})
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.map((p) => {
          const selected = selection.includes(p.id);
          return (
            <div
              key={p.id}
              className={
                "group relative rounded-xl p-3 transition shadow-sm hover:shadow-md"
              }
              style={{
                background: "var(--pos-card-bg)",
                border: "1px solid var(--pos-card-border)",
                color: "var(--pos-text-heading)",
                boxShadow: selected
                  ? "inset 0 0 0 2px var(--pos-accent-green)"
                  : undefined,
                opacity: p.active ? 1 : 0.85,
              }}
            >
              <div className="flex items-start gap-2">
                <input
                  aria-label="Seleccionar producto"
                  type="checkbox"
                  className="mt-0.5 accent-[var(--pos-accent-green)]"
                  checked={selected}
                  onChange={() => toggle(p.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                    <div className="flex items-center gap-1">
                      {p.stock !== null && p.stock === 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--pos-badge-stock-bg)",
                            color: "var(--pos-danger-text)",
                          }}
                        >
                          Agotado
                        </span>
                      )}
                      {p.stock !== null && p.stock > 0 && p.stock < 5 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--pos-badge-price-bg)",
                            color: "var(--pos-text-heading)",
                          }}
                        >
                          Bajo stock
                        </span>
                      )}
                      {!p.active && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--pos-tab-bg)",
                            color: "var(--pos-text-muted)",
                          }}
                        >
                          Inactivo
                        </span>
                      )}
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--pos-badge-stock-bg)",
                          color: "var(--pos-chip-text)",
                        }}
                      >
                        {p.categoryName}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--pos-text-muted)] truncate">
                    SKU: {p.sku || "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold tabular-nums">
                      ${p.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-[var(--pos-text-muted)]">
                      Stock: {p.stock == null ? "—" : p.stock}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => startEdit(p.id)}
                  className="h-8 px-2 rounded-md text-xs font-medium"
                  style={{
                    background: "var(--pos-badge-stock-bg)",
                    color: "var(--pos-chip-text)",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => startEditStock(p.id)}
                  className="h-8 px-2 rounded-md text-xs font-medium"
                  style={{
                    background: "var(--pos-badge-stock-bg)",
                    color: "var(--pos-chip-text)",
                  }}
                >
                  Stock
                </button>
                <button
                  onClick={() => handleToggleActive(p)}
                  disabled={actionBusy === p.id}
                  className="h-8 px-2 rounded-md text-xs font-medium disabled:opacity-60"
                  style={{
                    background: "var(--pos-badge-stock-bg)",
                    color: "var(--pos-chip-text)",
                  }}
                >
                  {p.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={actionBusy === p.id}
                  className="h-8 px-2 rounded-md text-xs font-medium disabled:opacity-60"
                  style={{
                    background: "var(--pos-badge-stock-bg)",
                    color: "var(--pos-danger-text)",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {editingId &&
        (() => {
          const p = items.find((i) => i.id === editingId);
          if (!p) return null;
          return (
            <EditProductPanel
              initial={{
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: p.price,
                category: p.categoryId ?? "",
                active: p.active,
              }}
              onClose={closeEdit}
              onSaved={async () => {
                await load();
                closeEdit();
              }}
            />
          );
        })()}
      {editingStockId &&
        (() => {
          const p = items.find((i) => i.id === editingStockId);
          if (!p) return null;
          const negocioId =
            activeBusiness.get() || process.env.NEXT_PUBLIC_NEGOCIO_ID || "";
          let inv: any | undefined;
          if (negocioId) {
            inv = invState.find(
              (x) =>
                String(x.id_producto) === p.id &&
                String(x.id_negocio) === String(negocioId)
            );
          }
          return (
            <EditStockPanel
              product={{ id: p.id, name: p.name, sku: p.sku }}
              inventory={
                inv
                  ? {
                      id: String(inv.id_inventario),
                      cantidad_actual: Number(inv.cantidad_actual),
                      stock_minimo: Number(inv.stock_minimo || 0),
                    }
                  : undefined
              }
              onClose={closeEditStock}
              onSaved={async () => {
                await load();
                closeEditStock();
              }}
            />
          );
        })()}
    </div>
  );
};

export default AdminProductGrid;
