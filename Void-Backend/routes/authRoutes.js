// In routes/authRoutes.js

const express = require('express');
const router = express.Router();

// --- Import ONLY the functions that actually exist in your controller ---
const { 
    login, 
    getMe, 
    signupAndInvoice 
} = require('../controllers/authController');

// --- Import your 'protect' middleware ---
// Make sure this file exists at 'middleware/authMiddleware.js'
const { protect } = require('../middleware/authMiddleware');


// --- Define Your Routes ---

// @desc    Handles user login
router.post('/login', login);

// @desc    Handles the public signup page
router.post('/signup', signupAndInvoice);

// @desc    Gets the profile of the currently logged-in user
// THIS IS THE ROUTE THAT WAS LIKELY CRASHING THE SERVER.
// It is now defined correctly with a handler that exists.
router.get('/me', protect, getMe);

// NOTE: We have intentionally REMOVED the '/register' route for now
// because there is no 'register' function in the controller.
// This is what stops the server from crashing.

module.exports = router;