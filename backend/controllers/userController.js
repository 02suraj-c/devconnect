const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Message = require("../models/Message");

/**
 * @route   GET /api/users
 * @desc    Developer directory (for finding people to connect/chat with)
 * @access  Private
 */
const listUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { _id: { $ne: req.user._id } };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { skills: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filter).select("name bio skills avatarUrl isOnline");
  res.json({ success: true, users });
});

/**
 * @route   GET /api/users/:id
 * @desc    Public profile of a single developer
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "name bio skills avatarUrl githubUrl isOnline createdAt"
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, user });
});

/**
 * @route   PUT /api/users/me
 * @desc    Update the logged-in user's own profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, skills, avatarUrl, githubUrl } = req.body;

  const user = await User.findById(req.user._id);
  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) user.skills = skills;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (githubUrl !== undefined) user.githubUrl = githubUrl;

  await user.save();
  res.json({ success: true, user });
});

/**
 * @route   GET /api/users/:id/messages
 * @desc    Chat history between the logged-in user and :id
 * @access  Private
 */
const getConversation = asyncHandler(async (req, res) => {
  const otherUserId = req.params.id;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user._id },
    ],
  }).sort({ createdAt: 1 });

  res.json({ success: true, messages });
});

module.exports = { listUsers, getUserProfile, updateProfile, getConversation };
