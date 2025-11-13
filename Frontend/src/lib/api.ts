/* lib/api.ts */
// Usa la base externa si está definida; si no, utiliza la ruta relativa '/api'
// que será proxyada por Next.js según las rewrites del next.config.mjs.
export const API_BASE =
  (globalThis as any).process?.env?.NEXT_PUBLIC_API_BASE ||
  "/api";

export interface ApiError {
  status: number;
  message: string;
}

function getToken(): string | null {
  try {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("auth_token");
    }
  } catch {}
  return null;
}

// --- MODIFICADO: apiFetch ---
// Corregido para manejar FormData (subida de archivos)
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken();

  const normalizedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (init.headers) {
    if (typeof Headers !== "undefined" && init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        normalizedHeaders[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      (init.headers as [string, string][]).forEach(([key, value]) => {
        normalizedHeaders[key] = value;
      });
    } else if (typeof init.headers === "object") {
      Object.assign(normalizedHeaders, init.headers as Record<string, string>);
    }
  }
  // Avoid sending Authorization on auth endpoints (login/register)
  const pathKey = path.replace(/^\/+/, "");
  const isAuthEndpoint = /^(auth\/(login|register)|usuarios\/register)/.test(pathKey);
  // Hard cap token size to prevent 431 (proxies with strict header limits)
  const TOKEN_MAX = 4096; // bytes-ish length cap
  if (token && !isAuthEndpoint && token.length < TOKEN_MAX) {
    normalizedHeaders.Authorization = `Bearer ${token}`;
  }

  // If the body is a FormData, let the browser set the Content-Type (with boundary)
  // so remove any explicit Content-Type header in that case.
  if (init.body && typeof FormData !== "undefined" && init.body instanceof FormData) {
    delete normalizedHeaders["Content-Type"];
  }

  // Force no-cookies by default to prevent 431s due to large Cookie headers when
  // using Next.js rewrites (/api -> backend). Callers can override via init.credentials.
  const baseInit: RequestInit = { ...init, headers: normalizedHeaders };
  if (typeof baseInit.credentials === "undefined") {
    baseInit.credentials = "omit";
  }

  // Debug instrumentation for 431 header issues
  const isLoginDebug = /auth\/login$/.test(pathKey);
  if (isLoginDebug) {
    try {
      const headerSnapshot = { ...normalizedHeaders };
      if (headerSnapshot.Authorization) {
        headerSnapshot.Authorization = `Bearer <len:${headerSnapshot.Authorization.length}>`;
      }
      // Compute cookie header length if browser would attach (we forced omit, but log anyway)
      console.debug('[login-debug] request', {
        url,
        method: init.method || 'GET',
        headers: headerSnapshot,
        bodyBytes: typeof init.body === 'string' ? init.body.length : (init.body ? 'form/mixed' : 0),
        tokenPresent: !!token,
      });
    } catch {}
  }

  const res = await fetch(url, baseInit).catch(err => {
    if (isLoginDebug) console.error('[login-debug] network error', err);
    throw err;
  });

  if (
    typeof window !== "undefined" &&
    (globalThis as any).process?.env?.NODE_ENV !== "production"
  ) {
    console.debug("[apiFetch]", init.method || "GET", url);
  }

  const text = await res.text();
  let data: any = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message:
        (data && (data.message || data.error)) || res.statusText || "Error",
    };
    throw err;
  }

  return data as T;
}
// --- FIN DE MODIFICACIÓN apiFetch ---


