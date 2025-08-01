// routes/whatsapp.js

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// --- State Management ---
let botProcess = null;
let whatsappStatus = {
    status: 'disconnected',
    message: 'Service is not running.',
};

// --- Configuration ---
// These are all the folders that whatsapp-web.js can create.
// We must delete all of them for a truly clean logout.
const WA_AUTH_DIR = path.join(process.cwd(), '.wwebjs_auth');
const WA_CACHE_DIR = path.join(process.cwd(), '.wwebjs_cached');
// THIS IS THE MOST IMPORTANT FOLDER FOR LOGGING OUT. It is created by new LocalAuth().
const WA_SESSION_DIR = path.join(process.cwd(), 'banka-ekonomike-bot-session'); 

// --- Helper function to update and broadcast status ---
function updateStatus(io, newStatus, newMessage) {
    whatsappStatus.status = newStatus;
    whatsappStatus.message = newMessage;
    io.emit('whatsapp-status', { status: newStatus, message: newMessage });
    console.log(`[WhatsApp Status] ${newStatus}: ${newMessage}`);
}

// --- NEW: A robust helper function to delete folders with retries ---
async function deleteWithRetry(folderPath, retries = 5, delay = 300) {
    for (let i = 0; i < retries; i++) {
        try {
            await fs.rm(folderPath, { recursive: true, force: true });
            console.log(`[Cleanup] Successfully deleted ${folderPath}`);
            return; // Success
        } catch (error) {
            if (error.code === 'EBUSY' && i < retries - 1) {
                console.warn(`[Cleanup] Folder ${folderPath} is busy. Retrying in ${delay}ms... (Attempt ${i + 1})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // If it's not EBUSY or we've run out of retries, throw the error
                throw error;
            }
        }
    }
}

// --- Internal Bot Management Functions ---

function startBot(io) {
    if (botProcess) {
        return;
    }
    updateStatus(io, 'connecting', 'Initializing service...');
    // IMPORTANT: Make sure this path is correct for your project structure
    const botScriptPath = path.join(__dirname, '../void_bot/voidBot.js'); 

    botProcess = spawn('node', [botScriptPath]);

    botProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        const [type, ...messageParts] = output.split('::');
        const message = messageParts.join('::');

        if (type === 'QR_CODE') {
            io.emit('whatsapp-qr', { qr: message });
            updateStatus(io, 'connecting', 'Please scan the QR code with WhatsApp.');
        } else if (type === 'STATUS' && message.includes('ready')) {
            updateStatus(io, 'connected', 'Service is connected and running.');
        } else {
            io.emit('whatsapp-log', { message: output });
        }
    });

    botProcess.stderr.on('data', (data) => {
        console.error(`[WhatsApp Bot Error] ${data}`);
        io.emit('whatsapp-log', { message: `ERROR: ${data}` });
    });

    botProcess.on('close', (code) => {
        console.log(`[WhatsApp Bot] Process exited with code ${code}`);
        botProcess = null;
        if (whatsappStatus.status !== 'disconnected') {
           updateStatus(io, 'disconnected', 'Service stopped unexpectedly.');
        }
    });
}

// --- Final, Robust Stop/Logout Function ---
async function stopAndLogoutBot(io) {
    if (botProcess) {
        // Listen for the process to fully close BEFORE trying to delete anything.
        botProcess.once('close', async () => {
            console.log('[WhatsApp Control] Process has closed. Beginning cleanup...');
            try {
                // Use the retry helper for each folder
                await deleteWithRetry(WA_AUTH_DIR);
                await deleteWithRetry(WA_CACHE_DIR);
                await deleteWithRetry(WA_SESSION_DIR); // This one is critical
                updateStatus(io, 'disconnected', 'Service stopped and session cleared successfully.');
            } catch (error) {
                console.error('[WhatsApp Control] FINAL CLEANUP ERROR:', error);
                updateStatus(io, 'disconnected', 'Service stopped, but failed to clear session folders.');
            }
        });

        // Now, trigger the shutdown. The 'close' event above will handle the cleanup.
        console.log('[WhatsApp Control] Sending stop signal to bot process...');
        botProcess.kill('SIGINT');
        botProcess = null;
    } else {
        // If there was no process, just clean up any leftover folders from a previous crash.
        console.log('[WhatsApp Control] No process running. Performing cleanup of leftover folders...');
        try {
            await deleteWithRetry(WA_AUTH_DIR);
            await deleteWithRetry(WA_CACHE_DIR);
            await deleteWithRetry(WA_SESSION_DIR);
            updateStatus(io, 'disconnected', 'Service is already stopped. Cleanup complete.');
        } catch(e) {
             updateStatus(io, 'disconnected', 'Service is stopped. Cleanup failed.');
        }
    }
}

// --- THE SINGLE API ENDPOINT ---
router.post('/', async (req, res) => {
    const { action } = req.body;
    const io = req.app.get('socketio');

    switch (action) {
        case 'start':
            startBot(io);
            res.status(200).json({ message: 'Start command received.' });
            break;

        case 'stop':
            updateStatus(io, 'disconnected', 'Stopping service...'); // Give immediate feedback
            await stopAndLogoutBot(io);
            res.status(200).json({ message: 'Stop and logout process initiated.' });
            break;

        case 'status':
            res.status(200).json(whatsappStatus);
            break;

        default:
            res.status(400).json({ message: 'Invalid action specified.' });
            break;
    }
});

module.exports = router;