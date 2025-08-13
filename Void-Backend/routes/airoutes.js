const express = require('express');
const router = express.Router();

const { trainAIEntry, getAIEntries, deleteAIEntry, askAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/train-ai', protect, trainAIEntry);
router.post('/ask-ai', protect, askAI);
router.get('/ai-entries', protect, getAIEntries);
router.delete('/ai-entries/:intent', protect, deleteAIEntry);

module.exports = router;