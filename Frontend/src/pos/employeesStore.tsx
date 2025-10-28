import { create } from 'zustand';

export interface Employee {
  id_empleado: string;
  negocio_id: string;
  usuario_id: string;
  estado: 'activo' | 'inactivo';
  fecha_alta: string;
  usuario: {
    id_usuario: string;
    nombre: string;
    correo_electronico: string;
    numero_telefono?: string | null;
    avatar_url?: string | null;
    fecha_registro: string;
  };
}

interface EmployeesState {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: (businessId: string) => Promise<void>;
  addEmployee: (businessId: string, correo: string, nombre?: string) => Promise<Employee>;
  updateEmployeeStatus: (employeeId: string, estado: 'activo' | 'inactivo') => Promise<void>;
  removeEmployee: (employeeId: string) => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,

  fetchEmployees: async (businessId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/employees/business/${businessId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      set({ employees: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  addEmployee: async (businessId: string, correo_electronico: string, nombre?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/employees/business/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correo_electronico, nombre }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const newEmployee = await res.json();
      set((state) => ({
        employees: [newEmployee, ...state.employees],
        loading: false,
      }));
      return newEmployee;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateEmployeeStatus: async (employeeId: string, estado: 'activo' | 'inactivo') => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const updated = await res.json();
      set((state) => ({
        employees: state.employees.map((e) =>
          e.id_empleado === employeeId ? updated : e
        ),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  removeEmployee: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      set((state) => ({
        employees: state.employees.map((e) =>
          e.id_empleado === employeeId ? { ...e, estado: 'inactivo' as const } : e
        ),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
