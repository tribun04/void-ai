// Void-Backend/middleware/setTenant.js

const db = require("../db/mysql"); // Ensure this path is correct

const setTenantFromUser = async (req, res, next) => {
  // This middleware must run AFTER your user authentication middleware (e.g., JWT or session check).
  // It assumes `req.user.id` is available for a logged-in user.
  if (!req.user || !req.user.id) {
    // If it's a route that doesn't require a logged-in user, we can just skip.
    return next();
  }

  try {
    // Find the user's tenant information from the database
    const sql = `
            SELECT t.id, t.companyName, t.status, t.planId 
            FROM tenants t
            JOIN users u ON u.tenant_id = t.id
            WHERE u.id = ?
        `;
    const [rows] = await db.execute(sql, [req.user.id]);
    const tenant = rows[0];

    if (!tenant) {
      return res.status(403).json({
        message: "Forbidden: User is not associated with a valid tenant.",
      });
    }

    // Attach the tenant's info to the request object.
    // This is the SAME format as your apiKey middleware.
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error("Error setting tenant from user session:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { setTenantFromUser };
