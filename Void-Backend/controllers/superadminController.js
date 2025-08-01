const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const OpenAI = require("openai");
const db = require('../db/mysql');

// Initialize OpenAI with your API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- USER MANAGEMENT ---

/**
 * @description Get all non-superadmin users
 */
exports.getAllUsers = async (req, res) => {
    const { status } = req.query;
    try {
        // ✅ THE FIX: We have added 'tenantId' to the SELECT statement.
        let sqlQuery = "SELECT id, tenantId, fullName, email, companyName, role, paymentStatus, createdAt FROM users WHERE role != 'superadmin'";
        const queryParams = [];

        if (status && status !== 'all') {
            sqlQuery += " AND paymentStatus = ?";
            queryParams.push(status);
        }
        sqlQuery += " ORDER BY createdAt DESC";

        const [users] = await db.query(sqlQuery, queryParams);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to retrieve users." });
    }
};
exports.createUser = async (req, res) => {
    const { email, password, fullName, role, companyName } = req.body;
    if (!email || !password || !fullName || !role || !companyName) return res.status(400).json({ message: 'All fields are required.' });
    try {
        const [[existingUser]] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existingUser) return res.status(400).json({ message: 'User with this email already exists.' });
        const passwordHash = await bcrypt.hash(password, 10);
        const tenantId = uuidv4();
        const userId = uuidv4();
        await db.query('INSERT INTO users (id, tenantId, fullName, companyName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, tenantId, fullName, companyName, email.toLowerCase(), passwordHash, role]);
        res.status(201).json({ id: userId, email, fullName, role, tenantId });
    } catch (error) {
        res.status(500).json({ message: "Failed to create user." });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user." });
    }
};

exports.activateUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(`UPDATE users SET paymentStatus = 'completed' WHERE id = ?`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
        res.status(200).json({ message: 'User activated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to activate user.' });
    }
};

