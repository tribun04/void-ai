const db = require('../db/mysql');

const validateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-tenant-api-key'];

    if (!apiKey) {
        return res.status(401).json({ message: 'API key is missing from x-tenant-api-key header.' });
    }

    try {
        const sql = 'SELECT id, companyName, status, planId FROM tenants WHERE apiKey = ?';
        const [rows] = await db.execute(sql, [apiKey]);
        const tenant = rows[0];

        if (!tenant) {
            return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({ message: `Forbidden: Tenant account is not active. Current status: ${tenant.status}` });
        }

        // Attach the tenant's info to the request for use in other routes
        req.tenant = tenant; 
        next();

    } catch (error) {
        console.error("API Key validation error:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = { validateApiKey };