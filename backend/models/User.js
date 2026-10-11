const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User schema.
 * - password is never returned by default (select: false)
 * - password is hashed automatically in a pre-save hook
 * - comparePassword() is used by the login controller
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // excluded from query results unless explicitly requested
    },
    bio: {
      type: String,
      default: "",
      maxlength: 280,
    },
    skills: {
      type: [String], // e.g. ["React", "Node.js", "MongoDB"]
      default: [],
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    githubUrl: {
      type: String,
      default: "",
    },
    // simple online-presence flag, toggled by the Socket.io layer
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash the password whenever it is created or modified.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare a plaintext password against the stored hash.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
