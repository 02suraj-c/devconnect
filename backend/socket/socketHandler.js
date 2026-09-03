/**
 * Socket.io Handler
 *
 * Sets up real-time features: JWT auth at the handshake level,
 * presence tracking, and one-to-one chat with message persistence.
 *
 * Design decisions:
 *
 * 1. **Auth in `io.use()` (middleware) rather than per-event**:
 *    Verifying the JWT once at connection time means every subsequent
 *    event is already authenticated — no repeated token checks, no
 *    risk of a handler forgetting to verify. If the token is invalid
 *    the connection is rejected immediately and no events fire.
 *
 * 2. **Persist before emit**:
 *    Messages are saved to MongoDB *before* being emitted to the
 *    recipient. This guarantees data safety: even if the recipient's
 *    socket disconnects between the save and the emit, the message
 *    is never lost — they'll see it when they load chat history.
 *    The trade-off is ~5-20 ms extra latency for the sender, which
 *    is imperceptible in a chat UI.
 *
 * 3. **Online users Map**:
 *    A simple in-memory Map tracks { userId → socketId }. This works
 *    for a single-server deployment; for horizontal scaling you'd swap
 *    it for a Redis adapter (`@socket.io/redis-adapter`).
 */

const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Message = require('../models/Message');

// Map<userId, socketId> — tracks who's currently connected.
const onlineUsers = new Map();

/**
 * Initialise Socket.io on the given HTTP server instance.
 * Called once from server.js after the HTTP server is created.
 */
function initSocket(io) {
  // ── 1. Authentication middleware ─────────────────────────────────
  // Runs once per connection attempt, before any event handlers fire.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication error — no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar');

      if (!user) {
        return next(new Error('Authentication error — user not found'));
      }

      // Attach user info to the socket so event handlers can use it.
      socket.userId   = user._id.toString();
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Authentication error — invalid token'));
    }
  });

  // ── 2. Connection handler ────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Track this user as online.
    onlineUsers.set(userId, socket.id);

    // Broadcast their online status to everyone.
    io.emit('presence:update', { userId, isOnline: true });

    // Send the new client the full list of currently online users so
    // the UI can show correct badges immediately (not just reactively).
    socket.emit('presence:list', Array.from(onlineUsers.keys()));

    console.log(`🟢  ${socket.userName} connected (${userId})`);

    // ── Chat: send a message ───────────────────────────────────────
    socket.on('chat:send', async ({ receiverId, text }) => {
      try {
        if (!receiverId || !text?.trim()) return;

        // Persist first, emit second (see design note 2).
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
        });

        // Populate sender info so the frontend can render it directly.
        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        // Send to recipient if they're online.
        const recipientSocketId = onlineUsers.get(receiverId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('chat:receive', message);
        }

        // Echo back to sender so their UI updates immediately.
        socket.emit('chat:sent', message);
      } catch (err) {
        console.error('chat:send error:', err.message);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // ── Chat: typing indicator ─────────────────────────────────────
    socket.on('chat:typing', ({ receiverId }) => {
      const recipientSocketId = onlineUsers.get(receiverId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('chat:typing', { senderId: userId });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('presence:update', { userId, isOnline: false });
      console.log(`🔴  ${socket.userName} disconnected (${userId})`);
    });
  });
}

module.exports = initSocket;
