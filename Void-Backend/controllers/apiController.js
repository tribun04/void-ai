const db = require('../db/mysql');

/**
 * Allows a tenant to check their current token usage via the API.
 */
exports.getUsage = async (req, res) => {
    // ✅ --- THE FIX IS HERE --- ✅
    // We get the 'id' directly from the req.tenant object.
    const tenantId = req.tenant.id; 

    try {
        const sql = 'SELECT totalAllocated, used FROM tenant_tokens WHERE tenantId = ?';
        const [rows] = await db.execute(sql, [tenantId]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                message: 'Token usage not found for this tenant.',
                totalAllocated: "0", used: "0", remaining: "0" 
            });
        }

        const usage = rows[0];
        const remaining = BigInt(usage.totalAllocated) - BigInt(usage.used);

        res.status(200).json({
            totalAllocated: usage.totalAllocated.toString(),
            used: usage.used.toString(),
            remaining: remaining.toString()
        });

    } catch (error) {
        console.error("Get usage error:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

/**
 * An example service endpoint that consumes one token per call.
 */
exports.exampleService = async (req, res) => {
    // ✅ --- THE FIX IS HERE --- ✅
    const tenantId = req.tenant.id;

    try {
        // 1. Check if the tenant has enough tokens
        const checkTokensSql = 'SELECT (totalAllocated - used) as remaining FROM tenant_tokens WHERE tenantId = ?';
        const [rows] = await db.execute(checkTokensSql, [tenantId]);

        if (rows.length === 0 || rows[0].remaining <= 0) {
            return res.status(402).json({ message: 'Payment Required: Insufficient tokens.' }); // Use 402 for payment-related issues
        }

        // 2. Perform your core application logic here
        console.log(`Performing a token-consuming action for tenant: ${req.tenant.companyName}`);

        // 3. Increment the used token count in the database
        const consumeTokenSql = 'UPDATE tenant_tokens SET used = used + 1 WHERE tenantId = ?';
        await db.execute(consumeTokenSql, [tenantId]);

        res.status(200).json({ success: true, message: "Service executed successfully. 1 token has been consumed." });

    } catch (error)
 {
        console.error("Service execution error:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};