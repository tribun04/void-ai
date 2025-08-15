// In routes/whatsappRoutes.js

const express = require("express");
const router = express.Router();

// Import the security middleware
const { protect } = require("../middleware/authMiddleware");

// Import our final, clean controller
const whatsappController = require("../controllers/whatsappController");

// Apply the 'protect' middleware to ALL routes in this file.
router.use(protect);

// --- Route Definitions ---

// @route   POST /api/whatsapp/start-service
router.post("/start-service", whatsappController.startService);

// @route   POST /api/whatsapp/stop-service
router.post("/stop-service", whatsappController.stopService);

// @route   GET /api/whatsapp/status
router.get("/status", whatsappController.getStatus);

module.exports = router;
