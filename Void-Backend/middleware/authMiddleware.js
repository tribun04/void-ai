const jwt = require('jsonwebtoken');
const db = require('../db/mysql');
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database to get all necessary details
            const [users] = await db.query(
                'SELECT id, tenantId FROM users WHERE id = ?', 
                [decoded.id]
            );

            if (!users || users.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user for this token not found' });
            }

            // This is the object that will be passed to your controllers
            req.user = users[0]; 

            // --- DEBUGGING STEP ---
            // Let's log the user object right before we proceed.
            // This should print an object like: { id: 'some-id', tenantId: 'some-tenant-id' }
            console.log('User attached by middleware:', req.user); 
            // --------------------

            next(); // Proceed to the controller

        } catch (error) {
            console.error('Error in protect middleware:', error);
            res.status(401).json({ message: 'Not authorized, token is invalid or expired' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token was provided' });
    }
};

// Checks if the user has superadmin privileges
const isSuperadmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Access is restricted to Superadmins.' });
};

const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-tenant-api-key'];

  if (!apiKey) {
    return res.status(400).json({ message: 'API key is missing from x-tenant-api-key header.' });
  }

  try {
    const [tenants] = await db.query('SELECT * FROM tenants WHERE api_key = ?', [apiKey]);

    if (tenants.length === 0) {
      return res.status(401).json({ message: 'Invalid API key.' });
    }

    const tenant = tenants[0];
    req.tenant = tenant; // Attach the tenant to the request object
    next(); // Call next() to proceed to the next middleware/route handler

  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
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

module.exports = { protect, isSuperadmin, requireTenantMatch, validateApiKey };