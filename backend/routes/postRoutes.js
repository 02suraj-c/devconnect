const express = require("express");
const { body } = require("express-validator");
const {
  getFeed,
  createPost,
  toggleLike,
  addComment,
  deletePost,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// every post route requires a logged-in user
router.use(protect);

router.get("/", getFeed);

router.post(
  "/",
  [body("content").trim().notEmpty().withMessage("Post content is required")],
  validate,
  createPost
);

router.put("/:id/like", toggleLike);

router.post(
  "/:id/comments",
  [body("text").trim().notEmpty().withMessage("Comment text is required")],
  validate,
  addComment
);

router.delete("/:id", deletePost);

module.exports = router;
