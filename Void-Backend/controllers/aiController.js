const db = require("../db/mysql");
const axios = require("axios");

// POST /train-ai
const trainAIEntry = async (req, res) => {
  const { intent, prompt, response } = req.body; // Get response from request
  const tenant_id = req.user.tenantId;

  if (!intent || !prompt || !response) {
    return res
      .status(400)
      .json({ message: "Missing intent, prompt, or response." });
  }

  try {
    const [existing] = await db.query(
      "SELECT * FROM ai_entries WHERE tenant_id = ? AND intent = ?",
      [tenant_id, intent]
    );

    if (existing.length > 0) {
      // **Update Existing Entry**
      await db.query(
        "UPDATE ai_entries SET prompt = ?, response = ? WHERE tenant_id = ? AND intent = ?",
        [prompt, response, tenant_id, intent]
      );

      res.status(200).json({ message: "AI Entry updated successfully." }); // Changed status code and message
    } else {
      // **Create New Entry**
      await db.query(
        "INSERT INTO ai_entries (tenant_id, intent, prompt, response) VALUES (?, ?, ?, ?)",
        [tenant_id, intent, prompt, response]
      );

      res.status(201).json({ message: "AI Entry trained successfully." });
    }

    // After either updating or inserting, send to the external API (if configured)
    try {
      const ai_api_url = process.env.AI_API_URL;
      if (!ai_api_url) {
        console.warn(
          "AI_API_URL is not defined in the environment. Skipping external API call."
        );
      } else {
        const ai_api_key = process.env.AI_API_KEY;
        if (!ai_api_key) {
          console.error("AI_API_KEY is not defined in the environment.");
          return res
            .status(500)
            .json({ message: "AI_API_KEY is not defined." });
        }

        const config = {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": ai_api_key,
          },
        };

        console.log("Sending to AI API:", {
          url: ai_api_url,
          data: { intent, prompt, response }, // Changed from message to intent, prompt, and response
          headers: config.headers,
        });

        const aiApiResponse = await axios.post(
          ai_api_url,
          {
            intent: intent, // Adjust the structure to match the external API's requirements
            prompt: prompt,
            response: response,
          },
          config
        );

        console.log("External AI API Response:", aiApiResponse.data); // Log the response
      }
    } catch (aiApiError) {
      console.error("Error sending data to external AI API:", aiApiError);
      console.error(
        "External AI API Response data:",
        aiApiError.response ? aiApiError.response.data : null
      );
      // Log error but DO NOT interrupt the process.  We still trained locally.
      // It is better to inform the user than to completely fail if the external AI service has issues.
      console.warn(
        "Training continued locally, but there was an error sending data to the external AI."
      );
    }
  } catch (error) {
    console.error("Error training AI entry:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// POST /ask-ai → Connects to remote AI API
const askAI = async (req, res) => {
  try {
    const { message, language } = req.body; // Extract message and language from req.body
    const tenantId = req.user.tenantId; // get tenantId from authenticated user
    // defensive check
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (!language) {
      console.error(
        '[DEBUG] FATAL: Language parameter was undefined or empty! Defaulting to "en".'
      );
      language = "en";
    }
    if (!tenantId) {
      console.error(
        "[DEBUG] FATAL: tenantId parameter was undefined or empty!"
      );
      return res.status(400).json({ error: "Tenant ID is missing." });
    }

    const systemPrompt = getSystemPrompt(language);
    const matchedKnowledge = await findRelevantKnowledge(message, tenantId); // Await it

    let prompt = `${systemPrompt}\n\n`;

    if (matchedKnowledge.length > 0) {
      console.log(
        `[DEBUG] Found ${matchedKnowledge.length} relevant knowledge entries.`
      );
      matchedKnowledge.forEach((entry, idx) => {
        console.log(
          `[DEBUG] Processing entry for intent "${entry.intent}". Checking for response in language "${language}".`
        );
        prompt += `KNOWN CONTEXT ${idx + 1}: "${entry.response}"\n\n`;
      });
    } else {
      console.log("[DEBUG] No matched knowledge found.");
    }

    prompt += `User: ${message}\nAI:`;

    console.log("----------------- FINAL PROMPT TO LLaMA3 -----------------");
    console.log(`Language used for generation: [${language}]`);
    console.log(prompt);
    console.log("----------------------------------------------------------");

    // Send request to LLM API
    const aiApiResponse = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL_NAME || "llama3:8b-instruct-q3_K_M", // Use env var or default
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.85,
          num_predict: 300,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.AI_API_KEY, // Get the API key from env variables
        },
      }
    );
    // Send only AI REsponse from endpoint
    res.status(200).json({ response: aiApiResponse.data.response }); // Send response, not the whole axios object
  } catch (error) {
    console.error("[AI ERROR]", error);
    console.error(
      "[AI ERROR] Response data:",
      error.response ? error.response.data : null
    );
    res.status(500).json({ error: "Failed to connect to AI API" });
  }
};
// GET /ai-entries
const getAIEntries = async (req, res) => {
  const tenant_id = req.user.tenantId;

  try {
    const [entries] = await db.query(
      "SELECT id, intent, prompt, response, created_at FROM ai_entries WHERE tenant_id = ?",
      [tenant_id]
    );

    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching AI entries:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /ai-entries/:intent
const deleteAIEntry = async (req, res) => {
  const tenant_id = req.user.tenantId;
  const intent = req.params.intent;

  try {
    const [result] = await db.query(
      "DELETE FROM ai_entries WHERE tenant_id = ? AND intent = ?",
      [tenant_id, intent]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Intent not found." });
    }

    res.status(200).json({ message: "AI Entry deleted." });
  } catch (error) {
    console.error("Error deleting AI entry:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  trainAIEntry,
  getAIEntries,
  deleteAIEntry,
  askAI, // ← Export the function
};
