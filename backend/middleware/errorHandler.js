/**
 * Express error-handling middleware (must have 4 args to be recognized as such).
 * Any error thrown or passed via next(err) anywhere in the app ends up here,
 * so route handlers can stay free of repetitive try/catch + res.json blocks
 * (see express-async-handler usage in the controllers/routes).
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    // stack traces only leak in development, never in production responses
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

// 404 handler for unmatched routes, placed before errorHandler in server.js
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };
