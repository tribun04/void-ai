const db = require("../db/mysql"); // Make sure this path is correct

const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-tenant-api-key"];

  if (!apiKey) {
    return res
      .status(401)
      .json({ message: "API key is missing from x-tenant-api-key header." });
  }

  try {
    // ✅✅ THIS IS THE FIX ✅✅
    // The query now looks in the correct 'integrations' table for the 'api_key'.
    // It also joins with the 'tenants' table to get the tenant's main info.
    const sql = `
            SELECT t.id, t.companyName, t.status, t.planId
            FROM tenants t
            JOIN integrations i ON t.id = i.tenant_id
            WHERE i.api_key = ?
        `;

    const [rows] = await db.execute(sql, [apiKey]);
    const tenant = rows[0];

    if (!tenant) {
      return res.status(403).json({ message: "Forbidden: Invalid API key." });
    }

    if (tenant.status !== "active" && tenant.status !== "pending") {
      // Allow pending status
      return res.status(403).json({
        message: `Forbidden: Tenant account is not active. Current status: ${tenant.status}`,
      });
    }

    // Attach the tenant's info to the request for use in other routes
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error("API Key validation error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
module.exports = { validateApiKey };