// --- Interfaces actualizadas ---
export interface AuthUser {
  id: string;
  email: string;
  verified?: boolean;
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
  avatarUrl?: string | null;
  credentialUrl?: string | null;
  accountNumber?: string | null;
  age?: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterResponse extends LoginResponse {
  requiresVerification?: boolean;
  verification?: {
    delivery: 'email';
    expiresAt: string;
  };
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
    apiFetch<LoginResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify({ correo_electronico, password }),
      credentials: 'omit',
      cache: 'no-store',
    }),

  // Información del usuario autenticado
  me: () => apiFetch<UserInfo>("auth/me"),

  // --- CORREGIDO: 'register' (Eliminado duplicado) ---
  register: (
    name: string,
    email: string,
    password: string,
    role?: "usuario" | "admin",
    accountNumber?: string,
    age?: number
  ) => {
    const payload: Record<string, unknown> = { name, email, password };
    if (role) payload.role = role;
    if (accountNumber) payload.accountNumber = accountNumber;
    if (typeof age === "number") payload.age = age;
    
    // Asumo que la ruta de register es 'auth/register' (como en el duplicado)
    // y no 'usuarios/register'
    return apiFetch<RegisterResponse>("auth/register", { 
      method: "POST",
      body: JSON.stringify(payload),
      credentials: 'omit',
      cache: 'no-store',
    });
  },

  verifyEmail: (correo_electronico: string, codigo: string) =>
    apiFetch<{ message: string; verifiedAt: string; user: AuthUser }>(
      "usuarios/verificar-correo",
      {
        method: "POST",
        body: JSON.stringify({ correo_electronico, codigo }),
      }
    ),

  resendVerification: (correo_electronico: string) =>
    apiFetch<{ message: string; delivery: "email"; expiresAt: string }>(
      "usuarios/enviar-verificacion",
      {
        method: "POST",
        body: JSON.stringify({ correo_electronico }),
      }
    ),

  // --- Productos ---
  getProducts: (params?: {
    search?: string;
    status?: string;
    id_negocio?: string;
    categoria?: string; 
  }) => {
    const merged = { ...(params || {}) } as {
      [key: string]: string | undefined;
    };
    if (!merged.id_negocio) {
      let negocioId: string | undefined = undefined;
      try {
        negocioId =
          typeof window !== "undefined"
            ? localStorage.getItem("active_business_id") || undefined
            : undefined;
      } catch {}
      if (!negocioId) {
        const negocioEnv = (globalThis as any).process?.env
          ?.NEXT_PUBLIC_NEGOCIO_ID;
        if (negocioEnv) negocioId = negocioEnv;
      }
      if (negocioId) merged.id_negocio = negocioId;
    }
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value != null && value !== "") {
        queryParams.append(key, String(value));
      }
    }
    const query = queryParams.toString();
    const path = query ? `products?${query}` : "products";
    return apiFetch<any[]>(path);
  },

  // --- CORREGIDO: createProduct (para FormData) ---
  createProduct: (productData: any, imageFile?: File | null) => {
    const formData = new FormData();
    // 1. Añade los datos del producto como un string JSON.
    formData.append('data', JSON.stringify(productData));
    // 2. Añade el archivo de imagen si existe.
    if (imageFile) {
      formData.append('file', imageFile);
    }
    // 3. Envía el FormData.
    return apiFetch<any>('products', {
      method: 'POST',
      body: formData, // 'apiFetch' detectará que es FormData
    });
  },

  // Nueva versión: acepta opcionalmente un archivo de imagen.
  // Si se recibe `imageFile`, envía multipart/form-data con `data` (JSON string) y `file` (imagen).
  createProductWithImage: (productData: any, imageFile?: File | null) => {
    if (imageFile) {
      const fd = new FormData();
      // 'data' es la parte JSON esperada por el backend
      fd.append("data", JSON.stringify(productData));
      // 'file' es el nombre de campo esperado por el backend (Multer FileInterceptor('file'))
      fd.append("file", imageFile);
      return apiFetch<any>("products", {
        method: "POST",
        body: fd,
      });
    }
    return api.createProduct(productData);
  },

  updateProduct: (id: string, productData: any) =>
    apiFetch<any>(`products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(productData),
    }),

  deleteProduct: (id: string) =>
    apiFetch<any>(`products/${id}`, {
      method: "DELETE",
    }),

  // --- Categorías (CORREGIDO: Duplicados eliminados) ---
  getCategories: (params?: { id_negocio?: string }) => {
    // Mantenemos la versión que permite 'id_negocio' opcional
    const queryParams = new URLSearchParams();
    if (params?.id_negocio) {
      queryParams.append('id_negocio', params.id_negocio);
    }
    const query = queryParams.toString();
    const path = query ? `categories?${query}` : 'categories';
    return apiFetch<any[]>(path);
  },
  
  getCategoryById: (id: string) => apiFetch<any>(`categories/${id}`),
  
  createCategory: (categoryData: { nombre: string; negocioId?: string }) => {
    // Mantenemos la versión que permite 'negocioId' opcional
    const body: any = { nombre: categoryData.nombre };
    if (categoryData.negocioId) {
      body.negocioId = categoryData.negocioId;
    }
    return apiFetch<any>("categories", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateCategory: (id: string, categoryData: { nombre: string }) =>
    apiFetch<any>(`categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(categoryData),
    }),

  deleteCategory: (id: string) =>
    apiFetch<any>(`categories/${id}`, {
      method: "DELETE",
    }),

  // --- Empleados ---
  getEmployeesByBusiness: (businessId: string) =>
    apiFetch<any[]>(`employees/business/${businessId}`),
  createEmployee: (
    businessId: string,
    payload: { correo_electronico: string; nombre?: string }
  ) =>
    apiFetch<any>(`employees/business/${businessId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateEmployee: (employeeId: string, payload: { estado: string }) =>
    apiFetch<any>(`employees/${employeeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteEmployee: (employeeId: string) =>
    apiFetch<any>(`employees/${employeeId}`, { method: "DELETE" }),
    
  // --- Negocios ---
  createBusiness: (data: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    logo?: string;
    hero_image_url?: string;
  }) =>
    apiFetch<any>("businesses", { method: "POST", body: JSON.stringify(data) }),
    
  listMyBusinesses: () => apiFetch<any[]>("businesses/my"),
  
  getPublicBusinesses: async () => {
    try {
      const businesses = await apiFetch<any[]>("businesses");
      console.log("✅ Negocios cargados desde API:", businesses);
      return businesses;
    } catch (error) {
      console.error("❌ Error cargando negocios públicos:", error);
      return [];
    }
  },
  
  getBusinessById: async (id: string | number) => {
    try {
      const businessId = String(id);
      const business = await apiFetch<any>(`businesses/${businessId}`);
      console.log("✅ Tienda cargada desde API:", business);
      return business;
    } catch (error) {
      console.error("❌ Error cargando tienda:", error);
      throw error;
    }
  }, 
  
  // --- Inventario ---
  getInventory: (params: {
    id_negocio?: string;
    id_producto?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`inventory?${query}`);
  },

  createInventory: (data: {
    id_negocio: string;
    id_producto: string;
    cantidad_actual?: number;
    stock_minimo?: number;
  }) =>
    apiFetch<any>("inventory", { method: "POST", body: JSON.stringify(data) }),

  updateInventory: (
    id: string,
    data: Partial<{ cantidad_actual: number; stock_minimo: number }>
  ) =>
    apiFetch<any>(`inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteInventory: (id: string) =>
    apiFetch<any>(`inventory/${id}`, { method: "DELETE" }),
  
  // --- Ventas ---
  createSale: (data: {
    id_negocio: string;
    id_tipo_pago?: string;
    items: Array<{
      id_producto: string;
      cantidad: number;
      precio_unitario?: number;
    }>;
    cerrar?: boolean;
  }) =>
    apiFetch<any>("sales", { method: "POST", body: JSON.stringify(data) }).then((sale) => {
      try {
        // Emit custom event so kitchen board can append ticket instantly
        window.dispatchEvent(new CustomEvent('pos:new-sale', { detail: sale }));
      } catch {}
      return sale;
    }),

  getSales: (params?: {
    id_negocio?: string;
    id_usuario?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
  }) => {
    const merged = { ...(params || {}) } as Record<string, string | undefined>;
    if (!merged.id_negocio) {
      let negocioId: string | undefined;
      try {
        negocioId =
          typeof window !== "undefined"
            ? localStorage.getItem("active_business_id") || undefined
            : undefined;
      } catch {}
      if (!negocioId)
        negocioId = (globalThis as any).process?.env?.NEXT_PUBLIC_NEGOCIO_ID as
          | string
          | undefined;
      if (negocioId) merged.id_negocio = negocioId;
    }
    const query = new URLSearchParams(
      Object.entries(merged).filter(([_, v]) => v != null && v !== "") as any
    ).toString();
    return apiFetch<any[]>(`sales${query ? `?${query}` : ""}`);
  },
  
  getSale: (id: string) => apiFetch<any>(`sales/${id}`), 

  getStoreProducts: (id_negocio: string | number) => {
    if (!id_negocio) throw new Error("Se requiere un id_negocio válido");
    return apiFetch<any[]>(`store/${id_negocio}/products`);
  }, 
  
  getBusinessComments: (id_negocio: string | number) =>
    apiFetch<any[]>(`businesses/${id_negocio}/ratings`),

  // --- ¡NUEVO! ---
  // --- Módulo de Métricas ---
  getMetrics: (params: { id_negocio: string; periodo?: '7d' | '14d' | '30d' | 'hoy' }) => {
    // Construimos los query parameters
    const qp = new URLSearchParams();
    qp.append('id_negocio', params.id_negocio);
    if (params.periodo) {
      qp.append('periodo', params.periodo);
    }
    
    // Hacemos la llamada al nuevo endpoint
    return apiFetch<any>(`metrics?${qp.toString()}`); 
  },
  // --- FIN DE LO NUEVO ---
  // --- Verificación SMS ---
  startSmsVerification: (telefono: string, canal: string = "sms") =>
    apiFetch<{ message: string; telefono: string; canal: string; expiresAt?: string }>(
      "sms/verify/start",
      {
        method: "POST",
        body: JSON.stringify({ telefono, canal }),
      }
    ),
  checkSmsVerification: (telefono: string, codigo: string) =>
    apiFetch<{ message: string; telefono: string; verified: boolean; verifiedAt?: string }>(
      "sms/verify/check",
      {
        method: "POST",
        body: JSON.stringify({ telefono, codigo }),
      }
    ),
};

// Helpers para negocio activo en el cliente
export const activeBusiness = {
  get(): string | null {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("active_business_id")
        : null;
    } catch {
      return null;
    }
  },
  set(id: string) {
    try {
      if (typeof window !== "undefined")
        localStorage.setItem("active_business_id", id);
    } catch {}
  },
  clear() {
    try {
      if (typeof window !== "undefined")
        localStorage.removeItem("active_business_id");
    } catch {}
  },
};