/**
 * User Routes
 *
 * Developer directory, public profiles, profile editing, and chat history.
 * All endpoints require authentication.
 *
 * Important: the `/me` route is registered *before* `/:id` so Express
 * doesn't try to parse the literal string "me" as a MongoDB ObjectId.
 */

const express = require('express');
const protect = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateProfile,
  getChatHistory,
} = require('../controllers/userController');

const router = express.Router();

// Every route in this file requires a valid JWT.
router.use(protect);

// GET  /api/users?search=react
router.get('/', getUsers);

// PUT  /api/users/me  — must be before /:id
router.put('/me', updateProfile);

// GET  /api/users/:id
router.get('/:id', getUserById);

// GET  /api/users/:id/messages
router.get('/:id/messages', getChatHistory);

module.exports = router;
