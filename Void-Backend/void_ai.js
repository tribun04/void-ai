require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require("express");


const { Server } = require("socket.io");
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const url = require('url');
const { WebSocketServer } = require('ws');

dotenv.config();

// ROUTE IMPORTS (One import for each route file)
// =================================================================
const adminRoutes = require('./routes/adminRoutes.js');
const apiRoutes = require('./routes/apiRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');
const conversationRoutes = require('./routes/conversationRoutes.js');
const agentRoutes = require('./routes/agentRoutes.js');
const inboxRoutes = require('./routes/inboxRoutes.js');
const facebookRouter = require('./routes/facebook.js');
const superadminRoutes = require('./routes/superadminRoutes.js');
const chatHistoryRoutes = require('./routes/chatHistoryRoutes.js');
const whatsappRoutes = require('./routes/whatsapp.js');
const widgetRoutes = require('./routes/widget.js');
const voipRoutes = require('./routes/voip.js');
const voipConfigRoutes = require('./routes/voipConfigRoutes.js');
const settingsRoutes = require('./routes/settingsRoutes.js');
const aiRoutes = require('./routes/airoutes');

// =================================================================
// CONTROLLER & UTILITY IMPORTS
// =================================================================
const voiceBot = require('./void_bot/voiceBot');
const { askOpenAI } = require('./utils/openai.js');
const { sendFacebookMessage } = require('./utils/facebook.js');
const { init: initWhatsappController } = require('./controllers/whatsappController.js');
const voipController = require('./controllers/voipController.js');


// --- Express App Initialization ---
const app = express();

// --- Core Middleware ---
app.use(cors());
app.use(express.json()); // ✅ ADD THIS LINE HERE ✅

// --- API Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/superadmin', superadminRoutes); // ✅ Only one definition
app.use('/api/admin', adminRoutes);         // ✅ Only one definition
app.use('/api/users', adminRoutes);         // Assuming you want /users to also use adminRoutes
app.use('/api/v1', apiRoutes); // ✅ ADD THIS LINE HERE ✅
app.use('/api/conversations', conversationRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/voip', voipRoutes);
app.use('/api/voip-config', voipConfigRoutes);

app.use('/api/facebook', facebookRouter);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/widget', widgetRoutes);
app.use("/api/voice", voiceBot);
app.use('/api/chat', chatRoutes); // ✅ ADD THIS
app.use('/api/settings', settingsRoutes);


app.set('greetedFacebookUsers', new Set());
// --- Root Endpoint for Health Check ---
app.get('/api', (req, res) => res.status(200).json({ message: 'VOID AI Support Backend is running ✅' }));

// --- HTTP & Socket.IO Server Setup ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "OPTIONS"]
  }
});

const voipWss = new WebSocketServer({
  // We don't specify a path here because we will check it manually.
  noServer: true
});

// The httpServer is the one you created with http.createServer(app)
httpServer.on('upgrade', (request, socket, head) => {
  // This event fires when a client tries to upgrade from HTTP to WebSocket.
  const pathname = url.parse(request.url).pathname;

  // We check if the request is for our main VOIP stream path.
  if (pathname.startsWith('/api/voip/stream/')) {
    voipWss.handleUpgrade(request, socket, head, (ws) => {
      // If the upgrade is successful, emit a 'connection' event with the custom data.
      voipWss.emit('connection', ws, request);
    });
  } else {
    // If it's not our VOIP path, we don't handle it here.
    // Let the socket.io server handle its own upgrades.
  }
});

// --- Handle New VOIP Connections ---
voipWss.on('connection', (ws, request) => {
  // This function runs every time a new VOIP call connects via WebSocket.
  const pathname = url.parse(request.url).pathname;

  // Extract the provider name from the end of the URL
  // e.g., '/api/voip/stream/twilio' -> 'twilio'
  const providerName = pathname.split('/').pop();

  // For providers like Telnyx, we might pass a stream_id in the URL.
  const query = url.parse(request.url, true).query;
  const streamId = query.stream_id || null;

  // Now, we pass the live connection AND the provider name to our controller.
  console.log(`🔗 VOIP WebSocket connection established for provider: ${providerName}!`);
  voipController.handleLiveConversation(ws, providerName, streamId);
});

// --- Persistent State & Logging Setup ---
const chatLogsPath = path.join(__dirname, 'chat_logs');
const dataDirPath = path.join(__dirname, 'data');
const requestsFilePath = path.join(dataDirPath, 'chat_requests.json');
const activeConversations = new Map(); // In-memory map of { userId -> agentSocketId }

if (!fs.existsSync(chatLogsPath)) fs.mkdirSync(chatLogsPath, { recursive: true });
if (!fs.existsSync(dataDirPath)) fs.mkdirSync(dataDirPath, { recursive: true });

// =================================================================
// Helper Functions
// =================================================================

/**
 * Appends a message to a conversation's log file.
 * @param {string} conversationId - The unique ID for the conversation.
 * @param {object} messageData - The message object to log.
 */
