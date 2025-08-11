const express = require('express');
const router = express.Router();

// --- Controller Imports ---
// This list imports EVERY function we need for this router to work.
const {
    // User/Tenant Management
    createUser,
    getAllUsers,
    getUserById,
    deleteUser,
    activateUser, // This activates a single user account
    activateTenant, // This activates the entire tenant account
    getTenantById,
    getAgentsByTenant, // This gets all agents under a specific tenant
    getTenants, // This gets all tenants for the superadmin dashboard   
    createChildAgent, // This is for an admin to create an agent under their tenant


    // AI Training & Management
    trainAIEntry,
    getAIEntries,
    deleteAIEntry,

    // Dashboard Analytics
    getChatVolume,
    getTodaysConversationsCount,
    getRecentActivity,
    getTopIntents
} = require('../controllers/superadminController');

// WhatsApp Bot Controller (if it's separate)
const { startBot, stopBot, getBotStatus } = require('../controllers/whatsappController');

// Middleware for authentication and authorization
const { protect, isSuperadmin } = require('../middleware/authMiddleware');

// Protect all routes below with superadmin access
router.use(protect, isSuperadmin);

// --- USER & TENANT MANAGEMENT ---



// --- AI TRAINING & MANAGEMENT ---
// These routes are correctly structured to manage AI entries on a per-tenant basis.
router.post('/tenants/:tenantId/ai/train', trainAIEntry);
router.get('/tenants/:tenantId/ai/entries', getAIEntries);
router.delete('/tenants/:tenantId/ai/entries/:intent', deleteAIEntry);

// --- WHATSAPP BOT CONTROL ---
// These routes seem intended for global bot control by a superadmin.
router.post('/whatsapp/start', startBot);
router.post('/whatsapp/stop', stopBot);
router.get('/whatsapp/status', getBotStatus);

// --- DASHBOARD ANALYTICS ---
// These routes require a `tenantId` as a query parameter to specify which tenant's data to fetch.
// Example: GET /api/superadmin/chat-volume?tenantId=some-tenant-id
router.get('/chat-volume', getChatVolume);
router.get('/conversations/count-today', getTodaysConversationsCount);
router.get('/recent-activity', getRecentActivity);
router.get('/top-intents', getTopIntents);

module.exports = router;