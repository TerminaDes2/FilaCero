import { create } from 'zustand';
import axios from 'axios';

// Definimos la forma del estado y las acciones
interface UserState {
  user: any;
  token: string | null;
  login: (credentials: { correo_electronico: string; password: string }) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,

  // Acción para hacer login
  // 👇 Le añadimos el tipo al parámetro 'credentials' aquí
  login: async (credentials: { correo_electronico: string; password: string }) => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', credentials);
      const { access_token } = response.data;
      
      set({ token: access_token, user: { /* ... */ } });
      
      console.log('Login exitoso, token guardado en el store.');
    } catch (error) {
      console.error('Fallo el login:', error);
      throw error;
    }
  },

  // Acción para cerrar sesión
  logout: () => {
    set({ user: null, token: null });
  },
}));