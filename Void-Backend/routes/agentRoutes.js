const express = require("express");
const router = express.Router();
const {
  getOnlineAgents,
  assignUserToAgent,
  unassignUser,
} = require("../controllers/agentController");
const { protect } = require("../middleware/authMiddleware");

// ✅ Get all online agents (protected)
router.get("/online", protect, getOnlineAgents);

// ✅ Assign user to agent (protected)
router.post("/assign", protect, assignUserToAgent);

// ✅ Unassign user from agent (protected)
router.post("/unassign", protect, unassignUser);

module.exports = router;
