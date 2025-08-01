// config/database.js


const { Sequelize } = require('sequelize');

// We no longer need to call require('dotenv').config() here,
// because the main server file (void_ai.js) now handles it.

const sequelize = new Sequelize(
    process.env.DB_NAME,    // e.g., 'void_ai_db'
    process.env.DB_USER,    // e.g., 'root'
    process.env.DB_PASS,    // e.g., 'your_password'
    {
        host: process.env.DB_HOST, // e.g., 'localhost'
        dialect: 'mysql'
    }
);

module.exports = sequelize;