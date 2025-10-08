// --- Tu código actualizado ---
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

// --- Interfaces actualizadas ---
export interface LoginResponse {
  token: string;
  user: { 
    id: string; 
    email: string;
    id_rol: number;        // ← Nuevo campo
    nombre_rol?: string;   // ← Nuevo campo opcional
  };
}

export interface UserInfo {
  id_usuario: number;
  nombre: string;
  correo_electronico: string;
  id_rol: number;
  role?: {
    id_rol: number;
    nombre_rol: string;
  };
  numero_telefono?: string;
  fecha_nacimiento?: string;
  fecha_registro?: string;
  estado?: string;
}

// --- 👇 Objeto principal con métodos actualizados ---
export const api = {
  // --- Auth ---
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

  // --- 👇 NUEVO: Obtener información del usuario actual ---
  me: () => apiFetch<UserInfo>('auth/me'),

  // --- Productos generales ---
  getProducts: (params?: { search?: string; status?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
  // Obtener la lista de productos (con filtros opcionales)
  getProducts: (params?: { search?: string; status?: string; id_negocio?: string }) => {
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

  createProduct: (productData: any) =>
    apiFetch<any>('products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id: string, productData: any) =>
    apiFetch<any>(`products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    }),

  deleteProduct: (id: string) =>
    apiFetch<any>(`products/${id}`, {
      method: 'DELETE',
    }),

  // --- 👇 Inventario ---
  // --- 👇 CÓDIGO AÑADIDO PARA CATEGORÍAS ---
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

  // --- 👇 NEGOCIOS ---
  createBusiness: (data: { nombre: string; direccion?: string; telefono?: string; correo?: string; logo?: string }) =>
    apiFetch<any>('businesses', { method: 'POST', body: JSON.stringify(data) }),
  listMyBusinesses: () => apiFetch<any[]>('businesses/my'),

  // --- Funciones de Inventario (SIN CAMBIOS) ---
  getInventory: (params: { id_negocio?: string; id_producto?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`inventory?${query}`);
  },

  createInventory: (data: { id_negocio: string; id_producto: string; cantidad_actual?: number; stock_minimo?: number }) =>
    apiFetch<any>('inventory', { method: 'POST', body: JSON.stringify(data) }),

  updateInventory: (id: string, data: Partial<{ cantidad_actual: number; stock_minimo: number }>) =>
    apiFetch<any>(`inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteInventory: (id: string) => apiFetch<any>(`inventory/${id}`, { method: 'DELETE' }),

  // --- 👇 NUEVO: Obtener productos de una tienda específica ---
  getStoreProducts: (id_negocio: string | number) => {
    if (!id_negocio) throw new Error('Se requiere un id_negocio válido');
    return apiFetch<any[]>(`store/${id_negocio}/products`);
  },
};