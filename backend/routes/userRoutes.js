const express = require("express");
const {
  listUsers,
  getUserProfile,
  updateProfile,
  getConversation,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", listUsers);
router.put("/me", updateProfile);
router.get("/:id", getUserProfile);
router.get("/:id/messages", getConversation);

module.exports = router;
