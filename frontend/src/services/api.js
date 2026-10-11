import axios from "axios";

// Single axios instance shared by the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("devconnect_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the backend ever says our token is invalid/expired, log the user out
// client-side so they aren't stuck seeing broken data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("devconnect_token");
      localStorage.removeItem("devconnect_user");
    }
    return Promise.reject(error);
  }
);

export default api;
