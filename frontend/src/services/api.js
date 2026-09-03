/**
 * Axios API Instance
 *
 * A pre-configured Axios instance that:
 *   1. Sets the base URL from the VITE_API_URL env var (falls back to
 *      /api for the Vite dev proxy).
 *   2. Attaches the JWT from localStorage to every outgoing request
 *      via a request interceptor — controllers never need to manually
 *      add the Authorization header.
 *   3. Catches 401 responses in a response interceptor: if the backend
 *      says "not authorised", the stored token is stale, so we clear
 *      it and redirect to /login. This handles token expiry gracefully.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 (token expired / invalid) ─────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dc_token');
      // Only redirect if we're not already on the login page.
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
