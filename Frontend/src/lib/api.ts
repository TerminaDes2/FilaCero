export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

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

export const api = {
  login: (correo_electronico: string, password: string) =>
    apiFetch<LoginResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo_electronico, password }),
    }),
  register: (name: string, email: string, password: string, role?: 'usuario' | 'admin') =>
    apiFetch<LoginResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, ...(role ? { role } : {}) }),
    }),
  me: () => apiFetch<any>('auth/me'),
};
