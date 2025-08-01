const { askOpenAI } = require('../utils/openai');
const db = require('../db/mysql');

const fs = require('fs');
const path = require('path');

// In-memory store for demo (use DB in future)
const sessionsPath = path.join(__dirname, '../data/chatSessions.json');

// Load sessions
const loadSessions = () => {
  if (!fs.existsSync(sessionsPath)) return {};
  try {
    const data = fs.readFileSync(sessionsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading or parsing sessions file:", error);
    return {};
  }
};

// Save sessions
const saveSessions = (sessions) => {
  try {
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error("Error writing sessions file:", error);
  }
};

// 🧠 AI Logic
exports.handleChatMessage = async (req, res) => {
  const { message, sessionId, language = 'en' } = req.body;
  const tenantId = req.tenant.id;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'Message and sessionId are required.' });
  }

  try {
    // Validate session
    const [sessions] = await db.query(
      'SELECT id FROM chat_sessions WHERE id = ? AND tenant_id = ?',
      [sessionId, tenantId]
    );
    if (!sessions.length) {
      return res.status(403).json({ error: 'Invalid session for tenant.' });
    }

    // Store user message
    await db.query(
      `INSERT INTO chat_logs (tenant_id, session_id, sender, message, intent)
       VALUES (?, ?, ?, ?, ?)`,
      [tenantId, sessionId, 'user', message, null]
    );

    // === Try matching local AI entries ===
    const [entries] = await db.query(
      `SELECT intent, response_en, response_sq, response_sr FROM ai_entries WHERE tenant_id = ?`,
      [tenantId]
    );

    let matchedIntent = null;
    let replyText = null;

    for (const entry of entries) {
      const intentPhrase = entry.intent.replace(/_/g, ' ');
      if (message.toLowerCase().includes(intentPhrase)) {
        matchedIntent = entry.intent;
        if (language === 'sq') replyText = entry.response_sq;
        else if (language === 'sr') replyText = entry.response_sr;
        else replyText = entry.response_en;
        break;
      }
    }

    // === Fallback to OpenAI if no intent match ===
    if (!replyText) {
      const fallback = await askOpenAI(message, language);
      replyText = typeof fallback === 'string' ? fallback : fallback.reply;
      matchedIntent = 'unrecognized';
    }

    // Store bot reply
    await db.query(
      `INSERT INTO chat_logs (tenant_id, session_id, sender, message, intent)
       VALUES (?, ?, ?, ?, ?)`,
      [tenantId, sessionId, 'bot', replyText, matchedIntent]
    );

    res.json({ reply: replyText, intent: matchedIntent });
  } catch (err) {
    console.error('❌ handleChatMessage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// 📥 Store a new chat request
exports.createSessionRequest = async (req, res) => {
  const { userId, message } = req.body;
  const tenantId = req.tenant?.id;

  if (!userId || !message || !tenantId) {
    return res.status(400).json({ error: 'userId, message, and tenantId are required' });
  }

  try {
    const sessionId = uuidv4();

    // 1. Create session
    await db.query(
      `INSERT INTO chat_sessions (id, user_id, tenant_id, created_at)
       VALUES (?, ?, ?, NOW())`,
      [sessionId, userId, tenantId]
    );

    // 2. Log initial user message
    await db.query(
      `INSERT INTO chat_logs (session_id, tenant_id, sender, message, created_at)
       VALUES (?, ?, 'user', ?, NOW())`,
      [sessionId, tenantId, message]
    );

    // 3. Attempt to assign an agent
    const [agents] = await db.query(
      `SELECT id FROM users
       WHERE role = 'Agent' AND is_online = 1 AND tenant_id = ?
       ORDER BY RAND() LIMIT 1`,
      [tenantId]
    );

    const assignedAgentId = agents[0]?.id || null;

    if (assignedAgentId) {
      await db.query(
        `UPDATE chat_sessions SET agent_id = ?, accepted_at = NOW()
         WHERE id = ?`,
        [assignedAgentId, sessionId]
      );
    }

    return res.status(201).json({
      success: true,
      sessionId,
      assignedAgent: assignedAgentId || null
    });

  } catch (err) {
    console.error('❌ createSessionRequest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// 📋 Get all sessions
exports.getAllSessions = async (req, res) => {
  const tenantId = req.tenant.id;

  try {
    const [sessions] = await db.query(
      `SELECT cs.*, u.username AS user_name
       FROM chat_sessions cs
       LEFT JOIN users u ON cs.user_id = u.id
       WHERE cs.tenant_id = ?
       ORDER BY cs.started_at DESC`,
      [tenantId]
    );

    res.json(sessions);
  } catch (err) {
    console.error('❌ getAllSessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// ✅ Accept a session
exports.acceptSession = async (req, res) => {
  const { sessionId, agentId } = req.body;
  const tenantId = req.tenant.id;

  if (!sessionId || !agentId) {
    return res.status(400).json({ error: 'sessionId and agentId are required' });
  }

  try {
    // Validate session-tenant relationship
    const [sessions] = await db.query(
      'SELECT id FROM chat_sessions WHERE id = ? AND tenant_id = ?',
      [sessionId, tenantId]
    );
    if (!sessions.length) {
      return res.status(403).json({ error: 'Session does not belong to your tenant' });
    }

    // Assign agent
    await db.query(
      `UPDATE chat_sessions SET agent_id = ?, accepted_at = NOW() WHERE id = ?`,
      [agentId, sessionId]
    );

    res.json({ success: true, message: 'Session accepted by agent' });
  } catch (err) {
    console.error('❌ acceptSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};