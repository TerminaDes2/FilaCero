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
export interface LoginUserPayload {
  id: string;
  email: string;
  verified?: boolean;
  avatarUrl?: string | null;
  credentialUrl?: string | null;
  accountNumber?: string | null;
  age?: number | null;
}

export interface LoginResponse {
  token: string;
  user: LoginUserPayload;
  requiresVerification?: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
}

export interface UserInfo {
  id_usuario: number;
  nombre: string;
  correo_electronico: string;
  id_rol: number;
  // nombre del rol plano desde backend (JwtStrategy agrega role_name)
  role_name?: string;
  role?: { id_rol: number; nombre_rol: string };
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

  register: (
    name: string,
    email: string,
    password: string,
    role?: 'usuario' | 'admin',
    accountNumber?: string,
    age?: number
  ) => {
    const payload: Record<string, unknown> = { name, email, password };
    if (role) payload.role = role;
    if (accountNumber) payload.accountNumber = accountNumber;
    if (typeof age === 'number') payload.age = age;

    console.log('📤 Enviando registro a:', `${API_BASE}/auth/register`);
    console.log('📦 Datos enviados:', payload);
    
    return apiFetch<LoginResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- 👇 NUEVO: Obtener información del usuario actual ---
  me: () => apiFetch<UserInfo>('auth/me'),

  // --- Productos ---
  getProducts: (params?: { 
    search?: string; 
    status?: string; 
    id_negocio?: string;
    categoria?: string; // ← Agrega este parámetro
  }) => {
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

  // --- Categorías ---
  getCategories: (params?: { id_negocio?: string }) => {
    let negocioId = params?.id_negocio;
    if (!negocioId) {
      try { negocioId = typeof window !== 'undefined' ? window.localStorage.getItem('active_business_id') || undefined : undefined; } catch {}
    }
    if (!negocioId) {
      const envNegocio = process.env.NEXT_PUBLIC_NEGOCIO_ID;
      if (envNegocio) negocioId = envNegocio;
    }
    if (!negocioId) {
      throw new Error('Se requiere un negocio activo para cargar categorías');
    }
    const query = new URLSearchParams({ id_negocio: String(negocioId) }).toString();
    return apiFetch<any[]>(`categories?${query}`);
  },
  getCategoryById: (id: string) =>
    apiFetch<any>(`categories/${id}`),
  createCategory: (categoryData: { nombre: string; negocioId: string }) =>
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
  // --- Negocios ---
  createBusiness: (data: { nombre: string; direccion?: string; telefono?: string; correo?: string; logo?: string }) =>
    apiFetch<any>('businesses', { method: 'POST', body: JSON.stringify(data) }),
  
  listMyBusinesses: () => apiFetch<any[]>('businesses/my'),
  
  getPublicBusinesses: async () => {
    try {
      const businesses = await apiFetch<any[]>('businesses/public');
      console.log('✅ Negocios cargados desde API:', businesses);
      return businesses;
    } catch (error) {
      console.error('❌ Error cargando negocios públicos:', error);
      // Retorna array vacío en lugar de lanzar error
      return [];
    }
  },
  // --- Inventario ---
  getInventory: (params: { id_negocio?: string; id_producto?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`inventory?${query}`);
  },

  createInventory: (data: { id_negocio: string; id_producto: string; cantidad_actual?: number; stock_minimo?: number }) =>
    apiFetch<any>('inventory', { method: 'POST', body: JSON.stringify(data) }),

  updateInventory: (id: string, data: Partial<{ cantidad_actual: number; stock_minimo: number }>) =>
    apiFetch<any>(`inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteInventory: (id: string) => apiFetch<any>(`inventory/${id}`, { method: 'DELETE' }),
  
  // --- Ventas ---
  createSale: (data: { id_negocio: string; id_tipo_pago?: string; items: Array<{ id_producto: string; cantidad: number; precio_unitario?: number }>; cerrar?: boolean }) =>
    apiFetch<any>('sales', { method: 'POST', body: JSON.stringify(data) }),

  // Historial de ventas
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

  // Legacy helper (si se usa en algún lugar)
  getStoreProducts: (id_negocio: string | number) => {
    if (!id_negocio) throw new Error('Se requiere un id_negocio válido');
    return apiFetch<any[]>(`store/${id_negocio}/products`);
  },
};

// Helpers para negocio activo en el cliente
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