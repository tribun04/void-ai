const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../utils/db"); // <-- IMPORT OUR DATABASE CONNECTION

// --- REGISTER A NEW USER ---
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user already exists in the database
    const [existingUsers] = await pool.execute(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "Conflict: User with this email already exists." });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Insert the new user into the database
    await pool.execute("INSERT INTO users (email, password) VALUES (?, ?)", [
      email,
      hashedPassword,
    ]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// --- LOGIN A USER ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email in the database
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    const user = rows[0];
    if (!user) {
      return res
        .status(401)
        .json({ message: "Authentication failed. Invalid credentials." });
    }

    // 2. Compare the provided password with the hashed password from the DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Authentication failed. Invalid credentials." });
    }

    // 3. If password is correct, create the Authentication Token (JWT)
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // Payload
      process.env.JWT_SECRET, // Secret
      { expiresIn: "1h" } // Options
    );

    // 4. Send the token back to the client
    res.status(200).json({
      message: "Logged in successfully!",
      token: token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};
