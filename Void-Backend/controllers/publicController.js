const db = require('../db/mysql');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendWelcomeEmail } = require('../utils/email'); // ✅ 1. IMPORT THE EMAIL FUNCTION

exports.handleSignup = async (req, res) => {
    const { fullName, email, password, companyName, planId } = req.body;
    
    if (!fullName || !email || !password || !companyName || !planId) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    let connection; 
    try {
        connection = await db.getConnection(); 

        const [userRows] = await connection.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (userRows.length > 0) {
            return res.status(409).json({ message: 'Email is already in use.' });
        }
        
        const [planRows] = await connection.execute('SELECT id, name, price FROM plans WHERE id = ?', [planId]);
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Selected plan not found.' });
        }
        const plan = planRows[0];
        
        const passwordHash = await bcrypt.hash(password, 12);
        const activationCode = randomBytes(4).toString('hex').toUpperCase();
        const tenantId = uuidv4();
        const userId = uuidv4();
        const invoiceId = uuidv4();
        const apiKey = uuidv4();
        
        await connection.beginTransaction();
        
        const tenantSql = 'INSERT INTO tenants (id, companyName, planId, apiKey) VALUES (?, ?, ?, ?)';
        await connection.execute(tenantSql, [tenantId, companyName, plan.id, apiKey]);
        
        const userSql = 'INSERT INTO users (id, tenantId, fullName, email, passwordHash, activationCode, role) VALUES (?, ?, ?, ?, ?, ?, "agent")';
        await connection.execute(userSql, [userId, tenantId, fullName, email, passwordHash, activationCode]);
        
        const invoiceSql = 'INSERT INTO invoices (id, tenantId, amount) VALUES (?, ?, ?)';
        await connection.execute(invoiceSql, [invoiceId, tenantId, plan.price]);
        
        await connection.commit(); // Save all changes to the database
        
        // ✅ --- 2. SEND THE WELCOME EMAIL --- ✅
        // This runs only AFTER the database commit is successful.
        await sendWelcomeEmail(email, { companyName, activationCode });

        // Notify the SuperAdmin dashboard in real-time
        const io = req.app.get('socketio');
        if (io) {
            io.to('superadmin_room').emit('new-signup', { companyName, planName: plan.name, email });
        }
        
        res.status(201).json({ 
            message: 'Account created successfully. Please check your email for activation instructions.',
            activationCode
        });

    } catch (error) {
        if (connection) await connection.rollback(); 
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Internal server error during signup.' });
    } finally {
        if (connection) connection.release(); 
    }
};