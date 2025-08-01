// backend/controllers/whatsappController.js

const { spawn } = require('child_process');
const path = require('path');

// This variable will hold our running bot process. It's null when the bot is stopped.
let whatsappBotProcess = null;

// This variable will hold the main Socket.IO instance from server.js.
// We need this to send real-time updates (like the QR code) to the frontend.
let io = null;

/**
 * Initializes the controller.
 * This function is called once from server.js to give this controller
 * access to the main Socket.IO server instance.
 * @param {object} socketIo - The main Socket.IO server instance.
 */
exports.init = (socketIo) => {
    io = socketIo;
};

/**
 * A helper function to broadcast messages specifically to connected Superadmins.
 * @param {string} event - The name of the socket event (e.g., 'whatsapp-qr').
 * @param {object} data - The payload to send with the event.
 */
const broadcastToSuperadmins = (event, data) => {
    if (io) {
        // We emit to a special 'superadmin_room' that only superadmins will join.
        io.to('superadmin_room').emit(event, data);
    }
};

/**
 * @desc    Start the WhatsApp bot process
 * @route   POST /api/superadmin/whatsapp/start
 */
exports.startBot = (req, res) => {
    if (whatsappBotProcess) {
        return res.status(400).json({ message: 'WhatsApp bot is already running.' });
    }

    // Define the full path to our voidBot.js script
    const botScriptPath = path.join(__dirname, '..', 'void_bot', 'voidBot.js');
    
    // Use 'spawn' to run the script in a new Node.js process.
    // This is better than 'exec' for long-running scripts.
    whatsappBotProcess = spawn('node', [botScriptPath]);

    console.log(`[Whatsapp Controller] Starting bot process with PID: ${whatsappBotProcess.pid}`);
    broadcastToSuperadmins('whatsapp-status', { status: 'connecting', message: 'Starting WhatsApp bot service...' });

    // --- This is where we listen to the bot's output ---
    whatsappBotProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        const [type, ...messageParts] = output.split('::');
        const message = messageParts.join('::');

        // We check the prefix (TYPE::) we defined in voidBot.js
        if (type === 'QR_CODE') {
            broadcastToSuperadmins('whatsapp-qr', { qr: message });
            broadcastToSuperadmins('whatsapp-log', { message: 'QR Code received. Please scan with WhatsApp.' });
        } else if (type === 'STATUS') {
            if (message.includes('ready')) {
                broadcastToSuperadmins('whatsapp-status', { status: 'connected', message: 'Service Connected!' });
                broadcastToSuperadmins('whatsapp-log', { message });
            } else {
                broadcastToSuperadmins('whatsapp-log', { message });
            }
        } else if (type === 'ERROR') {
             broadcastToSuperadmins('whatsapp-log', { message: `ERROR: ${message}` });
        }
    });

    // Listen for any errors from the child process itself
    whatsappBotProcess.stderr.on('data', (data) => {
        const errorMessage = data.toString().trim();
        console.error(`[Whatsapp Bot Error]: ${errorMessage}`);
        broadcastToSuperadmins('whatsapp-log', { message: `PROCESS ERROR: ${errorMessage}` });
    });

    // Listen for when the process stops for any reason
    whatsappBotProcess.on('close', (code) => {
        console.log(`[Whatsapp Controller] Bot process stopped with code ${code}.`);
        broadcastToSuperadmins('whatsapp-status', { status: 'disconnected', message: `Bot process stopped.` });
        whatsappBotProcess = null; // Reset the process variable
    });

    res.status(200).json({ message: 'WhatsApp bot service initiated.' });
};

/**
 * @desc    Stop the WhatsApp bot process
 * @route   POST /api/superadmin/whatsapp/stop
 */
exports.stopBot = (req, res) => {
    if (!whatsappBotProcess) {
        return res.status(400).json({ message: 'WhatsApp bot is not running.' });
    }
    whatsappBotProcess.kill('SIGINT'); // Send a 'soft' kill signal to the process
    res.status(200).json({ message: 'WhatsApp bot service stopping...' });
};

/**
 * @desc    Get the current status of the bot
 * @route   GET /api/superadmin/whatsapp/status
 */
exports.getBotStatus = (req, res) => {
    if (whatsappBotProcess) {
        // If the process object exists, we assume it's running or connecting
        res.status(200).json({ status: 'connected', message: 'Bot service is active.' });
    } else {
        res.status(200).json({ status: 'disconnected', message: 'Bot service is stopped.' });
    }
};