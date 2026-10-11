   const dns = require('dns');
   dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { initSocket } = require("./socket/socketHandler");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");

// Connect to MongoDB before doing anything else.
connectDB();

const app = express();

// --- Global middleware ---------------------------------------------------
app.use(helmet()); // sensible security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiting to slow down brute-force / abuse on the public API.
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- Health check (used by Render for readiness probes) ------------------
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});

// --- API routes ------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// --- 404 + error handling (must be last) ----------------------------------
app.use(notFound);
app.use(errorHandler);

// --- HTTP server + Socket.io ----------------------------------------------
// Socket.io needs the raw http server (not the Express app) so it can
// upgrade connections to WebSockets on the same port.
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  },
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DevConnect API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// Fail loudly instead of silently hanging on unhandled promise rejections.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});
