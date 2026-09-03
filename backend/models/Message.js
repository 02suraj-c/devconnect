/**
 * Message Model
 *
 * Persisted chat messages between two users.
 *
 * Design decisions:
 *
 * 1. Messages are persisted **before** being emitted over Socket.io
 *    (see socketHandler.js). This guarantees that even if the recipient
 *    is offline or the socket drops mid-emit, the message is never lost.
 *    The trade-off is slightly higher latency for the sender (a DB write
 *    before the echo), but data safety beats speed here.
 *
 * 2. A compound index on `(sender, receiver, createdAt)` covers the
 *    most common query: "give me the conversation between user A and
 *    user B, sorted chronologically". Mongo can use this index for
 *    either direction of the conversation (A→B or B→A) with an $or.
 *
 * 3. The `read` flag is reserved for future "seen" receipts; it's not
 *    used in the initial implementation but is cheap to add now.
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    // Reserved for future "seen" receipts.
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient chat-history queries (see note 2).
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
