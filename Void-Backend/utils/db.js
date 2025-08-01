const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool. This is more efficient than creating single connections
// for every query, especially for a web server.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the promise-based version of the pool for modern async/await syntax
module.exports = pool.promise();