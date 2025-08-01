// routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllConversations,
  sendReply
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

// ✅ Get all conversations (admin only)
router.get('/', protect, getAllConversations);

// ✅ Send a reply to a user
router.post('/:userId/reply', protect, sendReply);

module.exports = router;
