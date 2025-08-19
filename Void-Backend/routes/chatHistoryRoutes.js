// routes/chatHistoryRoutes.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
    getChatLogsList,
    getChatLogContent,
} = require('../controllers/chatHistoryController');

// All routes require auth
router.use(protect);

// ---- Primary routes
// JWT-scoped list/detail
router.get('/chat-history', getChatLogsList);
router.get('/chat-history/:conversationId', getChatLogContent);

// Explicit tenant routes (for SUPERADMIN viewing other tenants)
router.get('/tenants/:tenantId/chat-history', getChatLogsList);
router.get('/tenants/:tenantId/chat-history/:conversationId', getChatLogContent);

// ---- Legacy aliases (keep until all frontends are updated)
router.get('/tenant/chat-history', getChatLogsList);
router.get('/tenant/chat-history/:conversationId', getChatLogContent);

module.exports = router;
