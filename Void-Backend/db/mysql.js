// In db/mysql.js

const mysql = require('mysql2/promise');
const path = require('path');

// Load .env variables from the root of the project to ensure they are available
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log(`[DB] Attempting to connect to database: '${process.env.DB_DATABASE}'`);

if (!process.env.DB_DATABASE) {
    throw new Error("FATAL ERROR: DB_DATABASE is not defined in your .env file.");
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('✅ MySQL Connection Pool Initialized.');

module.exports = pool;