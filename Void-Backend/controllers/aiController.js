const db = require('../db/mysql');
const axios = require('axios');

// POST /train-ai
const trainAIEntry = async (req, res) => {
  const { intent, prompt, response } = req.body; // Get response from request
  const tenant_id = req.user.tenantId;

  if (!intent || !prompt || !response) {
    return res.status(400).json({ message: 'Missing intent, prompt, or response.' });
  }

  try {
    const [existing] = await db.query(
      'SELECT * FROM ai_entries WHERE tenant_id = ? AND intent = ?',
      [tenant_id, intent]
    );

    if (existing.length > 0) {
      // **Update Existing Entry**
      await db.query(
        'UPDATE ai_entries SET prompt = ?, response = ? WHERE tenant_id = ? AND intent = ?',
        [prompt, response, tenant_id, intent]
      );

      res.status(200).json({ message: 'AI Entry updated successfully.' }); // Changed status code and message
    } else {
      // **Create New Entry**
      await db.query(
        'INSERT INTO ai_entries (tenant_id, intent, prompt, response) VALUES (?, ?, ?, ?)',
        [tenant_id, intent, prompt, response]
      );

      res.status(201).json({ message: 'AI Entry trained successfully.' });
    }

    // After either updating or inserting, send to the external API (if configured)
    try {
      const ai_api_url = process.env.AI_API_URL;
      if (!ai_api_url) {
        console.warn("AI_API_URL is not defined in the environment. Skipping external API call.");
      } else {
        const ai_api_key = process.env.AI_API_KEY;
        if (!ai_api_key) {
          console.error("AI_API_KEY is not defined in the environment.");
          return res.status(500).json({ message: "AI_API_KEY is not defined." });
        }

        const config = {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ai_api_key
          }
        };

        console.log("Sending to AI API:", {
          url: ai_api_url,
          data: { intent, prompt, response },  // Changed from message to intent, prompt, and response
          headers: config.headers
        });

        const aiApiResponse = await axios.post(ai_api_url, {
          intent: intent,   // Adjust the structure to match the external API's requirements
          prompt: prompt,
          response: response
        }, config);

        console.log("External AI API Response:", aiApiResponse.data); // Log the response
      }
    } catch (aiApiError) {
      console.error("Error sending data to external AI API:", aiApiError);
      console.error("External AI API Response data:", aiApiError.response ? aiApiError.response.data : null);
      // Log error but DO NOT interrupt the process.  We still trained locally.
      // It is better to inform the user than to completely fail if the external AI service has issues.
      console.warn("Training continued locally, but there was an error sending data to the external AI.");
    }

  } catch (error) {
    console.error('Error training AI entry:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /ask-ai → Connects to remote AI API
const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai_api_url = process.env.AI_API_URL;
    if (!ai_api_url) {
      console.error("AI_API_URL is not defined in the environment.");
      return res.status(500).json({ message: "AI_API_URL is not defined." });
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.AI_API_KEY // Get the API key from env variables
      }
    };

    console.log("Sending to AI API:", {
      url: ai_api_url,
      data: { message },
      headers: config.headers
    });

    const response = await axios.post(ai_api_url, {
      message: message // changed data from prompt to message
    }, config);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('[AI ERROR]', error);
    console.error('[AI ERROR] Response data:', error.response ? error.response.data : null);
    res.status(500).json({ error: 'Failed to connect to AI API' });
  }
};

// GET /ai-entries
const getAIEntries = async (req, res) => {
  const tenant_id = req.user.tenantId;

  try {
    const [entries] = await db.query(
      'SELECT id, intent, prompt, response, created_at FROM ai_entries WHERE tenant_id = ?',
      [tenant_id]
    );

    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching AI entries:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /ai-entries/:intent
const deleteAIEntry = async (req, res) => {
  const tenant_id = req.user.tenantId;
  const intent = req.params.intent;

  try {
    const [result] = await db.query(
      'DELETE FROM ai_entries WHERE tenant_id = ? AND intent = ?',
      [tenant_id, intent]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Intent not found.' });
    }

    res.status(200).json({ message: 'AI Entry deleted.' });
  } catch (error) {
    console.error('Error deleting AI entry:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  trainAIEntry,
  getAIEntries,
  deleteAIEntry,
  askAI // ← Export the function
};