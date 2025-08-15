// In Void-Backend/controllers/integrationsController.js

const pool = require("../db/mysql");
const crypto = require("crypto");

/**
 * --- GET INTEGRATION SETTINGS ---
 */
exports.getSettings = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { channel } = req.query;

  if (!channel) {
    return res
      .status(400)
      .json({ message: "Channel query parameter is required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM integrations WHERE tenant_id = ? AND channel = ?",
      [tenantId, channel]
    );
    res.status(200).json(rows[0] || {});
  } catch (error) {
    console.error("GET SETTINGS DATABASE ERROR:", error);
    res.status(500).json({ message: "Server error." });
  }
};

/**
 * --- UPDATE/CREATE INTEGRATION SETTINGS ---
 */
exports.updateSettings = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { channel, isActive, widgetColor, welcomeMessage } = req.body;

  if (!channel) {
    return res
      .status(400)
      .json({ message: "Channel is required in the body." });
  }

  try {
    const sql = `
      INSERT INTO integrations (tenant_id, channel, is_active, widget_color, welcome_message) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), widget_color = VALUES(widget_color), welcome_message = VALUES(welcome_message)`;

    await pool.execute(sql, [
      tenantId,
      channel,
      isActive,
      widgetColor,
      welcomeMessage,
    ]);
    res.status(200).json({ message: "Settings updated successfully." });
  } catch (error) {
    console.error("UPDATE SETTINGS DATABASE ERROR:", error);
    res.status(500).json({ message: "Server error." });
  }
};

/**
 * --- GENERATE A NEW API KEY ---
 */
exports.generateApiKey = async (req, res) => {
  // ✅✅ THIS IS THE FIX ✅✅
  // First, we check if req.body itself exists before trying to get 'channel' from it.
  // This prevents the "Cannot destructure property 'channel' of 'req.body' as it is undefined" crash.
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }

  const tenantId = req.user.tenantId;
  const { channel } = req.body;

  if (!channel) {
    return res.status(400).json({
      message: "The 'channel' field is required in the request body.",
    });
  }

  try {
    const newApiKey = crypto.randomBytes(24).toString("hex");

    // We use a more robust UPDATE ... ON DUPLICATE KEY INSERT logic here as well.
    // This handles the case where a setting for the channel doesn't exist yet.
    const sql = `
      INSERT INTO integrations (tenant_id, channel, api_key, is_active) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE api_key = VALUES(api_key)`;

    await pool.execute(sql, [tenantId, channel, newApiKey, true]);

    res.status(200).json({
      message: `New API key generated for channel: ${channel}`,
      apiKey: newApiKey,
    });
  } catch (error) {
    console.error("GENERATE API KEY DATABASE ERROR:", error);
    res.status(500).json({ message: "Server error while generating API key." });
  }
};
