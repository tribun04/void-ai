// File: routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const db = require('../db/mysql');
const jwt = require('jsonwebtoken'); // ✅ Import the jsonwebtoken library

// ✅ REPLACED: New middleware that decodes the token directly
const authenticateTenant = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token required.' });
    }
    const token = authHeader.split(' ')[1];

    // Decode the token using your secret key
    // You must use the SAME secret key here that you use to CREATE the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the decoded token has the tenantId
    if (!decoded.tenantId) {
      return res.status(403).json({ message: 'Invalid token: tenantId is missing.' });
    }

    // Attach the tenant ID from the token to the request object
    req.tenant = { id: decoded.tenantId };
    
    next(); // All good, proceed to the controller

  } catch (err) {
    // This will catch errors like an expired token or invalid signature
    console.error('❌ Authentication middleware error:', err);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// ... the rest of your router file remains the same ...
router.use(authenticateTenant);

router.post('/train', aiController.trainTenantAIEntry);
router.get('/', aiController.getTenantAIEntries);
router.delete('/:intent', aiController.deleteTenantAIEntry);

module.exports = router;