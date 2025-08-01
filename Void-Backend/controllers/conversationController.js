// controllers/conversationController.js
const fs = require('fs');
const path = require('path');
const { io } = require('../socket'); // this gives us access to socket emit

const conversationsFile = path.join(__dirname, '../data/conversations.json');

// 🧠 Load conversations
function loadConversations() {
  if (!fs.existsSync(conversationsFile)) return {};
  return JSON.parse(fs.readFileSync(conversationsFile));
}

// 💾 Save conversations
function saveConversations(data) {
  fs.writeFileSync(conversationsFile, JSON.stringify(data, null, 2));
}

// ✅ Get all active conversations
exports.getAllConversations = (req, res) => {
  const data = loadConversations();
  res.json(data);
};

// ✅ Send agent reply to a specific user
exports.sendReply = (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  const data = loadConversations();

  if (!data[userId]) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const reply = {
    from: 'agent',
    message,
    timestamp: new Date().toISOString()
  };

  data[userId].messages.push(reply);
  saveConversations(data);

  // 🔥 Emit to bot room so voidBot can send to WhatsApp
  io.to('whatsapp-bot').emit('agent-reply', {
    userId,
    message
  });

  res.json({ success: true });
};

// ✅ Store incoming user message (called from server.js or bot logic)
exports.storeUserMessage = (userId, text) => {
  const data = loadConversations();

  if (!data[userId]) {
    data[userId] = { messages: [] };
  }

  data[userId].messages.push({
    from: 'user',
    message: text,
    timestamp: new Date().toISOString()
  });

  saveConversations(data);
};
