// Void-Backend/models/userModel.js

const db = require('../db/mysql'); // Make sure this path is correct

const User = {
    // This function finds a user by their ID. It's used by the controller.
    findById: async (id) => {
        // Select all fields EXCEPT the passwordHash for security
        const [rows] = await db.promise().query('SELECT id, fullName, companyName, email, role, profilePicture FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    // --- THIS IS THE CORRECTED UPDATE FUNCTION ---
    // It can handle any combination of fields safely.
    update: async (id, userData) => {
        // Get the field names and values from the object passed by the controller
        const fields = Object.keys(userData);
        const values = Object.values(userData);
        
        if (fields.length === 0) {
            return false; // Nothing to update
        }

        // Create the 'SET' part of the SQL query dynamically
        // e.g., "fullName = ?, companyName = ?"
        const setClause = fields.map(field => `${field} = ?`).join(', ');

        // Build the final, parameterized SQL query
        const sql = `UPDATE users SET ${setClause}, updatedAt = NOW() WHERE id = ?`;
        
        // Add the user ID to the end of the values array for the WHERE clause
        values.push(id);

        try {
            const [result] = await db.promise().query(sql, values);
            // Return true if one or more rows were changed
            return result.affectedRows > 0;
        } catch (error) {
            console.error("DATABASE UPDATE ERROR:", error);
            return false;
        }
    }
};

module.exports = User;