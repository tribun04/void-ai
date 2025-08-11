const express = require('express');
const router = express.Router();

const { trainAIEntry, getAIEntries, deleteAIEntry, askAI } = require('../controllers/aiController');
const { protect, isSuperadmin } = require('../middleware/authMiddleware');

// Train a new AI entry (Superadmin only)
router.post('/train-ai', protect, isSuperadmin, trainAIEntry);

// Ask the AI (any authenticated user)
router.post('/ask-ai', protect, askAI);

// Get all AI entries (Superadmin only)
router.get('/ai-entries', protect, isSuperadmin, getAIEntries);

// Delete an AI entry by intent (Superadmin only)
router.delete('/ai-entries/:intent', protect, isSuperadmin, deleteAIEntry);

module.exports = router;
