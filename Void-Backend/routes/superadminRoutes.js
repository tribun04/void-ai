// In routes/superadminRoutes.js

const express = require("express");
const router = express.Router();

// --- Controller Imports ---
const superadminController = require("../controllers/superadminController");
const whatsappController = require("../controllers/whatsappController"); // We import the whole controller

// --- Middleware Imports ---
const { protect, isSuperadmin } = require("../middleware/authMiddleware");

// =================================================================
// SECURITY
// Apply 'protect' and 'isSuperadmin' middleware to ALL routes in this file.
// =================================================================
router.use(protect, isSuperadmin);

// =================================================================
// ROUTE DEFINITIONS
// =================================================================

// --- User & Tenant Management Routes ---
router.get("/users", superadminController.getAllUsers);
router.post("/users", superadminController.createUser);
router.get("/users/:id", superadminController.getUserById);
router.delete("/users/:id", superadminController.deleteUser);
router.patch("/users/:id/activate", superadminController.activateUser);

router.get("/tenants/:tenantId", superadminController.getTenantById);
router.post("/tenants/:tenantId/activate", superadminController.activateTenant);

// --- AI Training Routes ---
router.get("/ai-entries", superadminController.getAIEntries);
router.post("/train-ai", superadminController.trainAIEntry);
router.delete("/ai-entries/:intent", superadminController.deleteAIEntry);

// --- Dashboard Analytics Routes ---
router.get("/chat-volume", superadminController.getChatVolume);
router.get(
  "/conversations/count-today",
  superadminController.getTodaysConversationsCount
);
router.get("/recent-activity", superadminController.getRecentActivity);
router.get("/top-intents", superadminController.getTopIntents);

// =================================================================
// ✅ SUPERADMIN WHATSAPP MANAGEMENT ROUTES ✅
// These routes are new and allow a superadmin to monitor and control
// the WhatsApp bots for ANY tenant.
// =================================================================

router.get("/whatsapp/status-all", whatsappController.getAllBotStatuses);

// @desc    Force start a bot for a SPECIFIC tenant (using their ID in the URL)
router.post(
  "/whatsapp/start/:tenantId",
  whatsappController.startBotForSpecificTenant
);

// @desc    Force stop a bot for a SPECIFIC tenant
router.post(
  "/whatsapp/stop/:tenantId",
  whatsappController.stopBotForSpecificTenant
);

module.exports = router;
