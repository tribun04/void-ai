// In Void-Backend/routes/integrationRoutes.js

const express = require("express");
const router = express.Router();

// This will now find the file we just created.
const integrationsController = require("../controllers/integrationsController");
const { protect } = require("../middleware/authMiddleware.js");

// Apply security to all routes in this file
router.use(protect);

// Define the routes
router.get("/settings", integrationsController.getSettings);
router.put("/settings", integrationsController.updateSettings);
router.post("/generate-key", integrationsController.generateApiKey);

module.exports = router;
