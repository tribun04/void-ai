// controllers/agentController.js
const activeAgents = new Map();      // socketId → { name, email }
const userAssignments = new Map();   // userId → agentSocketId

// Called when an agent connects (you can trigger this via socket or auth)
exports.registerAgent = (socketId, agentInfo) => {
  activeAgents.set(socketId, agentInfo);
};

// Called when agent disconnects
exports.removeAgent = (socketId) => {
  activeAgents.delete(socketId);
  for (const [userId, agentId] of userAssignments.entries()) {
    if (agentId === socketId) userAssignments.delete(userId);
  }
};

// 🟢 Get all online agents
exports.getOnlineAgents = (req, res) => {
  const agents = Array.from(activeAgents.entries()).map(([id, data]) => ({
    socketId: id,
    ...data
  }));
  res.json(agents);
};

// 📌 Assign user to agent
exports.assignUserToAgent = (req, res) => {
  const { userId, agentSocketId } = req.body;
  if (!activeAgents.has(agentSocketId)) {
    return res.status(400).json({ message: 'Agent not online' });
  }
  userAssignments.set(userId, agentSocketId);
  res.json({ message: `User ${userId} assigned to agent ${agentSocketId}` });
};

// 🚫 Unassign user
exports.unassignUser = (req, res) => {
  const { userId } = req.body;
  userAssignments.delete(userId);
  res.json({ message: `User ${userId} unassigned` });
};

// Export helper to get assignment (can be used in other modules)
exports.getAssignedAgent = (userId) => {
  return userAssignments.get(userId) || null;
};
