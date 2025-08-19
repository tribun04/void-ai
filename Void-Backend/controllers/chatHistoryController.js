// controllers/chatHistoryController.js
const db = require('../db/mysql');

function capLimit(v, def = 50, max = 200) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : def;
}

exports.getChatLogsList = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toUpperCase();
    const tenantId = req.effectiveTenantId || null;
    const limit = capLimit(req.query.limit);

    let sql = `
      SELECT
        s.id            AS conversationId,
        s.tenant_id     AS tenantId,
        CONCAT(UPPER(s.platform), ' • ', LEFT(s.id,8)) AS title,
        s.created_at    AS createdAt,
        MAX(m.created_at) AS lastMessageAt,
        COUNT(m.id)       AS messageCount
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON m.session_id = s.id
    `;
    const params = [];

    if (tenantId) {
      sql += ` WHERE s.tenant_id = ?`;
      params.push(tenantId);
    } else if (role !== 'SUPERADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    sql += `
      GROUP BY s.id, s.tenant_id, s.platform, s.created_at
      ORDER BY COALESCE(MAX(m.created_at), s.created_at) DESC
      LIMIT ?
    `;
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getChatLogsList error:', err);
    res.status(500).json({ message: 'Failed to fetch chat logs list.' });
  }
};

exports.getChatLogContent = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toUpperCase();
    const tenantId = req.effectiveTenantId || null;
    const { conversationId } = req.params;
    if (!conversationId) return res.status(400).json({ message: 'Conversation ID is required.' });

    // Enforce tenant via JOIN to sessions
    const whereTenant =
      role === 'SUPERADMIN' && !tenantId ? '' : 'AND s.tenant_id = ?';
    const params =
      role === 'SUPERADMIN' && !tenantId
        ? [conversationId]
        : [conversationId, tenantId];

    const [rows] = await db.query(
      `
      SELECT
        m.id          AS messageId,
        m.session_id  AS conversationId,
        m.sender      AS \`from\`,
        m.message     AS text,
        m.created_at  AS timestamp
      FROM chat_messages m
      JOIN chat_sessions s ON s.id = m.session_id
      WHERE m.session_id = ?
      ${whereTenant}
      ORDER BY m.created_at ASC
      `,
      params
    );

    res.json(rows); // if no messages, returns []
  } catch (err) {
    console.error('getChatLogContent error:', err);
    res.status(500).json({ message: 'Failed to fetch chat content.' });
  }
};
