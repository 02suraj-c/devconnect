/**
 * User Controller
 *
 * Developer directory, profile view/edit, and chat history.
 *
 * Design decisions:
 *
 * 1. The directory search uses a case-insensitive regex on `name` and
 *    `skills`. Regex is fine at our scale (hundreds–thousands of users);
 *    for millions of documents, a text index + `$text` query would be
 *    more appropriate.
 *
 * 2. `updateProfile` only allows updating bio, skills, and githubUrl —
 *    not email or password — to keep the endpoint simple. A separate
 *    "change password" flow would handle credential updates.
 *
 * 3. Chat history returns messages sorted chronologically (oldest first)
 *    because that's the natural reading order in a chat UI.
 */

const User    = require('../models/User');
const Message = require('../models/Message');

/**
 * GET /api/users?search=react
 * Returns a list of developers, optionally filtered by name or skill.
 */
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    let filter = {};
    if (search) {
      // Match against name OR any skill, case-insensitive.
      const regex = new RegExp(search, 'i');
      filter = {
        $or: [
          { name: regex },
          { skills: regex },
        ],
      };
    }

    const users = await User.find(filter)
      .select('name email avatar bio skills githubUrl')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Returns a single developer's public profile.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email avatar bio skills githubUrl createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/me
 * Updates the authenticated user's own profile.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { bio, skills, githubUrl } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(githubUrl !== undefined && { githubUrl }),
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id/messages
 * Returns the chat history between the authenticated user and user :id,
 * sorted chronologically (oldest first — natural reading order).
 */
const getChatHistory = async (req, res, next) => {
  try {
    const otherUserId = req.params.id;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherUserId },
        { sender: otherUserId, receiver: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateProfile, getChatHistory };
