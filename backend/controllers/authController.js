/**
 * Auth Controller
 *
 * Handles registration, login, and "who am I?" queries.
 *
 * All three actions share a common pattern: validate input → do work →
 * return a JSON response. JWTs are signed with a 7-day expiry so
 * users aren't forced to re-login constantly, while still expiring
 * eventually to limit the blast radius of a leaked token.
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: sign a JWT for a given user ID ─────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /api/auth/register
 * Creates a new user account and returns a JWT.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for duplicate email before attempting the insert so we can
    // return a friendlier error than Mongo's E11000.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with that email already exists',
      });
    }

    const user = await User.create({ name, email, password });

    // Generate a deterministic avatar from the user's name (via UI Avatars).
    user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
    await user.save();

    res.status(201).json({
      success: true,
      token: signToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticates an existing user and returns a JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // `select('+password')` is required because the schema sets
    // `password: { select: false }` to prevent accidental leaks.
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.json({
      success: true,
      token: signToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 * Used by the frontend's AuthContext to re-validate the session on load.
 */
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };
