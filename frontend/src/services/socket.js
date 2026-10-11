import { io } from "socket.io-client";

let socket = null;

/**
 * Lazily creates (or returns the existing) Socket.io connection,
 * authenticated with the current user's JWT. Call this once after login
 * and reuse the same socket everywhere (chat page, presence indicators…).
 */
export function getSocket() {
  const token = localStorage.getItem("devconnect_token");
  if (!token) return null;

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
