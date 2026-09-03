/**
 * Auth Routes
 *
 * Mounts the authentication endpoints under /api/auth.
 * Validation rules are defined inline so each route's requirements
 * are immediately visible next to the handler.
 */

const express   = require('express');
const { body }  = require('express-validator');
const validate  = require('../middleware/validate');
const protect   = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// GET /api/auth/me — protected
router.get('/me', protect, getMe);

module.exports = router;
