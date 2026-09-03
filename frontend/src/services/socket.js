/**
 * Socket.io Client
 *
 * Factory function that creates an authenticated Socket.io connection.
 *
 * Why a factory instead of a singleton?
 * The token can change (login/logout), so the socket must be re-created
 * with the current token each time. A singleton would keep the old
 * token after a re-login.
 *
 * The `auth: { token }` option sends the JWT during the handshake.
 * On the server side, `io.use()` middleware verifies this token before
 * allowing the connection — see socketHandler.js for details.
 */

import { io } from 'socket.io-client';

/**
 * Create a new authenticated socket connection.
 * Call this when the user logs in; disconnect when they log out.
 */
export function createSocket() {
  const token = localStorage.getItem('dc_token');

  if (!token) {
    console.warn('createSocket called without a token — skipping');
    return null;
  }

  const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
    auth: { token },
    // Attempt to reconnect up to 5 times with increasing delays.
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🟢 Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('🔴 Socket connection error:', err.message);
  });

  return socket;
}
