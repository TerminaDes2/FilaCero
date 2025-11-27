import { create } from 'zustand';
import { api } from '../lib/api';

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
    fecha_registro?: string | null;
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

// Nota: este módulo usa el cliente `api` que ya resuelve la base de API.

const normalizeEmployee = (item: any, businessId?: string): Employee => ({
  id_empleado: String(item.id_empleado ?? item.id ?? ''),
  negocio_id: String(item.negocio_id ?? businessId ?? ''),
  usuario_id: String(item.usuario_id ?? item.usuario?.id_usuario ?? ''),
  estado: (item.estado ?? 'pendiente') as Employee['estado'],
  fecha_alta: item.fecha_alta ?? item.created_at ?? new Date().toISOString(),
  usuario: {
    id_usuario: String(item.usuario?.id_usuario ?? item.usuario_id ?? ''),
    nombre: item.usuario?.nombre ?? item.nombre ?? item.correo_electronico ?? 'Usuario',
    correo_electronico: item.usuario?.correo_electronico ?? item.correo_electronico ?? '',
    numero_telefono: item.usuario?.numero_telefono ?? item.numero_telefono ?? null,
    avatar_url: item.usuario?.avatar_url ?? null,
    fecha_registro: item.usuario?.fecha_registro ?? null,
  },
});

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,

  fetchEmployees: async (businessId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getEmployeesByBusiness(businessId);
      const normalized = (data ?? []).map((i: any) => normalizeEmployee(i, businessId));
      set({ employees: normalized, loading: false });
    } catch (err: any) {
      const message = (err && err.message) || JSON.stringify(err) || 'Error obteniendo empleados';
      set({ error: message, loading: false });
      throw err;
    }
  },

  addEmployee: async (businessId: string, correo_electronico: string, nombre?: string) => {
    set({ loading: true, error: null });
    try {
      const newEmployee = await api.createEmployee(businessId, { correo_electronico, nombre });
      const normalized = normalizeEmployee(newEmployee, businessId);
      set((state) => ({
        employees: [normalized, ...state.employees],
        loading: false,
      }));
      return normalized;
    } catch (err: any) {
      const message = (err && err.message) || JSON.stringify(err) || 'Error creando empleado';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateEmployeeStatus: async (employeeId: string, estado: 'activo' | 'inactivo') => {
    set({ loading: true, error: null });
    try {
      const updated = await api.updateEmployee(employeeId, { estado });
      const normalized = normalizeEmployee(updated);
      set((state) => ({
        employees: state.employees.map((e) => (e.id_empleado === employeeId ? normalized : e)),
        loading: false,
      }));
    } catch (err: any) {
      const message = (err && err.message) || JSON.stringify(err) || 'Error actualizando empleado';
      set({ error: message, loading: false });
      throw err;
    }
  },

  removeEmployee: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteEmployee(employeeId);
      set((state) => ({
        employees: state.employees.map((e) => (e.id_empleado === employeeId ? { ...e, estado: 'inactivo' as const } : e)),
        loading: false,
      }));
    } catch (err: any) {
      const message = (err && err.message) || JSON.stringify(err) || 'Error eliminando empleado';
      set({ error: message, loading: false });
      throw err;
    }
  },
}));
