/**
 * Post Model
 *
 * Represents a feed post with optional code snippet and tags.
 *
 * Design decisions:
 *
 * 1. Comments are **embedded** sub-documents rather than a separate
 *    collection because they're always read alongside their parent post.
 *    This avoids extra queries and keeps the feed endpoint fast.
 *    If comments needed their own pagination or moderation workflow,
 *    a referenced collection would be the better trade-off.
 *
 * 2. `likes` is an array of User ObjectIds. Toggling a like is an
 *    atomic push/pull — we never need to query "all posts a user liked"
 *    at scale, so an array is simpler than a join table.
 *
 * 3. An index on `createdAt: -1` supports the default "newest first"
 *    sort efficiently.
 */

const mongoose = require('mongoose');

// ── Comment sub-schema (embedded) ──────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    // Each comment gets its own `createdAt` / `updatedAt`.
    timestamps: true,
  }
);

// ── Post schema ────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    text: {
      type: String,
      required: [true, 'Post text is required'],
      maxlength: [5000, 'Post cannot exceed 5000 characters'],
    },

    // Optional fenced code block — rendered with a monospace font on
    // the frontend.
    codeSnippet: {
      type: String,
      default: '',
    },

    tags: {
      type: [String],
      default: [],
    },

    // Array of user IDs who liked this post.
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Embedded comments (see note 1).
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Index for the default "newest first" feed sort.
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
