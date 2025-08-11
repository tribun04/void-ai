const db = require('../db/mysql');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Gets a list of all tenants, with optional filtering by status.
 * Used for the main dashboard view.
 */
exports.createAgent = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        // This object now perfectly matches a database table without a 'lastName' column
        const newUser = {
            id,
            fullName,
            email,
            passwordHash: hashedPassword,
            role: 'agent',
            tenantId: req.user.tenantId // Links to the admin who created this agent
        };

        // This query will now succeed
        await db.query('INSERT INTO users SET ?', newUser);

        // SECURITY FIX: Never send the password hash back to the client
        delete newUser.password;

        res.status(201).json({ message: 'Agent created successfully', user: newUser });

    } catch (err) {
        // This will now log any other potential errors (like database connection issues)
        console.error(err);
        res.status(500).json({ message: 'Something went wrong', error: err.message });
    }
};
exports.getTenants = async (req, res) => {
    const { status } = req.query;
    let sql = `
        SELECT t.id, t.companyName, t.status, t.createdAt, p.name as planName
        FROM tenants as t
        LEFT JOIN plans as p ON t.planId = p.id
    `;
    const params = [];
    if (status) {
        sql += ' WHERE t.status = ?';
        params.push(status);
    }
    sql += ' ORDER BY t.createdAt DESC';

    try {
        const [tenants] = await db.query(sql, params);
        res.status(200).json(tenants);
    } catch (error) {
        console.error("Error fetching tenants:", error);
        res.status(500).json({ message: 'Failed to fetch tenants.' });
    }
};
exports.deleteUser = async (req, res) => {
    const agentId = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [agentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Delete Agent Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
/**
 * Gets the detailed information for a single tenant by their ID.
 * Used for the "View Details" / "Manage Tokens" modal.
 */
exports.getTenantById = async (req, res) => {
    const { tenantId } = req.params;
    try {
        const sql = `
            SELECT 
                t.id, t.companyName, t.status, t.apiKey,
                p.name as planName,
                tt.totalAllocated,
                tt.used
            FROM tenants as t
            LEFT JOIN plans as p ON t.planId = p.id
            LEFT JOIN tenant_tokens as tt ON t.id = tt.tenantId
            WHERE t.id = ?
        `;
        const [rows] = await db.execute(sql, [tenantId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tenant not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching single tenant:", error);
        res.status(500).json({ message: 'Failed to fetch tenant details.' });
    }
};

exports.getTenantApiDetails = async (req, res) => {
    // The 'protect' middleware gives us the logged-in user's details, including their tenantId
    const { tenantId } = req.user;

    try {
        // Fetch the API key and token limit from the `tenants` table
        const [[tenant]] = await db.query(
            'SELECT apiKey, token_limit FROM tenants WHERE id = ?',
            [tenantId]
        );

        // Fetch the current token usage from the `tenant_tokens` table
        const [[tokenUsage]] = await db.query(
            'SELECT tokens_used FROM tenant_tokens WHERE tenantId = ?',
            [tenantId]
        );

        if (!tenant) {
            return res.status(404).json({ message: 'API details not found. Your account may not be active yet.' });
        }

        // Combine the data into a single, clean response
        res.status(200).json({
            apiKey: tenant.apiKey,
            tokenLimit: tenant.token_limit,
            tokensUsed: tokenUsage ? tokenUsage.tokens_used : 0 // Handle case where token usage record might not exist yet
        });

    } catch (error) {
        console.error("Error fetching tenant API details:", error);
        res.status(500).json({ message: 'Server error while fetching your API details.' });
    }
};

/**
 * Activates a tenant, setting their status and initializing their tokens.
 * Used by the "Activate" button.
 */
exports.activateTenant = async (req, res) => {
    const { tenantId } = req.params;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // ✅ --- 1. THE FIX: Check the tenant's current status FIRST --- ✅
        // We only proceed if the tenant is 'inactive'.
        const [tenantRows] = await connection.execute('SELECT status, planId FROM tenants WHERE id = ?', [tenantId]);

        if (tenantRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Tenant not found.' });
        }

        // If the tenant is already active, we don't need to do anything.
        if (tenantRows[0].status === 'active') {
            await connection.rollback();
            return res.status(409).json({ message: 'Conflict: This tenant is already active.' });
        }

        const planId = tenantRows[0].planId;
        const [planRows] = await connection.execute('SELECT tokenLimit FROM plans WHERE id = ?', [planId]);
        const tokenLimit = planRows[0].tokenLimit;

        // 2. Update the tenant's status to 'active'
        await connection.execute("UPDATE tenants SET status = 'active' WHERE id = ?", [tenantId]);

        // ✅ --- 3. THE FIX: Use an "UPSERT" query for tokens --- ✅
        // This will INSERT a new row, or UPDATE the existing one if it's already there.
        // This prevents the "Duplicate entry" error completely.
        const initTokensSql = `
            INSERT INTO tenant_tokens (tenantId, totalAllocated, used) 
            VALUES (?, ?, 0)
            ON DUPLICATE KEY UPDATE totalAllocated = VALUES(totalAllocated)
        `;
        await connection.execute(initTokensSql, [tenantId, tokenLimit]);

        // 4. Update the corresponding invoice status to 'paid'
        await connection.execute("UPDATE invoices SET status = 'paid' WHERE tenantId = ? AND status = 'pending'", [tenantId]);

        await connection.commit();

        res.status(200).json({ message: `Tenant ${tenantId} has been successfully activated.` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error activating tenant:", error);
        res.status(500).json({ message: 'Failed to activate tenant.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Updates the token balance for a specific tenant.
 * Used by the "Save Changes" button in the modal.
 */
exports.updateTenantTokens = async (req, res) => {
    const { tenantId } = req.params;
    const { totalAllocated, used } = req.body;

    if (totalAllocated === undefined || used === undefined) {
        return res.status(400).json({ message: 'Both totalAllocated and used values are required.' });
    }
    try {
        const sql = `
            INSERT INTO tenant_tokens (tenantId, totalAllocated, used) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE totalAllocated = VALUES(totalAllocated), used = VALUES(used)
        `;
        await db.execute(sql, [tenantId, totalAllocated, used]);
        res.status(200).json({ message: `Tokens for tenant ${tenantId} updated successfully.` });
    } catch (error) {
        console.error("Error updating tokens:", error);
        res.status(500).json({ message: 'Failed to update tokens.' });
    }
};

/**
 * Generates a new, unique API key for a tenant.
 */
exports.regenerateApiKey = async (req, res) => {
    const { tenantId } = req.params;
    const newApiKey = uuidv4();
    try {
        const sql = "UPDATE tenants SET apiKey = ? WHERE id = ?";
        const [result] = await db.execute(sql, [newApiKey, tenantId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tenant not found.' });
        }
        res.status(200).json({ message: 'API Key regenerated successfully.', apiKey: newApiKey });
    } catch (error) {
        console.error("Error regenerating API key:", error);
        res.status(500).json({ message: 'Failed to regenerate API key.' });
    }
};

exports.getAgentsForMyTenant = async (req, res) => {
    // The 'protect' middleware gives us the logged-in user's tenantId.
    const { tenantId } = req.user;

    if (!tenantId) {
        return res.status(403).json({ message: 'Could not identify your organization from your login token.' });
    }

    try {
        // Find all users who have the role 'agent' AND share the same tenantId as the admin.
        const [agents] = await db.query(
            `SELECT id, fullName, email, role, isOnline, lastSeen FROM users WHERE tenantId = ? AND role = 'agent'`,
            [tenantId]
        );

        res.status(200).json(agents);

    } catch (error) {
        console.error("Error fetching agents for admin's tenant:", error);
        res.status(500).json({ message: "Failed to retrieve your agents." });
    }
};

exports.getAgents = async (req, res) => {
    const { tenantId } = req.user; // Get tenantId from the logged-in admin
    try {
        const [agents] = await db.query(
            `SELECT id, fullName, email, role FROM users WHERE tenantId = ? AND role = 'agent' ORDER BY createdAt DESC`,
            [tenantId]
        );
        res.status(200).json(agents);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch agents.' });
    }
};





/**
 * @desc    An admin deletes one of their own agents.
 * @route   DELETE /api/admin/agents/:agentId
 */
exports.deleteAgent = async (req, res) => {
    const { tenantId } = req.user; // Admin's tenantId
    const { agentId } = req.params; // ID of the agent to delete
    try {
        // This query ensures an admin can only delete agents from their own company
        const [result] = await db.query(
            `DELETE FROM users WHERE id = ? AND tenantId = ? AND role = 'agent'`,
            [agentId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agent not found or you do not have permission to delete them.' });
        }
        res.status(200).json({ message: 'Agent deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete agent.' });
    }
};