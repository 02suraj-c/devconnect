/**
 * Validation Result Handler
 *
 * A thin wrapper around express-validator's `validationResult`.
 * Routes define their validation rules inline (e.g. `body('email').isEmail()`),
 * and this middleware is placed *after* those rules to short-circuit
 * the request if any rule failed.
 *
 * Keeping this separate avoids duplicating the "check-and-return-400"
 * boilerplate in every controller.
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return the first error message for simplicity; the full array
    // is available in `errors` if the frontend wants to highlight
    // individual fields later.
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }

  next();
};

module.exports = validate;
