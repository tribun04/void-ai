// In controllers/whatsappController.js

const { spawn, exec } = require("child_process");
const path = require("path");
const { rimraf } = require("rimraf");

const tenantBotProcesses = new Map();
let io = null;

// =================================================================
// --- HELPER FUNCTIONS ---
// =================================================================
function updateTenantStatus(tenantId, newStatus, newMessage) {
  if (!tenantId || !io) return;
  const roomName = `tenant-room-${tenantId}`;
  io.to(roomName).emit("whatsapp-status", {
    status: newStatus,
    message: newMessage,
  });
  console.log(
    `[WhatsApp Status][Tenant: ${tenantId}] ${newStatus}: ${newMessage}`
  );
}

async function cleanupTenantSession(tenantId) {
  const WA_SESSION_DIR = path.join(
    process.cwd(),
    `.wwebjs_auth`,
    `session-whatsapp-session-${tenantId}`
  );
  console.log(
    `[Cleanup][Tenant: ${tenantId}] Attempting to clear session folder: ${WA_SESSION_DIR}`
  );
  try {
    await rimraf(WA_SESSION_DIR);
    console.log(
      `[Cleanup][Tenant: ${tenantId}] Session folder cleared successfully.`
    );
    return true;
  } catch (error) {
    console.error(`[Cleanup ERROR][Tenant: ${tenantId}] ${error.message}`);
    return false;
  }
}

// =================================================================
// --- INITIALIZATION ---
// =================================================================
exports.init = (socketIo) => {
  io = socketIo;
  console.log("✅ WhatsApp Controller Initialized.");
};

// =================================================================
// --- STANDARD USER CONTROLLER FUNCTIONS (/api/whatsapp) ---
// =================================================================
exports.startService = (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res
      .status(401)
      .json({ message: "Authentication error: Tenant ID not found." });
  }

  if (tenantBotProcesses.has(tenantId)) {
    return res
      .status(400)
      .json({ message: "A WhatsApp service is already running." });
  }

  updateTenantStatus(tenantId, "connecting", "Initializing service...");
  const botScriptPath = path.join(__dirname, "../void_bot/voidBot.js");
  const botProcess = spawn("node", [botScriptPath, tenantId]);
  tenantBotProcesses.set(tenantId, botProcess);

  botProcess.on("error", (spawnError) => {
    console.error(
      `[SPAWN ERROR][Tenant: ${tenantId}] Failed to start bot process: ${spawnError.message}`
    );
    updateTenantStatus(
      tenantId,
      "disconnected",
      `Failed to start service: ${spawnError.message}`
    );
    tenantBotProcesses.delete(tenantId);
  });

  botProcess.stderr.on("data", (data) => {
    console.error(
      `[WhatsApp Bot Stderr][Tenant: ${tenantId}] ${data.toString()}`
    );
  });

  botProcess.on("close", (code) => {
    console.log(
      `[WhatsApp Bot][Tenant: ${tenantId}] Process exited with code ${code}.`
    );
    if (tenantBotProcesses.has(tenantId)) {
      tenantBotProcesses.delete(tenantId);
      updateTenantStatus(
        tenantId,
        "disconnected",
        "Service stopped unexpectedly."
      );
    }
  });

  res.status(200).json({ message: "Start command received." });
};

exports.stopService = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res
      .status(401)
      .json({ message: "Authentication error: Tenant ID not found." });
  }

  const botProcess = tenantBotProcesses.get(tenantId);
  updateTenantStatus(tenantId, "disconnected", "Stopping service...");

  if (botProcess) {
    tenantBotProcesses.delete(tenantId);
    const pid = botProcess.pid;
    exec(`taskkill /PID ${pid} /F /T`, async (error) => {
      if (error)
        console.error(`[Taskkill Info][Tenant: ${tenantId}] ${error.message}`);
      else
        console.log(
          `[Whatsapp Controller] Process for tenant ${tenantId} killed.`
        );

      const success = await cleanupTenantSession(tenantId);
      updateTenantStatus(
        tenantId,
        "disconnected",
        success
          ? "Service stopped and session cleared."
          : "Service stopped, but cleanup failed."
      );
    });
  } else {
    await cleanupTenantSession(tenantId);
    updateTenantStatus(
      tenantId,
      "disconnected",
      "Service already stopped. Cleanup complete."
    );
  }

  res.status(200).json({ message: "Stop command received." });
};

exports.getStatus = (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res
      .status(401)
      .json({ message: "Authentication error: Tenant ID not found." });
  }
  const isRunning = tenantBotProcesses.has(tenantId);
  res.status(200).json({
    status: isRunning ? "connected" : "disconnected",
    message: isRunning ? "Service is running." : "Service is not running.",
  });
};

// =================================================================
// --- SUPERADMIN FUNCTIONS ---
// =================================================================
exports.getAllBotStatuses = (req, res) => {
  const statuses = Array.from(tenantBotProcesses.entries()).map(
    ([tenantId, process]) => ({
      tenantId,
      status: process.killed ? "stopped" : "connected",
      pid: process.pid,
    })
  );
  res.status(200).json(statuses);
};

exports.startBotForSpecificTenant = (req, res) => {
  const { tenantId } = req.params;
  const fakeReq = { user: { tenantId } };
  exports.startService(fakeReq, res);
};

exports.stopBotForSpecificTenant = (req, res) => {
  const { tenantId } = req.params;
  const fakeReq = { user: { tenantId } };
  exports.stopService(fakeReq, res);
};
