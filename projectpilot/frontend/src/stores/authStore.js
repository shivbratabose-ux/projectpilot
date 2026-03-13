import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pp_user') || 'null'),
  token: localStorage.getItem('pp_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('pp_token', data.token);
      localStorage.setItem('pp_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('pp_token');
    localStorage.removeItem('pp_user');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
