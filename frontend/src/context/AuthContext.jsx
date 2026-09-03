/**
 * Auth Context
 *
 * Provides authentication state and actions (login, register, logout)
 * to the entire component tree via React Context.
 *
 * Session persistence strategy:
 *   1. On login/register, the JWT is stored in localStorage.
 *   2. On app load, the context reads the stored token and calls
 *      `GET /api/auth/me` to re-validate it (the token might be
 *      expired or the user might have been deleted).
 *   3. If validation fails, the token is cleared and the user is
 *      treated as logged out.
 *
 * A `loading` flag prevents the app from rendering the login page
 * while the re-validation request is in flight — without this guard,
 * returning users would see a brief flash of the login form.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until initial check completes

  // ── Re-validate the stored token on mount ────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('dc_token');

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Token invalid or expired — clear it.
        localStorage.removeItem('dc_token');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Register ─────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('dc_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // ── Login ────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('dc_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // ── Logout ───────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('dc_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for consuming the auth context.
 * Throws if used outside of <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
