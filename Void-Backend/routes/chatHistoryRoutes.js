const express = require('express');
const router = express.Router();
const { getChatLogsList, getChatLogContent } = require('../controllers/chatHistoryController');
const { protect, isSuperadmin } = require('../middleware/authMiddleware');

// Protect all routes in this file, ensuring only a logged-in superadmin can access them.
router.use(protect, isSuperadmin);

// Route to get the list of all chat logs
router.get('/', getChatLogsList);

// Route to get the content of a specific chat log by its ID
router.get('/:conversationId', getChatLogContent);

module.exports = router;