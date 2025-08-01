const express = require('express');
const router = express.Router();
const { getActiveSessions } = require('../controllers/inboxController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActiveSessions);

module.exports = router;
