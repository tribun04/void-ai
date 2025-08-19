const jwt = require("jsonwebtoken");
const db = require("../db/mysql"); // keep if validateApiKey uses it

// Auth: require a valid Bearer JWT, attach to req.user
const protect = (req, res, next) => {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    console.log("authMiddleware.protect - No authorization header / not Bearer");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = auth.split(" ")[1];
  if (!token) {
    console.log("authMiddleware.protect - No token after Bearer");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded should contain { userId, email, role, tenantId, ... }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Role gate: only superadmin
const isSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") return next();
  return res
    .status(403)
    .json({ message: "Forbidden: Access is restricted to Superadmins." });
};

// Ensure route/body/query tenant matches the authenticated user's tenant
const requireTenantMatch = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

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
 * Validates a tenant-specific API key from header x-tenant-api-key.
 * For machine-to-machine or external services.
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
    if (!tenants || tenants.length === 0) {
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

module.exports = { protect, isSuperadmin, requireTenantMatch, validateApiKey };
