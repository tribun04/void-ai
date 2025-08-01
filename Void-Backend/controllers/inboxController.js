const fs = require('fs');
const path = require('path');

const chatLogsPath = path.join(__dirname, '../logs/chats');

exports.getActiveSessions = (req, res) => {
  try {
    const files = fs.readdirSync(chatLogsPath);
    const sessions = files.map(filename => {
      const sessionId = filename.replace('.json', '');
      const content = fs.readFileSync(path.join(chatLogsPath, filename));
      const messages = JSON.parse(content);
      return { sessionId, messages };
    });
    res.json(sessions);
  } catch (err) {
    console.error('❌ Failed to load sessions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
