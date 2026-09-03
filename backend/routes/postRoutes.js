/**
 * Post Routes
 *
 * All post endpoints require authentication (protect middleware applied
 * to the entire router). Validation is inline per route.
 */

const express  = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect  = require('../middleware/auth');
const {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  deletePost,
} = require('../controllers/postController');

const router = express.Router();

// Every route in this file requires a valid JWT.
router.use(protect);

// GET /api/posts?page=1&limit=10
router.get('/', getPosts);

// POST /api/posts
router.post(
  '/',
  [body('text').trim().notEmpty().withMessage('Post text is required')],
  validate,
  createPost
);

// PUT /api/posts/:id/like
router.put('/:id/like', toggleLike);

// POST /api/posts/:id/comments
router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  addComment
);

// DELETE /api/posts/:id
router.delete('/:id', deletePost);

module.exports = router;