function logMessage(conversationId, messageData) {
  const logFilePath = path.join(chatLogsPath, `${conversationId}.json`);
  let conversation = [];
  if (fs.existsSync(logFilePath)) {
    try {
      const fileContent = fs.readFileSync(logFilePath, 'utf-8');
      conversation = fileContent ? JSON.parse(fileContent) : [];
    } catch (e) {
      console.error(`Error parsing log file ${logFilePath}, creating a new one.`);
      conversation = [];
    }
  }
  conversation.push(messageData);
  fs.writeFileSync(logFilePath, JSON.stringify(conversation, null, 2));
}

/**
 * Reads the pending agent chat requests from a JSON file.
 * @returns {Array} An array of pending request objects.
 */
function getPendingRequests() {
  try {
    if (!fs.existsSync(requestsFilePath)) {
      fs.writeFileSync(requestsFilePath, JSON.stringify([], null, 2));
      return [];
    }
    const fileData = fs.readFileSync(requestsFilePath, 'utf-8');
    return fileData ? JSON.parse(fileData) : [];
  } catch (error) {
    console.error("Error reading or parsing chat_requests.json:", error);
    return [];
  }
}

/**
 * Saves the current list of pending requests to a JSON file.
 * @param {Array} requests - The array of pending request objects to save.
 */
function savePendingRequests(requests) {
  try {
    fs.writeFileSync(requestsFilePath, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error("Error saving chat_requests.json:", error);
  }
}


app.set('socketio', io);
app.set('activeConversations', activeConversations);
app.set('logMessage', logMessage);

initWhatsappController(io);


// --- Socket.IO Authentication Middleware for agents/admins ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(); // Allow non-authenticated users (e.g., web chat clients)
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token.'));
    }
    socket.user = decoded; // Attach user data (id, name, role) to the socket
    next();
  });
});

