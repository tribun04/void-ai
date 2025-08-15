const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");
const { validateApiKey } = require("../middleware/tenantAuthMiddleware");

// All routes in this file will be protected by the API key middleware.
router.use(validateApiKey);

// GET /api/v1/usage
router.get("/usage", apiController.getUsage);

// POST /api/v1/service
router.post("/service", apiController.exampleService);

module.exports = router;
