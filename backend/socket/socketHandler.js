const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");

// Maps a userId -> socketId so we can push messages directly to a
// specific connected user instead of broadcasting to everyone.
const onlineUsers = new Map();

/**
 * Wires up all Socket.io behaviour. Called once from server.js with the
 * `io` instance created around the shared HTTP server.
 */
function initSocket(io) {
  // Auth middleware for the socket handshake: the client sends its JWT
  // as `auth.token` when calling io(url, { auth: { token } }) on the client.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error: no token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId } = socket;
    onlineUsers.set(userId, socket.id);
    console.log(`Socket connected: user ${userId} (${socket.id})`);

    // Mark the user online and let everyone know.
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("presence:update", { userId, isOnline: true });

    // --- Real-time direct messaging -------------------------------------
    socket.on("chat:send", async ({ receiverId, text }) => {
      if (!text?.trim()) return;

      // Persist first so refreshing the page never loses a message.
      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        text: text.trim(),
      });

      // Deliver to the receiver immediately if they're online.
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("chat:receive", message);
      }
      // Echo back to the sender so their own UI updates (multi-tab safe).
      socket.emit("chat:sent", message);
    });

    // --- Typing indicator -------------------------------------------------
    socket.on("chat:typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("chat:typing", { senderId: userId });
      }
    });

    // --- Disconnect ---------------------------------------------------
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit("presence:update", { userId, isOnline: false });
      console.log(`Socket disconnected: user ${userId}`);
    });
  });
}

module.exports = { initSocket };
