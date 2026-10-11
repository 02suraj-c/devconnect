const mongoose = require("mongoose");

/**
 * A single feed post. Comments are embedded (sub-documents) since they are
 * always read together with the post and rarely grow unbounded; likes are
 * stored as an array of user ObjectIds so we can check "did I like this"
 * cheaply on the client (post.likes.includes(currentUserId)).
 */
const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Post content cannot be empty"],
      maxlength: 2000,
    },
    codeSnippet: {
      type: String, // optional formatted code block attached to the post
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Feed queries are always sorted newest-first, so index createdAt descending.
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
