/* lib/api.ts */
// Usa la base externa si está definida; si no, utiliza la ruta relativa '/api'
// que será proxyada por Next.js según las rewrites del next.config.mjs.
function resolveApiBase(): string {
  const raw = (globalThis as any).process?.env?.NEXT_PUBLIC_API_BASE as string | undefined;
  if (raw && raw.trim()) {
    return raw.replace(/\/+$/, "");
  }
  try {
    if (typeof window !== "undefined") {
      const { protocol, hostname, port } = window.location;
      if (/^(localhost|127\.0\.0\.1)$/i.test(hostname)) {
        if (port && port !== "3000") {
          return `${protocol}//${hostname}:3000/api`;
        }
        return `${protocol}//${hostname}${port ? `:${port}` : ""}/api`;
      }
    }
  } catch {}
  return "/api";
}

export const API_BASE = resolveApiBase();

function clearAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("auth_user");
    window.localStorage.removeItem("auth_user_fallback_reason");
    window.localStorage.removeItem("selectedRole");
    window.localStorage.removeItem("userRole");
  } catch {}
}

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
  const isAbsolutePath = /^https?:/i.test(path);
  const sanitizedPath = path.replace(/^\/+/, "");
  const baseUrl = isAbsolutePath
    ? path
    : `${API_BASE.replace(/\/$/, "")}/${sanitizedPath}`;
  const token = getToken();

  const normalizedHeaders: Record<string, string> = {};
  
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
  const TOKEN_MAX = 2048; // conservative bytes-ish length cap
  if (token && token.length >= TOKEN_MAX) {
    clearAuthStorage();
  }
  if (token && !isAuthEndpoint && token.length < TOKEN_MAX) {
    normalizedHeaders.Authorization = `Bearer ${token}`;
  }

  // If the body is a FormData, let the browser set the Content-Type (with boundary)
  // so remove any explicit Content-Type header in that case.
  if (init.body && typeof FormData !== "undefined" && init.body instanceof FormData) {
    delete normalizedHeaders["Content-Type"];
  } else if (init.body && !normalizedHeaders["Content-Type"]) {
    normalizedHeaders["Content-Type"] = "application/json";
  }

  // Force no-cookies by default to prevent 431s due to large Cookie headers when
  // using Next.js rewrites (/api -> backend). Callers can override via init.credentials.
  const baseInit: RequestInit = { ...init, headers: normalizedHeaders };
  if (typeof baseInit.credentials === "undefined") {
    baseInit.credentials = "omit";
  }

  // For auth endpoints, explicitly remove problematic headers and force minimal config
  if (isAuthEndpoint) {
    baseInit.credentials = "omit";
    baseInit.cache = "no-store";
    baseInit.mode = "cors";
    baseInit.referrerPolicy = "no-referrer";
    // Remove headers that might be too large
    delete normalizedHeaders["Cookie"];
    delete normalizedHeaders["cookie"];
    delete normalizedHeaders["Referer"];
    delete normalizedHeaders["User-Agent"];
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
        url: baseUrl,
        method: init.method || 'GET',
        headers: headerSnapshot,
        bodyBytes: typeof init.body === 'string' ? init.body.length : (init.body ? 'form/mixed' : 0),
        tokenPresent: !!token,
      });
    } catch {}
  }

  const candidateUrls: string[] = [baseUrl];
  const pushCandidate = (candidate: string) => {
    if (!candidateUrls.includes(candidate)) {
      candidateUrls.push(candidate);
    }
  };
  if (typeof window !== "undefined") {
    try {
      if (isAbsolutePath) {
        const parsed = new URL(baseUrl);
        if (parsed.hostname === "localhost") {
          const currentHost = window.location.hostname;
          if (currentHost && currentHost !== "localhost") {
            const aligned = new URL(baseUrl);
            aligned.hostname = currentHost;
            pushCandidate(aligned.toString());
          }
          const ipv4 = new URL(baseUrl);
          ipv4.hostname = "127.0.0.1";
          pushCandidate(ipv4.toString());
        }
      }
    } catch {}

    if (!isAbsolutePath) {
      const origin = window.location.origin.replace(/\/$/, "");
      const relativePath = sanitizedPath.startsWith("api/") ? sanitizedPath : `api/${sanitizedPath}`;
      pushCandidate(`${origin}/${relativePath}`);
    }
  }

  let res: Response | null = null;
  let lastError: unknown = null;

  let effectiveUrl = baseUrl;
  for (let index = 0; index < candidateUrls.length; index += 1) {
    const targetUrl = candidateUrls[index];
    if (index > 0 && (globalThis as any).process?.env?.NODE_ENV !== "production") {
      console.warn(`[apiFetch] Intento alternativo (${index + 1}/${candidateUrls.length}) → ${targetUrl}`);
    }
    try {
      res = await fetch(targetUrl, baseInit);
      effectiveUrl = targetUrl;
      if (targetUrl !== baseUrl && isLoginDebug) {
        console.debug('[login-debug] fallback success', targetUrl);
      }
      break;
    } catch (err) {
      lastError = err;
      if (isLoginDebug) console.error('[login-debug] network error', err);
      const isNetworkError = err instanceof TypeError;
      if (!isNetworkError || index === candidateUrls.length - 1) {
        throw err;
      }
    }
  }

  if (!res) {
    throw lastError ?? new Error('Fetch failed');
  }

  if (
    typeof window !== "undefined" &&
    (globalThis as any).process?.env?.NODE_ENV !== "production"
  ) {
    console.debug("[apiFetch]", init.method || "GET", effectiveUrl);
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
    if (res.status === 431) {
      clearAuthStorage();
      if (typeof window !== "undefined") {
        console.warn("[apiFetch] 431 recibido. Autenticación reseteada para evitar headers grandes.");
      }
    }
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


function buildProductFormData(productData: any, imageFile?: File | null) {
  const fd = new FormData();
  fd.append("data", JSON.stringify(productData));
  if (imageFile) {
    fd.append("file", imageFile);
  }
  return fd;
}


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

export interface RegisterResponse {
  requiresVerification?: boolean;
  delivery?: 'email';
  expiresAt?: string;
  session?: string;
  verification?: {
    delivery: 'email';
    expiresAt: string;
  };
  token?: string;
  user?: AuthUser;
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

export interface BusinessProductSummary {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen_url?: string | null;
  categoria?: string | null;
  stock: number;
  stock_minimo: number;
}

export interface BusinessSummary {
  id_negocio: number;
  nombre: string;
  descripcion?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  fecha_registro?: string | null;
  categorias: string[];
  resumen: {
    totalProductos: number;
    totalCategorias: number;
    totalPedidos: number;
    totalResenas: number;
    promedioEstrellas: number | null;
    totalVentasRegistradas: number;
    ingresosAcumulados: number;
  };
  productosDestacados: BusinessProductSummary[];
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

  verifyRegister: (session: string, code: string) =>
    apiFetch<LoginResponse>("auth/verify-register", {
      method: "POST",
      body: JSON.stringify({ session, code }),
      cache: 'no-store',
    }),

  resendRegister: (session: string) =>
    apiFetch<{ delivery: 'email'; expiresAt: string; session: string }>("auth/resend-register", {
      method: "POST",
      body: JSON.stringify({ session }),
      cache: 'no-store',
    }),

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

  getProductCategories: (params?: { id_negocio?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.id_negocio) {
      queryParams.append("id_negocio", params.id_negocio);
    }
    const query = queryParams.toString();
    const path = query ? `products/catalog/categories?${query}` : "products/catalog/categories";
    return apiFetch<Array<{ id: string | null; nombre: string; totalProductos: number; value: string }>>(path);
  },

  createProduct: (productData: any, imageFile?: File | null) =>
    apiFetch<any>("products", {
      method: "POST",
      body: buildProductFormData(productData, imageFile),
    }),

  // Nueva versión: siempre multipart/form-data.
  // Campo JSON: 'data'; Campo de archivo (opcional): 'file'
  createProductWithImage: (productData: any, imageFile?: File | null) => {
    return apiFetch<any>("products", {
      method: "POST",
      body: buildProductFormData(productData, imageFile),
    });
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
    // Las categorías actualmente son globales en el backend (no requieren id_negocio).
    // Si se proporciona o se puede inferir un id_negocio lo enviamos para futura compatibilidad,
    // pero si no existe simplemente retornamos todas las categorías sin filtrar.
    let negocioId = params?.id_negocio;
    if (!negocioId) {
      try {
        negocioId =
          typeof window !== "undefined"
            ? window.localStorage.getItem("active_business_id") || undefined
            : undefined;
      } catch {}
    }
    if (!negocioId) {
      const envNegocio = (globalThis as any).process?.env?.NEXT_PUBLIC_NEGOCIO_ID;
      if (envNegocio) negocioId = envNegocio;
    }
    // Si no hay negocioId → petición global sin parámetros.
    if (!negocioId) {
      return apiFetch<any[]>("categories");
    }
    const query = new URLSearchParams({ id_negocio: String(negocioId) }).toString();
    return apiFetch<any[]>(`categories?${query}`);
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
  createCategoryAdvanced: (payload: { nombre: string; sucursal?: string; aplicarTodos?: boolean; negocioId?: string }) =>
    apiFetch<any>("categories", { method: "POST", body: JSON.stringify(payload) }),
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

  updateBusiness: (
    id: string | number,
    payload: {
      nombre?: string | null;
      direccion?: string | null;
      telefono?: string | null;
      correo?: string | null;
      logo?: string | null;
      hero_image_url?: string | null;
    }
  ) =>
    apiFetch<any>(`businesses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  
  getPublicBusinesses: async (): Promise<BusinessSummary[]> => {
    try {
      const businesses = await apiFetch<BusinessSummary[]>("businesses");
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
  
  getCashoutSummary: (params: {
    id_negocio: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    incluir_recientes?: boolean;
    limite_recientes?: number;
    todo_el_dia?: boolean;
  }) => {
    const search = new URLSearchParams();
    search.append('id_negocio', params.id_negocio);
    if (params.fecha_inicio) search.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) search.append('fecha_fin', params.fecha_fin);
    if (params.incluir_recientes !== undefined) {
      search.append('incluir_recientes', String(params.incluir_recientes));
    }
    if (params.limite_recientes) {
      search.append('limite_recientes', String(params.limite_recientes));
    }
    if (params.todo_el_dia !== undefined) {
      search.append('todo_el_dia', String(params.todo_el_dia));
    }
    const qp = search.toString();
    return apiFetch<any>(`sales/cashout/summary${qp ? `?${qp}` : ''}`);
  },

  createCashout: (data: {
    id_negocio: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    monto_inicial?: number;
    monto_final?: number;
    todo_el_dia?: boolean;
  }) =>
    apiFetch<any>('sales/cashout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCashoutHistory: (params: {
    id_negocio: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limite?: number;
    incluir_recientes?: boolean;
    limite_recientes?: number;
  }) => {
    const search = new URLSearchParams();
    search.append('id_negocio', params.id_negocio);
    if (params.fecha_inicio) search.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) search.append('fecha_fin', params.fecha_fin);
    if (params.limite) search.append('limite', String(params.limite));
    if (params.incluir_recientes !== undefined) {
      search.append('incluir_recientes', String(params.incluir_recientes));
    }
    if (params.limite_recientes) {
      search.append('limite_recientes', String(params.limite_recientes));
    }
    const qp = search.toString();
    return apiFetch<any>(`sales/cashout/history${qp ? `?${qp}` : ''}`);
  },
  
  getSale: (id: string) => apiFetch<any>(`sales/${id}`), 

  // --- Cocina / Pedidos ---
  getKitchenBoard: async (businessId: string | number) => {
    if (businessId === undefined || businessId === null) {
      throw new Error('Se requiere un id_negocio para consultar la cocina');
    }
    const bizId = String(businessId);
    return apiFetch<any>(`pedidos/kanban/${bizId}`);
  },

  updateKitchenOrderStatus: (
    pedidoId: string | number,
    estado: 'pendiente' | 'confirmado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado',
    notas?: string
  ) => {
    const payload: Record<string, unknown> = { estado };
    if (notas && notas.trim()) payload.notas = notas.trim();
    return apiFetch<any>(`pedidos/${pedidoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

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

  updateUserProfile: (
    id: string | number,
    payload: Partial<{
      name: string | null;
      phoneNumber: string | null;
      newPassword: string | null;
      avatarUrl: string | null;
      credentialUrl: string | null;
      accountNumber: string | null;
      age: number | null;
    }>
  ) =>
    apiFetch<any>(`users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
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