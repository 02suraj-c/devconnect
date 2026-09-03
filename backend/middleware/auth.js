/**
 * JWT "protect" Middleware
 *
 * Guards private routes by verifying the JSON Web Token sent in the
 * `Authorization` header.
 *
 * Why a middleware rather than per-controller checks?
 * Centralising auth logic here means every protected route gets the
 * same consistent behaviour — extract token, verify, attach user —
 * without any controller needing to know *how* auth works. Adding a
 * new protected route is just `router.use(protect)`.
 *
 * Flow:
 *   1. Read `Authorization: Bearer <token>` from the request header.
 *   2. Verify the token with the shared JWT_SECRET.
 *   3. Fetch the user from the DB (ensures they still exist).
 *   4. Attach the user document to `req.user` for downstream handlers.
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Tokens are sent as "Bearer <jwt>" in the Authorization header.
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorised — no token provided',
    });
  }

  try {
    // Verify signature + expiration.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user (minus the password hash) so controllers can
    // reference `req.user` without another DB call.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorised — user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorised — token is invalid or expired',
    });
  }
};

module.exports = protect;
