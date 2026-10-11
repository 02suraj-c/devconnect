const { validationResult } = require("express-validator");

/**
 * Runs after express-validator's chain of checks (see authRoutes.js /
 * postRoutes.js). If any check failed, respond with 400 and the list of
 * problems instead of letting the request reach the controller.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
