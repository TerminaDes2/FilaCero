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
  user: { id: string; email: string };
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
  credential_url?: string;
  verificado?: boolean;
  verified?: boolean;
  correo_verificado?: boolean;
  correo_verificado_en?: string | null;
  sms_verificado?: boolean;
  sms_verificado_en?: string | null;
  credencial_verificada?: boolean;
  credencial_verificada_en?: string | null;
  verifications?: {
    email: boolean;
    sms: boolean;
    credential: boolean;
  };
  verificationTimestamps?: {
    email: string | null;
    sms: string | null;
    credential: string | null;
  };
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

  // ---  NUEVO: Obtener información del usuario actual ---
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
    const queryParams = new URLSearchParams();
    if (params?.id_negocio) {
      queryParams.append('id_negocio', params.id_negocio);
    }
    const query = queryParams.toString();
    const path = query ? `categories?${query}` : 'categories';
    return apiFetch<any[]>(path);
  },
  getCategoryById: (id: string) =>
    apiFetch<any>(`categories/${id}`),
  createCategory: (categoryData: { nombre: string; negocioId?: string }) => {
    // Enviar campos según DTO del backend: nombre y negocioId (camelCase)
    const body: any = { nombre: categoryData.nombre };
    if (categoryData.negocioId) {
      body.negocioId = categoryData.negocioId;
    }
    return apiFetch<any>('categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateCategory: (id: string, categoryData: { nombre: string }) =>
    apiFetch<any>(`categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    }),
  deleteCategory: (id: string) =>
    apiFetch<any>(`categories/${id}`, {
      method: 'DELETE',
    }),
  // --- Empleados ---
  getEmployeesByBusiness: (businessId: string) =>
    apiFetch<any[]>(`employees/business/${businessId}`),
  createEmployee: (businessId: string, payload: { correo_electronico: string; nombre?: string }) =>
    apiFetch<any>(`employees/business/${businessId}`, { method: 'POST', body: JSON.stringify(payload) }),
  updateEmployee: (employeeId: string, payload: { estado: string }) =>
    apiFetch<any>(`employees/${employeeId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEmployee: (employeeId: string) =>
    apiFetch<any>(`employees/${employeeId}`, { method: 'DELETE' }),
  // --- Negocios ---
  createBusiness: (data: { nombre: string; direccion?: string; telefono?: string; correo?: string; logo?: string }) =>
    apiFetch<any>('businesses', { method: 'POST', body: JSON.stringify(data) }),
  
  listMyBusinesses: () => apiFetch<any[]>('businesses/my'),
  
  getPublicBusinesses: async () => {
    try {
      const businesses = await apiFetch<any[]>('businesses');
      console.log('✅ Negocios cargados desde API:', businesses);
      return businesses;
    } catch (error) {
      console.error('❌ Error cargando negocios públicos:', error);
      // Retorna array vacío en lugar de lanzar error
      return [];
    }
  },
  getBusinessById: async (id: string | number) => {
    try {
      // Asegúrate de que el ID sea string para la comparación
      const businessId = String(id);
      const business = await apiFetch<any>(`businesses/${businessId}`);
      console.log('✅ Tienda cargada desde API:', business);
      return business;
    } catch (error) {
      console.error('❌ Error cargando tienda:', error);
      throw error;
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
    apiFetch<any>('sales', { method: 'POST', body: JSON.stringify(data) }).then((sale) => {
      try {
        // Emit custom event so kitchen board can append ticket instantly
        window.dispatchEvent(new CustomEvent('pos:new-sale', { detail: sale }));
      } catch {}
      return sale;
    }),

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
  //Comentarios
  getBusinessComments: (id_negocio: string | number) =>
  apiFetch<any[]>(`businesses/${id_negocio}/ratings`),

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