exports.activateTenant = async (req, res) => {
    const { tenantId } = req.params;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Get the primary admin user for this tenant to find their plan and company name
        const [[adminUser]] = await connection.query(
            `SELECT email, planName, companyName FROM users WHERE tenantId = ? AND role = 'admin' LIMIT 1`,
            [tenantId]
        );
        if (!adminUser) {
            await connection.rollback();
            return res.status(404).json({ message: 'Admin user for this tenant not found.' });
        }

        // 2. Determine the token limit based on the user's purchased plan
        let tokenLimit = 0;
        if (adminUser.planName && adminUser.planName.includes('10M Tokens')) {
            tokenLimit = 10000000;
        } else {
            tokenLimit = 1000000; // Default to 1M if plan is unknown
        }

        // 3. Generate a secure, unique API Key
        const apiKey = `void_sk_${crypto.randomBytes(24).toString('hex')}`;

        // 4. CREATE or UPDATE the record in the `tenants` table
        // This is the most critical step. It creates the tenant record that holds the API key.
        await connection.query(
            `INSERT INTO tenants (id, name, status, apiKey, token_limit) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = 'active', apiKey = VALUES(apiKey), token_limit = VALUES(token_limit)`,
            [tenantId, adminUser.companyName, 'active', apiKey, tokenLimit]
        );

        // 5. Update the payment status for ALL users associated with this tenant
        await connection.query(
            `UPDATE users SET paymentStatus = 'completed' WHERE tenantId = ?`,
            [tenantId]
        );

        // 6. Create or UPDATE their token allowance record
        await connection.query(
            `INSERT INTO tenant_tokens (id, tenantId, tokenLimit, tokensUsed) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE tokenLimit = VALUES(tokenLimit)`,
            [uuidv4(), tenantId, tokenLimit, 0]
        );
        
        // 7. (Optional but recommended) Send a Welcome Email
        // await sendWelcomeEmail(adminUser.email, apiKey);

        // If all steps succeed, commit the changes
        await connection.commit();

        console.log(`✅ Tenant ${tenantId} activated with a limit of ${tokenLimit} tokens.`);
        res.status(200).json({ message: 'Tenant activated successfully!', apiKey: apiKey });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error activating tenant ${tenantId}:`, error);
        res.status(500).json({ message: 'Server error during activation.' });
    } finally {
        if (connection) connection.release();
    }
};
exports.getTenantById = async (req, res) => {
    const { tenantId } = req.params;
    if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID is required.' });
    }
    
    try {
        // 1. Get the primary admin user for this tenant to find company details
        // We query the USERS table because that's where the company info is.
        const [[companyAdmin]] = await db.query(
            'SELECT companyName, planName FROM users WHERE tenantId = ? AND role = "admin" LIMIT 1', 
            [tenantId]
        );

        // If no admin user is found, we can't get company details
        if (!companyAdmin) {
            return res.status(404).json({ message: 'No admin user found for this tenant.' });
        }

        // 2. Get ALL users associated with this tenant
        const [users] = await db.query(
            'SELECT id, fullName, email, role FROM users WHERE tenantId = ?', 
            [tenantId]
        );
        
        // 3. Get the token usage details for this tenant (this table name is correct)
        const [[tokenDetails]] = await db.query(
            'SELECT * FROM tenant_tokens WHERE tenantId = ?', 
            [tenantId]
        );

        // 4. Combine all the information into a single response object
        const responseData = {
            id: tenantId, // The ID of the tenant is the tenantId
            companyName: companyAdmin.companyName,
            planName: companyAdmin.planName,
            users: users,
            tokenDetails: tokenDetails || null // Send null if no token record exists yet
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error(`Error fetching details for tenant ${tenantId}:`, error);
        res.status(500).json({ message: 'Server error while fetching tenant details.' });
    }
};
// --- AI TRAINING MANAGEMENT ---

exports.trainAIEntry = async (req, res) => {
    // Assumes the superadmin selects which tenant they are training for
    const { tenantId, intent, baseResponse } = req.body;
    if (!tenantId || !intent || !baseResponse) {
        return res.status(400).json({ message: 'tenantId, intent, and baseResponse are required.' });
    }
    try {
        // You can add your OpenAI translation/expansion logic here if needed
        const formattedIntent = intent.toLowerCase().replace(/\s+/g, '_');
        const entryId = uuidv4();

        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both new and existing intents
        await db.query(`
            INSERT INTO ai_entries (id, tenantId, intent, response_en)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE response_en = VALUES(response_en)
        `, [entryId, tenantId, formattedIntent, baseResponse]);

        res.status(201).json({ message: `Successfully trained intent '${formattedIntent}'.` });
    } catch (error) {
        console.error("Error training AI entry:", error);
        res.status(500).json({ message: "Failed to train AI entry." });
    }
};

/**
 * @desc    Get all AI entries for a specific tenant.
 * @route   GET /api/superadmin/ai-entries
 */
exports.getAIEntries = async (req, res) => {
    // The tenant ID is passed as a query parameter, e.g., /ai-entries?tenantId=some-id
    const { tenantId } = req.query;
    if (!tenantId) {
        return res.status(400).json({ message: 'A tenantId query parameter is required.' });
    }
    try {
        const [entries] = await db.query('SELECT id, intent, response_en FROM ai_entries WHERE tenantId = ?', [tenantId]);
        res.status(200).json(entries);
    } catch (error) {
        console.error("Error fetching AI entries:", error);
        res.status(500).json({ message: 'Failed to load AI entries.' });
    }
};

/**
 * @desc    Delete an AI knowledge base entry.
 * @route   DELETE /api/superadmin/ai-entries/:intent
 */
exports.deleteAIEntry = async (req, res) => {
    // In your router, the ID is the intent. We'll assume a tenantId is also sent.
    const { intent } = req.params;
    const { tenantId } = req.body; // Or req.query, depending on your frontend
    if (!intent || !tenantId) {
        return res.status(400).json({ message: 'Intent and tenantId are required to delete an entry.' });
    }
    try {
        await db.query('DELETE FROM ai_entries WHERE intent = ? AND tenantId = ?', [intent, tenantId]);
        res.status(200).json({ message: 'AI entry deleted successfully.' });
    } catch (error){
        console.error("Error deleting AI entry:", error);
        res.status(500).json({ message: 'Failed to delete AI entry.' });
    }
};



// --- ANALYTICS ---

/**
 * @description Get chat volume over time for a tenant
 */
exports.getChatVolume = async (req, res) => {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID is required.' });
    try {
        const [rows] = await db.query(
            `SELECT DATE(createdAt) as date, COUNT(*) as count
             FROM chat_logs
             WHERE tenantId = ? AND createdAt >= CURDATE() - INTERVAL 30 DAY
             GROUP BY DATE(createdAt)
             ORDER BY date ASC`,
            [tenantId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching chat volume:", error);
        res.status(500).json({ message: 'Failed to fetch chat volume.' });
    }
};

/**
 * @desc    Get the total number of conversations started today for a tenant.
 * @route   GET /api/superadmin/conversations/count-today
 */
exports.getTodaysConversationsCount = async (req, res) => {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID is required.' });
    try {
        const [[result]] = await db.query(
            'SELECT COUNT(DISTINCT sessionId) as count FROM chat_messages WHERE tenantId = ? AND DATE(createdAt) = CURDATE()',
            [tenantId]
        );
        res.status(200).json({ count: result.count || 0 });
    } catch (error) {
        console.error("Error fetching today's conversation count:", error);
        res.status(500).json({ message: "Failed to get today's conversation count." });
    }
};

/**
 * @desc    Get the 5 most recent activities (new chats, new users) for a tenant.
 * @route   GET /api/superadmin/recent-activity
 */
exports.getRecentActivity = async (req, res) => {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID is required.' });
    try {
        const [activities] = await db.query(`
            (SELECT id, 'New User' as type, fullName as detail, createdAt FROM users WHERE tenantId = ? ORDER BY createdAt DESC LIMIT 5)
            UNION
            (SELECT id, 'Chat Started' as type, sessionId as detail, createdAt FROM chat_sessions WHERE tenantId = ? ORDER BY createdAt DESC LIMIT 5)
            ORDER BY createdAt DESC LIMIT 5
        `, [tenantId, tenantId]);

        res.status(200).json(activities);
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        res.status(500).json({ message: 'Failed to fetch recent activity.' });
    }
};

/**
 * @desc    Get the top 5 most frequently matched intents for a tenant.
 * @route   GET /api/superadmin/top-intents
 */
exports.getTopIntents = async (req, res) => {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID is required.' });
    try {
        // This query assumes you have an 'intent' column in your chat_messages or chat_logs table
        const [intents] = await db.query(
            `SELECT intent, COUNT(intent) as count 
             FROM chat_messages
             WHERE tenantId = ? AND intent IS NOT NULL AND intent != 'unrecognized'
             GROUP BY intent 
             ORDER BY count DESC 
             LIMIT 5`,
            [tenantId]
        );
        res.status(200).json(intents);
    } catch (error) {
        console.error("Error fetching top intents:", error);
        res.status(500).json({ message: 'Failed to fetch top intents.' });
    }
};