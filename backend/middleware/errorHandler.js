/**
 * Centralized Error Handling
 *
 * Express treats any middleware with four arguments (err, req, res, next)
 * as an error handler. By registering these *after* all routes in
 * server.js, every unhandled throw or `next(err)` ends up here.
 *
 * Benefits:
 *   - Controllers can simply `throw` or call `next(err)` without
 *     worrying about response formatting.
 *   - Stack traces only leak in development, never in production.
 *   - A single place to add logging, Sentry reporting, etc.
 */

// ── 404 handler — must be registered *before* the error handler ────
const notFound = (req, res, next) => {
  const error = new Error(`Not found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ── Generic error handler ──────────────────────────────────────────
const errorHandler = (err, req, res, _next) => {
  // If the status is still 200 (default), upgrade it to 500.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Include the stack trace only in development for debugging.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
