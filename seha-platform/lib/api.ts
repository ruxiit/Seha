import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Token helpers ────────────────────────────────────────────
const TOKEN_KEY = 'seha_jwt';

export const authStore = {
  getToken: (): string | null => {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  setToken: (token: string): void => {
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
  },
  clearToken: (): void => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
  },
};

// ── Request interceptor: attach Bearer token ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = authStore.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.clearToken();
      // Redirect to login if needed (handled per-page)
    }
    return Promise.reject(error);
  }
);

export default api;
