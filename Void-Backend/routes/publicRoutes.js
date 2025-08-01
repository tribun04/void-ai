const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.post('/signup', publicController.handleSignup);

module.exports = router;