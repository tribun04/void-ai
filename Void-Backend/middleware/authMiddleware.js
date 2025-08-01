const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // includes userId, email, role, tenantId
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Checks if the user has superadmin privileges
const isSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Access is restricted to Superadmins.' });
};

// NEW: Ensures the tenant in route/body/query matches the user's tenant
const requireTenantMatch = (req, res, next) => {
  const tenantFromRequest =
    req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (!tenantFromRequest) {
    return res.status(400).json({ message: 'Tenant ID is required.' });
  }

  if (tenantFromRequest !== req.user.tenantId) {
    return res.status(403).json({ message: 'Forbidden: Tenant mismatch.' });
  }

  next();
};

module.exports = { protect, isSuperadmin, requireTenantMatch };
