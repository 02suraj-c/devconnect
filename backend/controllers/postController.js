/**
 * Post Controller
 *
 * CRUD operations for the post feed: paginated listing, creation,
 * like toggling, commenting, and owner-only deletion.
 *
 * All handlers follow the pattern: validate → DB operation → respond.
 * Errors are forwarded to the centralized error handler via `next(err)`.
 */

const Post = require('../models/Post');

/**
 * GET /api/posts?page=1&limit=10
 * Returns a paginated feed sorted newest-first.
 *
 * Pagination uses skip/limit rather than cursor-based paging because
 * the expected data volume (thousands, not millions) makes the simpler
 * approach good enough, and it pairs naturally with a "page N" UI.
 */
const getPosts = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar')
        .populate('comments.user', 'name avatar'),
      Post.countDocuments(),
    ]);

    res.json({
      success: true,
      data: posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts
 * Creates a new post. The author is always the authenticated user.
 */
const createPost = async (req, res, next) => {
  try {
    const { text, codeSnippet, tags } = req.body;

    const post = await Post.create({
      author: req.user._id,
      text,
      codeSnippet: codeSnippet || '',
      tags: tags || [],
    });

    // Populate the author field so the frontend can display it
    // immediately without a second request.
    await post.populate('author', 'name avatar');

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/posts/:id/like
 * Toggles the authenticated user's like on a post.
 * If the user already liked it, their ID is removed; otherwise it's added.
 */
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({ success: true, data: post.likes });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts/:id/comments
 * Appends a comment to a post's embedded comments array.
 */
const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await post.save();

    // Re-populate so the response includes commenter names/avatars.
    await post.populate('comments.user', 'name avatar');

    res.status(201).json({ success: true, data: post.comments });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/posts/:id
 * Deletes a post — only the original author may do this.
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this post' });
    }

    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, createPost, toggleLike, addComment, deletePost };
