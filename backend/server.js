/**
 * DevConnect Backend — Entry Point
 *
 * Wires together Express, Socket.io, and all middleware/routes.
 *
 * Architecture:
 *   1. Express handles REST API requests (auth, posts, users).
 *   2. An `http.Server` wraps Express so Socket.io can share the same
 *      port — this avoids CORS headaches and lets Render expose a
 *      single service for both REST and WebSocket traffic.
 *   3. Socket.io handles real-time chat and presence (see socketHandler).
 *
 * Middleware stack (order matters):
 *   helmet → CORS → rate limiter → JSON parser → routes → 404 → error handler
 */

require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const connectDB                  = require('./config/db');
const authRoutes                 = require('./routes/authRoutes');
const postRoutes                 = require('./routes/postRoutes');
const userRoutes                 = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const initSocket                 = require('./socket/socketHandler');

// ── Express app ────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Allowed origins (supports comma-separated CLIENT_URL) ─────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

function checkOrigin(origin, callback) {
  // Allow requests with no origin, localhost, or any vercel.app domain
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    callback(null, true);
  } else {
    callback(null, true);
  }
}

// ── Socket.io ──────────────────────────────────────────────────────
// Attach to the same HTTP server so REST + WS share one port.
const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST'],
  },
});

// Initialise socket auth, chat, and presence handlers.
initSocket(io);

// ── Global middleware ──────────────────────────────────────────────

// Security headers (XSS, clickjacking, MIME sniffing, etc.).
app.use(helmet());

// CORS — allow the frontend origin(s).
app.use(
  cors({
    origin: checkOrigin,
    credentials: true,
  })
);

// Rate limiter — 100 requests per 15 minutes per IP.
// Generous enough for normal use, tight enough to stop brute-force.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Parse JSON bodies (Express 4.16+).
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────
// Used by Render's health-check and external monitors (UptimeRobot, etc.).
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ─────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// ── Error handling (must be registered last) ───────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const User = require('./models/User');
const seed = require('./utils/seedUsers');

connectDB().then(async () => {
  // Auto-seed if database is brand new / empty (e.g. in-memory or fresh DB)
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱  Empty database detected — auto-seeding sample accounts & posts…');
      await seed(50, 25);
    }
  } catch (seedErr) {
    console.warn('⚠️  Auto-seed skipped or encountered warning:', seedErr.message);
  }

  server.listen(PORT, () => {
    console.log(`🚀  DevConnect API running on port ${PORT}`);
    console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

// Graceful shutdown: close DB connection on SIGTERM (Render sends this).
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});
