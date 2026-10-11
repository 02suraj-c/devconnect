const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Helper: sign a JWT that encodes only the user id.
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * @route   POST /api/auth/register
 * @desc    Create a new developer account
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  // Password hashing happens automatically in the User model's pre-save hook.
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      skills: user.skills,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and return a JWT
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has `select: false` on the schema, so it must be requested explicitly
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      skills: user.skills,
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Return the currently authenticated user (from the JWT)
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user was attached by the `protect` middleware
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, getMe };
