// In routes/superadminRoutes.js

const express = require('express');
const router = express.Router();

// --- Controller Imports ---
// This list imports EVERY function we need for this router to work.
const { 
    getAllUsers,
    createUser,
    deleteUser,
    activateUser,      // ✅ For the "Activate" button
    activateTenant,
    getTenantById,     // ✅ For the "Manage" button
    trainAIEntry,
    getAIEntries,
    deleteAIEntry,
    getChatVolume,
    getTodaysConversationsCount,
    getRecentActivity,
    getTopIntents
} = require('../controllers/superadminController');

const { startBot, stopBot, getBotStatus } = require('../controllers/whatsappController');
const { protect, isSuperadmin } = require('../middleware/authMiddleware');

// Apply protection to all routes in this file
router.use(protect, isSuperadmin);

// --- Route Definitions ---

// User Management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
// ✅ THIS IS THE FIX FOR THE "ACTIVATE" BUTTON
// The server will now correctly handle the PATCH request.
router.patch('/users/:id/activate', activateUser);

// Tenant Management
router.post('/tenants/:tenantId/activate', activateTenant);
// ✅ THIS IS THE FIX FOR THE "MANAGE" BUTTON
// The server will now correctly handle the GET request.
router.get('/tenants/:tenantId', getTenantById);

// AI Training
router.post('/train-ai', trainAIEntry);
router.get('/ai-entries', getAIEntries);
router.delete('/ai-entries/:intent', deleteAIEntry);

// WhatsApp Bot Control
router.post('/whatsapp/start', startBot);
router.post('/whatsapp/stop', stopBot);
router.get('/whatsapp/status', getBotStatus);

// Dashboard Analytics
router.get('/chat-volume', getChatVolume);
router.get('/conversations/count-today', getTodaysConversationsCount);
router.get('/recent-activity', getRecentActivity);
router.get('/top-intents', getTopIntents);

module.exports = router;