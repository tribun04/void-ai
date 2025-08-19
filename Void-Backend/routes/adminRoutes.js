const express = require("express");
const router = express.Router();

// ✅ --- 1. THE FIX: Correct the filename to be all lowercase --- ✅
// This now correctly points to 'adminController.js'
const adminController = require("../controllers/adminController");
const {
  getAgentsForMyTenant,
  createAgent,
  deleteUser,
} = require("../controllers/adminController");

// Import your middleware functions
const { protect, isSuperadmin } = require("../middleware/authMiddleware");

// --- Apply security middleware to ALL routes in this file ---
router.use(protect);
router.use(isSuperadmin);

// --- Define the Routes ---

router.get("/my-agents", getAgentsForMyTenant);
router.post("/agents", protect, createAgent); // ✅ change this
router.delete("/agents/:id", protect, deleteUser); // Changed 'users' to 'agents'

// POST /api/admin/agents
// Creates a new agent for the tenant of the authenticated user.
// This route is protected and requires the user to be authenticated.

// GET /api/superadmin/tenants
// Gets the list of all tenants for the main dashboard view.
router.get("/tenants", adminController.getTenants);

// ✅ --- 2. THE FIX: Add the missing route for the modal --- ✅
// GET /api/superadmin/tenants/:tenantId
// Gets the detailed information for a single tenant.
router.get("/tenants/:tenantId", adminController.getTenantById);

// POST /api/superadmin/tenants/:tenantId/activate
// Activates a new tenant after payment.
router.post("/tenants/:tenantId/activate", adminController.activateTenant);

// PUT /api/superadmin/tenants/:tenantId/tokens
// Updates the token balance for a tenant.
router.put("/tenants/:tenantId/tokens", adminController.updateTenantTokens);

// POST /api/superadmin/tenants/:tenantId/regenerate-key
// Creates a new API key for a tenant.
router.post(
  "/tenants/:tenantId/regenerate-key",
  adminController.regenerateApiKey
);

module.exports = router;
