export const API_BASE =
  (globalThis as any).process?.env?.NEXT_PUBLIC_API_BASE ||
  "http://localhost:3000/api";

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

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken(); // Normalize headers into a plain object to avoid issues when `init.headers` is // a Headers instance or an array of tuples. Keep Content-Type by default and // add Authorization when token is present.
  const normalizedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init.headers) {
    // Headers instance
    if (typeof Headers !== "undefined" && init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        normalizedHeaders[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      // Array of tuples
      (init.headers as [string, string][]).forEach(([key, value]) => {
        normalizedHeaders[key] = value;
      });
    } else if (typeof init.headers === "object") {
      Object.assign(normalizedHeaders, init.headers as Record<string, string>);
    }
  }
  if (token) normalizedHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers: normalizedHeaders });

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
      // If response isn't JSON, keep the raw text. This avoids throwing during
      // JSON.parse for non-JSON endpoints while preserving the response body.
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

// --- Interfaces actualizadas ---
export interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

export interface UserInfo {
  id_usuario: number;
  nombre: string;
  correo_electronico: string;
  id_rol: number; // nombre del rol plano desde backend (JwtStrategy agrega role_name)
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
    }),

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
    return apiFetch<LoginResponse>("auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }, // --- Productos ---

  getProducts: (params?: {
    search?: string;
    status?: string;
    id_negocio?: string;
    categoria?: string; // ← Agrega este parámetro
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

  createProduct: (productData: any) =>
    apiFetch<any>("products", {
      method: "POST",
      body: JSON.stringify(productData),
    }),

  updateProduct: (id: string, productData: any) =>
    apiFetch<any>(`products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(productData),
    }),

  deleteProduct: (id: string) =>
    apiFetch<any>(`products/${id}`, {
      method: "DELETE",
    }), // --- Categorías ---

  getCategories: (params?: { id_negocio?: string }) => {
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
      const envNegocio = (globalThis as any).process?.env
        ?.NEXT_PUBLIC_NEGOCIO_ID;
      if (envNegocio) negocioId = envNegocio;
    }
    if (!negocioId) {
      throw new Error("Se requiere un negocio activo para cargar categorías");
    }
    const query = new URLSearchParams({
      id_negocio: String(negocioId),
    }).toString();
    return apiFetch<any[]>(`categories?${query}`);
  },
  getCategoryById: (id: string) => apiFetch<any>(`categories/${id}`),
  createCategory: (categoryData: { nombre: string; negocioId: string }) =>
    apiFetch<any>("categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    }),
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
  // --- 👇 CAMBIO AQUÍ: Añadido 'hero_image_url' ---
  createBusiness: (data: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
    logo?: string;
    hero_image_url?: string; // <- AÑADIDO
  }) =>
    apiFetch<any>("businesses", { method: "POST", body: JSON.stringify(data) }),
  listMyBusinesses: () => apiFetch<any[]>("businesses/my"),
  getPublicBusinesses: async () => {
    try {
      const businesses = await apiFetch<any[]>("businesses");
      console.log("✅ Negocios cargados desde API:", businesses);
      return businesses;
    } catch (error) {
      console.error("❌ Error cargando negocios públicos:", error); // Retorna array vacío en lugar de lanzar error
      return [];
    }
  },
  getBusinessById: async (id: string | number) => {
    try {
      // Asegúrate de que el ID sea string para la comparación
      const businessId = String(id);
      const business = await apiFetch<any>(`businesses/${businessId}`);
      console.log("✅ Tienda cargada desde API:", business);
      return business;
    } catch (error) {
      console.error("❌ Error cargando tienda:", error);
      throw error;
    }
  }, // --- Inventario ---

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
    apiFetch<any>(`inventory/${id}`, { method: "DELETE" }), // --- Ventas ---
  createSale: (data: {
    id_negocio: string;
    id_tipo_pago?: string;
    items: Array<{
      id_producto: string;
      cantidad: number;
      precio_unitario?: number;
    }>;
    cerrar?: boolean;
  }) => apiFetch<any>("sales", { method: "POST", body: JSON.stringify(data) }), // Historial de ventas

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
  getSale: (id: string) => apiFetch<any>(`sales/${id}`), // Legacy helper (si se usa en algún lugar)

  getStoreProducts: (id_negocio: string | number) => {
    if (!id_negocio) throw new Error("Se requiere un id_negocio válido");
    return apiFetch<any[]>(`store/${id_negocio}/products`);
  }, //Comentarios
  getBusinessComments: (id_negocio: string | number) =>
    apiFetch<any[]>(`businesses/${id_negocio}/ratings`),
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
