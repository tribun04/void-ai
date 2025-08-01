let io;
const db = require('./utils/db');

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Add agent connection logic
  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Agent comes online
    socket.on('agent-online', async ({ agentId, tenantId }) => {
      if (!agentId || !tenantId) return;

      try {
        await db.query(
          'UPDATE users SET is_online = 1 WHERE id = ? AND tenant_id = ?',
          [agentId, tenantId]
        );

        socket.agentId = agentId;
        socket.tenantId = tenantId;
        socket.join(tenantId);

        console.log(`🟢 Agent ${agentId} online for tenant ${tenantId}`);
      } catch (err) {
        console.error('❌ Failed to mark agent online:', err);
      }
    });

    // Agent disconnects
    socket.on('disconnect', async () => {
      if (socket.agentId && socket.tenantId) {
        try {
          await db.query(
            'UPDATE users SET is_online = 0 WHERE id = ? AND tenant_id = ?',
            [socket.agentId, socket.tenantId]
          );
          console.log(`🔴 Agent ${socket.agentId} disconnected`);
        } catch (err) {
          console.error('❌ Failed to mark agent offline:', err);
        }
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIO };
