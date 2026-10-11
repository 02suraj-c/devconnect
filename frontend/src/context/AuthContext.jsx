import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

/**
 * Holds the logged-in user + JWT in memory (mirrored to localStorage so a
 * page refresh doesn't log the user out). Wraps register/login/logout so
 * every page can call useAuth() instead of duplicating token handling.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("devconnect_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, verify the stored token is still valid by asking /auth/me.
  useEffect(() => {
    const token = localStorage.getItem("devconnect_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (token, userData) => {
    localStorage.setItem("devconnect_token", token);
    localStorage.setItem("devconnect_user", JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    persistSession(data.token, data.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("devconnect_token");
    localStorage.removeItem("devconnect_user");
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook so components do `const { user } = useAuth()`.
export const useAuth = () => useContext(AuthContext);
