// controllers/chatHistoryController.js

const db = require('../db/mysql');

/**
 * @desc    Get a list of all chat conversations for the superadmin dashboard.
 * @route   GET /api/chat-history
 * @access  Private (Superadmin)
 */
exports.getChatLogsList = async (req, res) => {
  try {
    // This query selects each unique conversation ID and the timestamp of the last message in it.
    // This allows you to show the most recent conversations first.
    // ASSUMPTION: Your messages table is named 'chat_messages'.
    const [logs] = await db.query(
      `SELECT 
         conversation_id AS conversationId,
         MAX(timestamp) AS lastMessageTime
       FROM chat_messages
       GROUP BY conversation_id
       ORDER BY lastMessageTime DESC`
    );

    res.json(logs);
  } catch (err) {
    console.error('❌ Error fetching chat logs list for superadmin:', err);
    res.status(500).json({ message: 'Failed to fetch chat logs list.' });
  }
};

/**
 * @desc    Get all messages for a specific conversation by its ID.
 * @route   GET /api/chat-history/:conversationId
 * @access  Private (Superadmin)
 */
exports.getChatLogContent = async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation ID is required.' });
  }

  try {
    // This query gets all messages for the specified conversation ID.
    // ASSUMPTION: Your messages table is 'chat_messages' and has these columns.
    const [messages] = await db.query(
      `SELECT * FROM chat_messages 
       WHERE conversation_id = ? 
       ORDER BY timestamp ASC`, 
      [conversationId]
    );

    if (messages.length === 0) {
      // This is not an error, but the conversation might be empty or invalid.
      return res.json([]);
    }

    res.json(messages);
  } catch (err) {
    console.error(`❌ Error fetching messages for conversation ${conversationId}:`, err);
    res.status(500).json({ message: 'Failed to fetch chat content.' });
  }
};