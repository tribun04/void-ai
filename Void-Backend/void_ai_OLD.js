const http = require('http');
const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// --- ONLY IMPORT THE ROUTE WE ARE TESTING ---
const publicRoutes = require('./routes/publicRoutes.js');

// --- Express App Initialization ---
const app = express();

// --- CORE MIDDLEWARE - This is all we need ---
app.use(cors());
app.use(express.json()); // The JSON body parser

// --- API ROUTE DEFINITIONS ---
app.use('/api/public', publicRoutes); // The signup route

// --- HTTP Server Setup ---
const httpServer = http.createServer(app);

// --- Server Listening ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 MINIMAL TEST SERVER is live and running on http://localhost:${PORT}`);
  console.log('--- Now try the Postman test. ---');
});