const { Server } = require("socket.io");
const db = require("./utils/db");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // In production, restrict this to your frontend's URL
      methods: ["GET", "POST"],
    },
    // ✅ THIS IS THE FIX for version mismatch issues
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // --- AGENT & USER (FRONTEND) ROOM MANAGEMENT ---
    socket.on("join-tenant-room", ({ tenantId, userId }) => {
      if (!tenantId) return;
      const room = `tenant-room-${tenantId}`;
      socket.join(room);
      console.log(`[Socket] Frontend client ${socket.id} joined room: ${room}`);
      if (userId) {
        socket.agentId = userId;
        socket.tenantId = tenantId;
        db.query(
          "UPDATE users SET is_online = 1 WHERE id = ? AND tenant_id = ?",
          [userId, tenantId]
        )
          .then(() =>
            console.log(`🟢 Agent ${userId} is online for tenant ${tenantId}`)
          )
          .catch((err) =>
            console.error("❌ DB Error marking agent online:", err)
          );
      }
    });

    // --- WHATSAPP BOT PROCESS ROOM & EVENT RELAY ---
    socket.on("join-session", (data) => {
      if (data.role === "bot" && data.sessionId) {
        socket.join(data.sessionId);
        console.log(
          `[Socket] Bot process ${socket.id} successfully joined its session room: ${data.sessionId}`
        );
        const tenantId = data.sessionId.replace("whatsapp_bot_room_", "");
        socket.tenantId = tenantId;
      }
    });

    // Listens for the QR code from the bot process.
    socket.on("qr_code", (data) => {
      const tenantId = socket.tenantId;
      if (tenantId && data.qr) {
        const userRoom = `tenant-room-${tenantId}`;
        io.to(userRoom).emit("qr_code", { qr: data.qr });
        console.log(
          `[Socket] ✅ Relayed QR code from bot to user room: ${userRoom}`
        );
      } else {
        console.log(
          `[Socket] ⚠️ Received QR code but could not relay (missing tenantId or QR data).`
        );
      }
    });

    // Listens for the 'ready' signal from the bot process.
    socket.on("whatsapp_ready", () => {
      const tenantId = socket.tenantId;
      if (tenantId) {
        const userRoom = `tenant-room-${tenantId}`;
        io.to(userRoom).emit("whatsapp_ready");
        io.to(userRoom).emit("whatsapp-status", {
          status: "connected",
          message: "WhatsApp Client is ready and connected.",
        });
        console.log(
          `[Socket] ✅ Relayed 'ready' signal from bot to user room: ${userRoom}`
        );
      }
    });

    // --- DISCONNECT HANDLING ---
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}. Reason: ${reason}`);
      if (socket.agentId && socket.tenantId) {
        db.query(
          "UPDATE users SET is_online = 0 WHERE id = ? AND tenant_id = ?",
          [socket.agentId, socket.tenantId]
        )
          .then(() =>
            console.log(`🔴 Agent ${socket.agentId} has gone offline.`)
          )
          .catch((err) =>
            console.error("❌ DB Error marking agent offline:", err)
          );
      }
    });
  });

  // Add agent connection logic
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Agent comes online
    socket.on("agent-online", async ({ agentId, tenantId }) => {
      if (!agentId || !tenantId) return;

      try {
        await db.query(
          "UPDATE users SET is_online = 1 WHERE id = ? AND tenant_id = ?",
          [agentId, tenantId]
        );

        socket.agentId = agentId;
        socket.tenantId = tenantId;
        socket.join(tenantId);

        console.log(`🟢 Agent ${agentId} online for tenant ${tenantId}`);
      } catch (err) {
        console.error("❌ Failed to mark agent online:", err);
      }
    });

    // Agent disconnects
    socket.on("disconnect", async () => {
      if (socket.agentId && socket.tenantId) {
        try {
          await db.query(
            "UPDATE users SET is_online = 0 WHERE id = ? AND tenant_id = ?",
            [socket.agentId, socket.tenantId]
          );
          console.log(`🔴 Agent ${socket.agentId} disconnected`);
        } catch (err) {
          console.error("❌ Failed to mark agent offline:", err);
        }
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO };
