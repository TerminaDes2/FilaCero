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

  // Tu inicialización de headers está bien
  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(init.body instanceof FormData)) {
    // 👇 AQUÍ ESTÁ LA CORRECCIÓN
    // Le decimos a TypeScript: "Trata 'headers' como un objeto simple aquí"
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...init, headers });
  
  // ... (el resto de tu función no cambia)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
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

// --- Interfaces (sin cambios) ---
export interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

export interface UserInfo {
  id_usuario: number;
  nombre: string;
  correo_electronico: string;
  id_rol: number;
  role_name?: string;
  role?: { id_rol: number; nombre_rol: string };
  numero_telefono?: string;
  fecha_nacimiento?: string;
  fecha_registro?: string;
  estado?: string;
}

// --- Objeto principal con métodos actualizados ---
export const api = {
  // --- Auth (sin cambios) ---
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

  me: () => apiFetch<UserInfo>('auth/me'),

  // --- Productos ---
  getProducts: (params?: { search?: string; status?: string; id_negocio?: string }) => {
    // ... (Tu lógica de getProducts sin cambios) ...
    const merged = { ...(params || {}) } as { [key: string]: string | undefined };
    if (!merged.id_negocio) {
      let negocioId: string | undefined = undefined;
      try { negocioId = typeof window !== 'undefined' ? localStorage.getItem('active_business_id') || undefined : undefined; } catch {}
      if (!negocioId) {
        const negocioEnv = process.env.NEXT_PUBLIC_NEGOCIO_ID;
        if (negocioEnv) negocioId = negocioEnv;
      }
      if (negocioId) merged.id_negocio = negocioId;
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

  // 👇 =============================================
  //     MÉTODO 'createProduct' MODIFICADO
  // =============================================
  createProduct: (formData: FormData) => // 👈 Ahora espera un FormData
    apiFetch<any>('products', {
      method: 'POST',
      body: formData, // 👈 Envía el FormData directamente (sin stringify)
    }),

  // 👇 =============================================
  //     MÉTODO 'updateProduct' MODIFICADO
  // =============================================
  updateProduct: (id: string, formData: FormData) => // 👈 Ahora espera un FormData
    apiFetch<any>(`products/${id}`, {
      method: 'PATCH',
      body: formData, // 👈 Envía el FormData directamente (sin stringify)
    }),

  deleteProduct: (id: string) =>
    apiFetch<any>(`products/${id}`, {
      method: 'DELETE',
    }),

  // --- El resto de tus métodos (Categorías, Negocios, etc.) sin cambios ---
  getCategories: () => 
    apiFetch<any[]>('categories'),
  getCategoryById: (id: string) =>
    apiFetch<any>(`categories/${id}`),
  createCategory: (categoryData: { nombre: string }) =>
    apiFetch<any>('categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }),
  updateCategory: (id: string, categoryData: { nombre: string }) =>
    apiFetch<any>(`categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    }),
  deleteCategory: (id: string) =>
    apiFetch<any>(`categories/${id}`, {
      method: 'DELETE',
    }),
  createBusiness: (data: { nombre: string; direccion?: string; telefono?: string; correo?: string; logo?: string }) =>
    apiFetch<any>('businesses', { method: 'POST', body: JSON.stringify(data) }),
  listMyBusinesses: () => apiFetch<any[]>('businesses/my'),
  getInventory: (params: { id_negocio?: string; id_producto?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`inventory?${query}`);
  },
  createInventory: (data: { id_negocio: string; id_producto: string; cantidad_actual?: number; stock_minimo?: number }) =>
    apiFetch<any>('inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventory: (id: string, data: Partial<{ cantidad_actual: number; stock_minimo: number }>) =>
    apiFetch<any>(`inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteInventory: (id: string) => apiFetch<any>(`inventory/${id}`, { method: 'DELETE' }),
  createSale: (data: { id_negocio: string; id_tipo_pago?: string; items: Array<{ id_producto: string; cantidad: number; precio_unitario?: number }>; cerrar?: boolean }) =>
    apiFetch<any>('sales', { method: 'POST', body: JSON.stringify(data) }),
  getSales: (params?: { id_negocio?: string; id_usuario?: string; estado?: string; desde?: string; hasta?: string }) => {
    const merged = { ...(params || {}) } as Record<string, string | undefined>;
    if (!merged.id_negocio) {
      let negocioId: string | undefined;
      try { negocioId = typeof window !== 'undefined' ? localStorage.getItem('active_business_id') || undefined : undefined; } catch {}
      if (!negocioId) negocioId = process.env.NEXT_PUBLIC_NEGOCIO_ID as string | undefined;
      if (negocioId) merged.id_negocio = negocioId;
    }
    const query = new URLSearchParams(Object.entries(merged).filter(([_,v]) => v != null && v !== '') as any).toString();
    return apiFetch<any[]>(`sales${query ? `?${query}` : ''}`);
  },
  getSale: (id: string) => apiFetch<any>(`sales/${id}`),
  getStoreProducts: (id_negocio: string | number) => {
    if (!id_negocio) throw new Error('Se requiere un id_negocio válido');
    return apiFetch<any[]>(`store/${id_negocio}/products`);
  },
};

// --- Helpers (sin cambios) ---
export const activeBusiness = {
  get(): string | null {
    try { return typeof window !== 'undefined' ? localStorage.getItem('active_business_id') : null; } catch { return null; }
  },
  set(id: string) {
    try { if (typeof window !== 'undefined') localStorage.setItem('active_business_id', id); } catch {}
  },
  clear() {
    try { if (typeof window !== 'undefined') localStorage.removeItem('active_business_id'); } catch {}
  },
};