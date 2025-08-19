const pool = require("../utils/db"); // Make sure this path to your db connection is correct

/**
 * --- GET WIDGET CONFIGURATION ---
 * This endpoint is called by any external service (like a chat widget, WhatsApp bot, etc.).
 * It uses the API key to securely identify the tenant and fetch THEIR specific settings
 * for the channel that the API key belongs to.
 */
exports.getConfiguration = async (req, res) => {
  // The `validateApiKey` middleware has already run and successfully found the
  // tenant that this API key belongs to. It has attached it as `req.tenant`.
  const tenantId = req.tenant.id;

  // We also need the API key from the header to find the specific integration record.
  const apiKey = req.headers["x-tenant-api-key"];

  try {
    // ✅✅ THIS IS THE FIX ✅✅
    // The query now finds the integration record using BOTH the tenantId AND the apiKey.
    // It is no longer hardcoded to only look for 'website'. It will find the
    // correct settings for whichever channel this specific API key belongs to.
    const [rows] = await pool.execute(
      "SELECT api_key, widget_color, welcome_message, channel FROM integrations WHERE tenant_id = ? AND api_key = ?",
      [tenantId, apiKey]
    );

    const config = rows[0];

    if (!config) {
      // This is a more generic and accurate error message.
      return res.status(404).json({
        message: "Integration settings not found for the provided API key.",
      });
    }

    // Send back the specific configuration for this tenant's integration (e.g., website, whatsapp, etc.).
    res.status(200).json(config);
  } catch (error) {
    console.error("Get Widget Configuration Error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching widget configuration." });
  }
};
