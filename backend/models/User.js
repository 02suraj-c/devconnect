/**
 * User Model
 *
 * Stores developer profiles and authentication credentials.
 *
 * Design decisions:
 *
 * 1. `password` uses `select: false` so it's excluded from query results
 *    by default. This prevents accidentally leaking hashes through the
 *    API — controllers that need the password (login) must explicitly
 *    `.select('+password')`.
 *
 * 2. We hash passwords in a Mongoose `pre('save')` hook rather than in
 *    the controller so the logic lives in one place and can't be bypassed.
 *    The `isModified('password')` guard ensures we don't re-hash an
 *    already-hashed value on unrelated profile updates.
 *
 * 3. `matchPassword` is an instance method so callers don't need to know
 *    the hashing details — they just call `user.matchPassword(plain)`.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
    },

    // `select: false` keeps the hash out of normal queries (see note 1).
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },

    skills: {
      type: [String],
      default: [],
    },

    githubUrl: {
      type: String,
      default: '',
    },

    // Simple avatar URL — could be replaced with Cloudinary later.
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    // Adds `createdAt` and `updatedAt` automatically.
    timestamps: true,
  }
);

// ── Pre-save hook: hash the password only when it changes ──────────
userSchema.pre('save', async function (next) {
  // Skip hashing if the password field wasn't touched (e.g. profile edit).
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare a plain-text candidate to the hash ────
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
