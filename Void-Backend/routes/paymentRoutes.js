const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protectAndScope } = require('../middleware/protectAndScope');

// Route for the frontend to create a payment request
router.post('/create-paysera-request', protectAndScope, paymentController.createPayseraRequest);

// Route for Paysera's server to send the callback. This should NOT be protected.
router.get('/paysera-callback', paymentController.handlePayseraCallback);

module.exports = router;