const express = require('express');
const router = express.Router();
const {
  handleChatMessage,
  createSessionRequest,
  getAllSessions,
  acceptSession
} = require('../controllers/chatController');

const { validateApiKey } = require('../middleware/tenantAuthMiddleware'); // or resolveTenant
const { authenticateJWT } = require('../middleware/authMiddleware'); // optional for agents

// 🔹 AI Chat (Bot API Key)
router.post('/ask', validateApiKey, handleChatMessage);
router.post('/session/create', validateApiKey, createSessionRequest);
router.get('/session/all', validateApiKey, getAllSessions);
router.post('/session/accept', validateApiKey, acceptSession);


module.exports = router;
