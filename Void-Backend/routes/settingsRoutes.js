const express = require('express');
const router = express.Router();

// Import the controller functions, including the new ones
const {
    getSettings,
    updateProfile,
    updateWorkspace,
    updatePassword, // <-- Add this
    updateEmail,    // <-- Add this
} = require('../controllers/settingsController');

const { protect } = require('../middleware/authMiddleware');

// GET route to fetch all settings data
router.route('/').get(protect, getSettings);

// PUT route to update the user's profile information (name)
router.route('/profile').put(protect, updateProfile);

// PUT route to update the workspace's global settings (timezone)
router.route('/workspace').put(protect, updateWorkspace);

// PUT route to update the user's password
router.route('/password').put(protect, updatePassword); // <-- Add this route

// PUT route to update the user's login email
router.route('/email').put(protect, updateEmail); // <-- Add this route

module.exports = router;