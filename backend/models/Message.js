const mongoose = require("mongoose");

/**
 * Chat message. Persisted so a user can reload a conversation after
 * reconnecting; Socket.io is used only for the real-time delivery, not
 * as the source of truth.
 */
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fetching a conversation always filters by the pair of participants and
// sorts by time, so compound-index that access pattern.
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
