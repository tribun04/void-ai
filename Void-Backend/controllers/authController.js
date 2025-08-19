const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto"); // ✅✅ THIS IS THE FIX ✅✅ We must import the crypto module to use it.
const db = require("../db/mysql");

// --- Helper function to generate a JWT token ---
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// --- Controller Functions ---

/**
 * @desc    Authenticate a user & get a token
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // This is correct. It gets the VARCHAR tenant_id from the user record.
    const payload = {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenant_id,
    };

    const token = generateToken(payload);
    res.status(200).json({ message: "Login successful", token: token });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * @desc    Get current authenticated user's profile
 */

/**
 * @desc    Handles new Admin signup for the multi-tenant system.
 * @route   POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  const {
    fullName,
    email,
    password,
    companyName,
    plan,
    companySize,
    totalPrice,
    role,
  } = req.body;
  if (!fullName || !email || !password || !companyName || !plan || !plan.id) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "User already exists." });
    }

    const newTenantId = uuidv4();
    const newApiKey = crypto.randomBytes(24).toString("hex");

    const tenantSql = `INSERT INTO tenants (id, companyName, status, planId, planName, apiKey) VALUES (?, ?, ?, ?, ?, ?)`;
    await connection.execute(tenantSql, [
      newTenantId,
      companyName,
      "pending",
      plan.id,
      plan.name,
      newApiKey,
    ]);

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const userSql = `INSERT INTO users (id, tenant_id, fullName, companyName, email, passwordHash, role, planName, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await connection.execute(userSql, [
      userId,
      newTenantId,
      fullName,
      companyName,
      email,
      passwordHash,
      role || "admin",
      plan.name,
      "pending",
    ]);

    if (companySize === "small-business" && totalPrice > 0) {
      const invoiceId = uuidv4();
      const invoiceSql = `INSERT INTO invoices (id, tenant_id, amount, status) VALUES (?, ?, ?, ?)`;
      await connection.execute(invoiceSql, [
        invoiceId,
        newTenantId,
        totalPrice,
        "pending",
      ]);
    }

    await connection.commit();
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("!!! SIGNUP TRANSACTION FAILED !!!", error);
    res.status(500).json({ message: "Server error during signup." });
  } finally {
    if (connection) connection.release();
  }
};

exports.getMe = (req, res) => {
  res.status(200).json(req.user);
};
