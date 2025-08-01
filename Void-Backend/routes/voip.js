const express = require('express');
const router = express.Router();
const voipController = require('../controllers/voipController');

// Define a unique HTTP endpoint for each provider's webhook
router.post('/incoming-twilio', voipController.handleTwilioCall);
router.post('/incoming-signalwire', voipController.handleSignalWireCall);
router.get('/incoming-vonage', voipController.handleVonageCall); // Vonage uses GET
router.all('/incoming-plivo', voipController.handlePlivoCall);   // Plivo can use GET or POST
router.post('/incoming-telnyx', voipController.handleTelnyxCall);

module.exports = router;