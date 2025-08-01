// In controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/mysql');

const { generateInvoice } = require('../utils/invoiceGenerator');
const { sendInvoiceEmail } = require('../utils/emailSender');


// --- Helper function to generate a JWT token ---
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};


// --- Controller Functions ---

/**
 * @desc    Authenticate a user & get a token
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
    // ... (This function is complete and correct)
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        const payload = { id: user.id, fullName: user.fullName, role: user.role, tenantId: user.tenantId };
        res.status(200).json({ message: 'Login successful', token: generateToken(payload) });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/auth/me
 */
exports.getMe = (req, res) => {
    // ... (This function is complete and correct)
    res.status(200).json(req.user);
};

/**
 * @desc    Handles new Admin signup from the public page, creates user/invoice, and sends email.
 * @route   POST /api/auth/signup
 */
exports.signupAndInvoice = async (req, res) => {
    const { fullName, email, password, companyName, companySize, plan, addons, totalPrice, role } = req.body;
    if (!fullName || !email || !password || !companyName) return res.status(400).json({ message: 'Missing required fields' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const tenantId = uuidv4();
        const userId = uuidv4();

        // This query now perfectly matches the new database schema
        const userSql = `INSERT INTO users (id, tenantId, fullName, companyName, email, passwordHash, role, planName, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const userValues = [userId, tenantId, fullName, companyName, email, passwordHash, role || 'admin', plan.name, 'pending'];
        await connection.execute(userSql, userValues);

        if (companySize === 'small-business') {
            const invoiceId = uuidv4();
            const invoiceNumberForPDF = `INV-${new Date().getFullYear()}-${invoiceId.substring(0, 4).toUpperCase()}`;
            
            // This query also perfectly matches the new database schema
            const invoiceSql = `INSERT INTO invoices (id, tenantId, amount, status) VALUES (?, ?, ?, ?)`;
            await connection.execute(invoiceSql, [invoiceId, tenantId, totalPrice, 'pending']);

            const invoiceData = { fullName, companyName, email, plan, addons, totalPrice, invoiceNumber: invoiceNumberForPDF };
            const pdfBuffer = await generateInvoice(invoiceData);
            await sendInvoiceEmail(email, pdfBuffer, fullName);
        }

        await connection.commit();
        return res.status(201).json({ message: 'Account created! Please check your email for the invoice.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('!!! SIGNUP TRANSACTION FAILED !!!', error);
        return res.status(500).json({ message: 'Server error during signup.' });
    } finally {
        if (connection) connection.release();
    }
};

// --- We keep these placeholder functions so your other routes do not crash the server ---
