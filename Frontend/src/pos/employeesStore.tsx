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

// Nota: este módulo usa el cliente `api` que ya resuelve la base de API.

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,

  fetchEmployees: async (businessId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getEmployeesByBusiness(businessId);
      set({ employees: data, loading: false });
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
      set((state) => ({
        employees: [newEmployee, ...state.employees],
        loading: false,
      }));
      return newEmployee;
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
      set((state) => ({
        employees: state.employees.map((e) => (e.id_empleado === employeeId ? updated : e)),
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
