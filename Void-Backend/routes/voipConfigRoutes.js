const express = require('express');
const router = express.Router();
const voipConfigController = require('../controllers/voipConfigController');
// You should add an authentication middleware here to protect these routes
// const { protect, admin } = require('../middleware/authMiddleware');

// GET a provider's configuration
// Example: GET /api/voip-config/twilio
router.get('/:providerKey', voipConfigController.getConfig);

// POST (save) a provider's configuration
// Example: POST /api/voip-config/twilio
router.post('/:providerKey', voipConfigController.saveConfig);

// POST (deactivate) a provider's configuration
// Example: POST /api/voip-config/deactivate/twilio
router.post('/deactivate/:providerKey', voipConfigController.deactivateConfig);


module.exports = router;