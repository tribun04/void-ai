// In Void-Backend/routes/widgetRoutes.js

const express = require("express");
const router = express.Router();

// Import the middleware and controller needed for this route
const { validateApiKey } = require("../middleware/tenantAuthMiddleware");
const widgetController = require("../controllers/widgetController");

// --- DEFINE THE ROUTE ---
// This creates the endpoint: GET /api/widget/config
//
// How it works:
// 1. A GET request comes to this URL.
// 2. `validateApiKey` middleware runs first to check the 'x-tenant-api-key' header.
// 3. If the key is valid, the request is passed to `widgetController.getConfiguration`.
router.get("/config", validateApiKey, widgetController.getConfiguration);

module.exports = router;