// --- Main Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Join superadmin room if applicable
  if (socket.user && socket.user.role === 'superadmin') {
    socket.join('superadmin_room');
    console.log(`👑 Superadmin ${socket.user.name} joined the private superadmin room.`);
  }

  // --- AI & Utility Handlers ---

  socket.on('get-ai-reply', async ({ userInput, language }, callback) => {
    try {
      const reply = await askOpenAI(userInput, language);
      callback({ reply });
    } catch (error) {
      console.error("Error getting AI reply:", error);
      callback({ reply: "Më falni, pata një problem me sistemin e inteligjencës artificiale. Ju lutem provoni përsëri." });
    }
  });

  socket.on('request-whatsapp-transcript', ({ userId }) => {
    const logFilePath = path.join(chatLogsPath, `${userId}.json`);
    const tempDir = path.join(__dirname, 'temp_transcripts');
    if (!fs.existsSync(logFilePath)) return;
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputPdfPath = path.join(tempDir, `${userId}-${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const writeStream = fs.createWriteStream(outputPdfPath);
    doc.pipe(writeStream);

    doc.fontSize(18).font('Helvetica-Bold').text('Void AI Chat Transcript', { align: 'center' }).moveDown();
    const conversation = JSON.parse(fs.readFileSync(logFilePath, 'utf-8'));

    conversation.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      doc.fontSize(8).fillColor('gray').text(timestamp).moveDown(0.2);
      if (msg.from === 'user') doc.font('Helvetica-Bold').fillColor('#005ce6').text('User:').font('Helvetica').fillColor('black').text(msg.text, { indent: 10 }).moveDown();
      else if (msg.from === 'agent') doc.font('Helvetica-Bold').fillColor('#25D366').text(`${msg.agentName || 'Agent'}:`).font('Helvetica').fillColor('black').text(msg.text, { indent: 10 }).moveDown();
      else if (msg.from === 'system') doc.font('Helvetica-Oblique').fillColor('gray').text(`--- ${msg.text} ---`, { align: 'center' }).moveDown();
      else if (msg.type === 'event') doc.font('Helvetica-Oblique').fillColor('gray').text(`--- Event: ${msg.event.replace(/-/g, ' ')} ---`, { align: 'center' }).moveDown();
    });
    doc.end();

    writeStream.on('finish', () => {
      io.to('whatsapp_bot_room').emit('send-file-to-user', { userId, filePath: outputPdfPath });
      setTimeout(() => { if (fs.existsSync(outputPdfPath)) fs.unlinkSync(outputPdfPath); }, 60000);
    });
  });

  // --- Session & Agent Pool Management ---

  socket.on('join-session', ({ sessionId, role }) => {
    socket.join(sessionId);
    console.log(`📥 [SESSION JOIN] ID: ${socket.id} joined room: ${sessionId} as ${role}`);
  });

  socket.on('agent-listening', () => {
    if (socket.user) {
      socket.join('agents-pool');
      const pendingRequests = getPendingRequests();
      if (pendingRequests.length > 0) {
        socket.emit('initial-requests', pendingRequests);
      }
    }
  });

  socket.on('agent-reconnected', ({ conversationIds }) => {
    if (!socket.user || !Array.isArray(conversationIds)) return;
    for (const userId of conversationIds) {
      activeConversations.set(userId, socket.id);
      console.log(`🔄 [RECONNECT] Agent ${socket.user.name} re-linked to conversation ${userId}`);
    }
  });

  // --- Core Chat Lifecycle Handlers ---

  socket.on('agent-request', ({ userId, message, timestamp, channel }) => {
    const requests = getPendingRequests();
    if (!requests.some(req => req.userId === userId)) {
      const newRequest = { userId, message, timestamp, channel };
      requests.push(newRequest);
      savePendingRequests(requests);
      io.to('agents-pool').emit('agent-request', newRequest);
      logMessage(userId, { type: 'event', event: 'agent-requested', message, timestamp, channel });
      console.log(`[AGENT REQUEST] Received from [${channel.toUpperCase()}] User: ${userId}`);
    }
  });

  socket.on('agent-linked', async ({ userId, agentSocketId, initialMessage }) => {
    if (!socket.user) return;

    activeConversations.set(userId, agentSocketId);
    savePendingRequests(getPendingRequests().filter(req => req.userId !== userId));

    io.to(agentSocketId).emit('chat-assigned', { userId, initialMessage });
    socket.to('agents-pool').emit('request-claimed', { userId });

    logMessage(userId, { type: 'event', event: 'agent-linked', agent: socket.user, timestamp: new Date().toISOString() });
    const systemMessage = `Agent ${socket.user.name} linked to chat.`;
    logMessage(userId, { from: 'system', text: systemMessage, timestamp: new Date().toISOString() });

    if (userId.includes('@c.us')) {
      io.to('whatsapp_bot_room').emit('agent-linked', { userId, agentSocketId });
      io.to('whatsapp_bot_room').emit('inform-user-agent-joined', { userId, agentName: socket.user.name });
    } else if (/^\d{15,}$/.test(userId)) {
      await sendFacebookMessage(userId, `Ju jeni lidhur me agjentin tonë: ${socket.user.name}.`);
    } else {
      io.to(userId).emit('agent-linked', { agent: { id: socket.user.id, name: socket.user.name, role: socket.user.role } });
    }
  });

  socket.on('forward-to-agent', ({ userId, message }) => {
    const agentSocketId = activeConversations.get(userId);
    if (agentSocketId) {
      const channel = userId.includes('@c.us') ? 'whatsapp' : (/^\d{15,}$/.test(userId) ? 'messenger' : 'web');
      logMessage(userId, { from: 'user', text: message, timestamp: new Date().toISOString() });
      io.to(agentSocketId).emit('user-message', { userId, message, channel });
    } else {
      console.warn(`[WARN] Received 'forward-to-agent' for user ${userId} but no active conversation was found.`);
    }
  });

  socket.on('agent-reply', async ({ userId, message }) => {
    if (!socket.user) return;

    logMessage(userId, { from: 'agent', agentId: socket.user.id, agentName: socket.user.name, text: message, timestamp: new Date().toISOString() });

    if (userId.includes('@c.us')) {
      io.to('whatsapp_bot_room').emit('agent-reply', { userId, message });
    } else if (/^\d{15,}$/.test(userId)) {
      await sendFacebookMessage(userId, message);
    } else {
      io.to(userId).emit('agent-reply', { message });
    }
  });

  socket.on('end-chat', async ({ userId }) => {
    if (!socket.user) return;

    activeConversations.delete(userId);
    logMessage(userId, { type: 'event', event: 'chat-ended-by-agent', agent: socket.user, timestamp: new Date().toISOString() });
    console.log(`🚫 Chat ended by agent ${socket.user.name} for user ${userId}`);

    if (userId.includes('@c.us')) {
      io.to('whatsapp_bot_room').emit('chat-ended-by-agent', { userId });
    } else if (/^\d{15,}$/.test(userId)) {
      await sendFacebookMessage(userId, 'This chat session has ended. Thank you for contacting us!');
    } else {
      io.to(userId).emit('chat-ended-by-agent');
    }
  });


  socket.on('user-ended-chat', ({ userId }) => {
    if (!userId) return; // Basic validation

    console.log(`🚫 Chat ended by user: ${userId}`);
    const agentSocketId = activeConversations.get(userId);


    if (agentSocketId) {

      io.to(agentSocketId).emit('user-left-chat', { userId });
    }


    activeConversations.delete(userId);
    logMessage(userId, { type: 'event', event: 'chat-ended-by-user', timestamp: new Date().toISOString() });
  });




  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
    for (const [userId, agentSocketId] of activeConversations.entries()) {
      if (agentSocketId === socket.id) {
        // This handles agent disconnections.
        // We might want to notify the user in the future.
        activeConversations.delete(userId);
        console.log(` Agent disconnected, conversation with ${userId} is now unassigned.`);
      }
    }
  });
});

// --- Server Listening ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is live and running on http://localhost:${PORT}`);
});