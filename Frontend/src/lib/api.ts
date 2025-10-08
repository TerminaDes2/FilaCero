// --- Tu código original (sin cambios) ---
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';

export interface ApiError {
  status: number;
  message: string;
}

function getToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('auth_token');
    }
  } catch {}
  return null;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...init, headers });
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // Pequeño log de depuración para ver a dónde está pegando el frontend
    console.debug('[apiFetch]', init.method || 'GET', url);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: (data && (data.message || data.error)) || res.statusText || 'Error',
    };
    throw err;
  }
  return data as T;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

// --- Objeto 'api' con las nuevas funciones añadidas ---
export const api = {
  // --- Tus funciones de Auth (SIN CAMBIOS) ---
  login: (correo_electronico: string, password: string) =>
    apiFetch<LoginResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo_electronico, password }),
    }),
register: (name: string, email: string, password: string, role?: 'usuario' | 'admin') => {
  console.log('📤 Enviando registro a:', `${API_BASE}/auth/register`);
  console.log('📦 Datos enviados:', { name, email, password, role });
  
  return apiFetch<LoginResponse>('auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, ...(role ? { role } : {}) }),
  });
},
  // --- 👇 NUEVAS Funciones de Productos ---

  // Obtener la lista de productos (con filtros opcionales)
  getProducts: (params?: { search?: string; status?: string; id_negocio?: string }) => {
    const merged = { ...(params || {}) } as { [key: string]: string | undefined };
    if (!merged.id_negocio) {
      const negocioEnv = process.env.NEXT_PUBLIC_NEGOCIO_ID;
      if (negocioEnv) merged.id_negocio = negocioEnv;
    }
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value != null && value !== '') {
        queryParams.append(key, String(value));
      }
    }
    const query = queryParams.toString();
    const path = query ? `products?${query}` : 'products';
    return apiFetch<any[]>(path);
  },

  // Crear un nuevo producto
  createProduct: (productData: any) =>
    apiFetch<any>('products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  
  // Actualizar un producto
  updateProduct: (id: string, productData: any) =>
    apiFetch<any>(`products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    }),

  // Eliminar un producto
  deleteProduct: (id: string) =>
    apiFetch<any>(`products/${id}`, {
      method: 'DELETE',
    }),

  // --- 👇 Inventario ---
  // Listar inventario por negocio (opcionalmente filtrar por producto)
  getInventory: (params: { id_negocio?: string; id_producto?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`inventory?${query}`);
  },
  // Crear registro de inventario
  createInventory: (data: { id_negocio: string; id_producto: string; cantidad_actual?: number; stock_minimo?: number }) =>
    apiFetch<any>('inventory', { method: 'POST', body: JSON.stringify(data) }),
  // Actualizar inventario
  updateInventory: (id: string, data: Partial<{ cantidad_actual: number; stock_minimo: number }>) =>
    apiFetch<any>(`inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  // Eliminar inventario
  deleteInventory: (id: string) => apiFetch<any>(`inventory/${id}`, { method: 'DELETE' }),
};