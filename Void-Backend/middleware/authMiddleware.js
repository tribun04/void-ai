const jwt = require("jsonwebtoken");
const db = require("../db/mysql"); // Make sure this path is correct

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // includes userId, email, role, tenantId
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Checks if the user has superadmin privileges
const isSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  res
    .status(403)
    .json({ message: "Forbidden: Access is restricted to Superadmins." });
};

// NEW: Ensures the tenant in route/body/query matches the user's tenant
const requireTenantMatch = (req, res, next) => {
  const tenantFromRequest =
    req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (!tenantFromRequest) {
    return res.status(400).json({ message: "Tenant ID is required." });
  }

  if (tenantFromRequest !== req.user.tenantId) {
    return res.status(403).json({ message: "Forbidden: Tenant mismatch." });
  }

  next();
};

/**
 * Validates a tenant-specific API key from the header.
 * Used for external services or scripts to authenticate as a tenant.
 */
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-tenant-api-key"];

  if (!apiKey) {
    return res
      .status(400)
      .json({ message: "API key is missing from x-tenant-api-key header." });
  }

  try {
    const [tenants] = await db.query(
      "SELECT * FROM tenants WHERE api_key = ?",
      [apiKey]
    );

    if (tenants.length === 0) {
      return res.status(401).json({ message: "Invalid API key." });
    }

    req.tenant = tenants[0];
    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    return res
      .status(500)
      .json({ message: "Server error during API key validation." });
  }
};

/**
 * Ensures the tenant in the route params/body matches the user's tenant.
 * Crucial for preventing one tenant from accessing another tenant's data.
 * MUST be used AFTER the `protect` middleware.
 */

module.exports = { protect, isSuperadmin, requireTenantMatch, validateApiKey };
