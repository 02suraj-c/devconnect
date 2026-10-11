const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");

/**
 * @route   GET /api/posts?page=1&limit=10
 * @desc    Paginated feed, newest first
 * @access  Private
 */
const getFeed = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name avatarUrl")
      .populate("comments.author", "name avatarUrl"),
    Post.countDocuments(),
  ]);

  res.json({
    success: true,
    posts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { content, codeSnippet, tags } = req.body;

  const post = await Post.create({
    author: req.user._id,
    content,
    codeSnippet,
    tags,
  });

  const populated = await post.populate("author", "name avatarUrl");
  res.status(201).json({ success: true, post: populated });
});

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Toggle a like on a post
 * @access  Private
 */
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const alreadyLiked = post.likes.some((id) => id.equals(req.user._id));
  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => !id.equals(req.user._id));
  } else {
    post.likes.push(req.user._id);
  }
  await post.save();

  res.json({ success: true, likesCount: post.likes.length, liked: !alreadyLiked });
});

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  post.comments.push({ author: req.user._id, text });
  await post.save();
  await post.populate("comments.author", "name avatarUrl");

  res.status(201).json({ success: true, comments: post.comments });
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (author only)
 * @access  Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  if (!post.author.equals(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }
  await post.deleteOne();
  res.json({ success: true, message: "Post deleted" });
});

module.exports = { getFeed, createPost, toggleLike, addComment, deletePost };
