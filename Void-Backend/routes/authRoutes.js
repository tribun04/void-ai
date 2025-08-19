// In routes/authRoutes.js

const express = require("express");
const router = express.Router();

// Import the entire controller object
const authController = require("../controllers/authController");

// Import the 'protect' middleware
const { protect } = require("../middleware/authMiddleware");

// --- Define Your Routes ---

router.post("/login", authController.login);

// This now correctly points to the 'signup' function that exists.
router.post("/signup", authController.signup);

router.get("/me", protect, authController.getMe);

module.exports = router;
