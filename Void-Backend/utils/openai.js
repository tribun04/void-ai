const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const mysql = require('mysql');

const LLM_API_URL = process.env.LLM_API_URL || "https://voidsystem.shigjeta.com/api/generate";
const MODEL_NAME = process.env.MODEL_NAME || "llama3:8b-instruct-q3_K_M";

// --- MySQL Connection Configuration ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'your_db_user',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: process.env.DB_DATABASE || 'your_db_name'
};

// --- Create a MySQL connection pool ---
const pool = mysql.createPool(dbConfig);

// --- Function to execute SQL queries ---
function executeQuery(sql, values) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        console.error("❌ MySQL query error:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// --- Load Tenant-Specific Knowledge Base from MySQL ---
async function loadKnowledgeBase(tenantId) {
  try {
    const sql = 'SELECT * FROM ai_entries WHERE tenant_id = ?';
    const results = await executeQuery(sql, [tenantId]);

    if (!results || results.length === 0) {
      console.warn(`[DEBUG] No knowledge base entries found for tenant "${tenantId}" in MySQL.`);
      return [];
    }

    // Ensure data is in the correct format
    const knowledgeBase = results.map(row => ({
      intent: row.intent,
      prompt: row.prompt, // Retrieve prompt
      response: row.response  // Retrieve response
    }));

    return knowledgeBase;
  } catch (err) {
    console.error(`❌ Error reading knowledge base from MySQL for tenant "${tenantId}":`, err);
    return [];
  }
}

// --- System Prompt by Language and Tenant ---
function getSystemPrompt(lang = "en", tenantId) {
  console.log(`[DEBUG] getSystemPrompt called with lang: "${lang}", tenantId: "${tenantId}"`);

  const tenantPromptsPath = path.join(__dirname, `../data/${tenantId}/prompts.json`);
  let prompts = {};
  try {
    if (fs.existsSync(tenantPromptsPath)) {
      const fileContent = fs.readFileSync(tenantPromptsPath, "utf-8");
      if (fileContent.trim() !== "") {
        prompts = JSON.parse(fileContent);
      } else {
        console.warn(`[DEBUG] prompts.json for tenant "${tenantId}" is empty.`);
      }
    } else {
      console.warn(`[DEBUG] No custom prompts found for tenant "${tenantId}".`);
    }
  } catch (err) {
    console.warn(`[DEBUG] Error reading custom prompts for tenant "${tenantId}":`, err);
  }

  const defaultPrompts = {
    en: `You are Olive AI, the official assistant of Olive Medical Center. Be helpful, clear, and strictly respond in English. Always guide users professionally across services, systems, or digital inquiries.`,
    sq: `Ti je Olive AI, asistenti zyrtar i Olive Medical Center. Përgjigju në mënyrë profesionale dhe qartë në shqip. Ndihmo përdoruesin me informacion të saktë sipas kontekstit mjekësor.`,
    sr: `Vi ste Olive AI, zvanični asistent Olive Medical Center-a. Odgovarajte jasno i profesionalno na srpskom jeziku, pružajući korisne informacije pacijentima.`
  };

  let selectedPrompt = prompts[lang] || defaultPrompts[lang];

  if (!selectedPrompt) {
    selectedPrompt = defaultPrompts["en"];
    console.log(`[DEBUG] Language "${lang}" not found in prompts, falling back to "en".`);
  }

  if (!selectedPrompt) {
    selectedPrompt = "You are a helpful AI assistant."; // Ultimate fallback
    console.warn("[DEBUG] No prompts available, using a generic fallback prompt.");
  }

  return selectedPrompt;
}

// --- Match Relevant Entries ---
function findRelevantKnowledge(userInput, tenantId, maxResults = 3) {
  const knowledgeBase = loadKnowledgeBase(tenantId);
  const words = userInput.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = knowledgeBase.map(entry => {
    const intentWords = entry.intent.split('_').map(word => word.toLowerCase()); // Convert to lowercase
    let score = 0;
    for (const word of words) {
      for (const iWord of intentWords) {
        if (
          word.length > 2 &&
          iWord.length > 2 &&
          (word.includes(iWord) || iWord.includes(word))
        ) {
          score++;
        }
      }
    }
    return { entry, score };
  });
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.entry);
}

// --- Main Ask Function ---
exports.askOpenAI = async (userInput, language, tenantId) => {
  console.log(`[DEBUG] askOpenAI function started. Received language: "${language}", tenantId: "${tenantId}"`);

  // Defensive checks
  if (!language) {
    console.error('[DEBUG] FATAL: Language parameter was undefined or empty! Defaulting to "en".');
    language = 'en';
  }

  if (!tenantId) {
    console.error('[DEBUG] FATAL: Tenant ID is required for multi-tenancy!');
    return "Tenant ID is required.";  // Or throw an error, depending on your needs
  }


  if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
    console.error('[DEBUG] FATAL: User input is invalid!');
    return "Please provide a valid question.";  // Or throw an error, depending on your needs
  }


  const systemPrompt = getSystemPrompt(language, tenantId);
  const matchedKnowledge = findRelevantKnowledge(userInput, tenantId);

  let aiResponse;
  if (matchedKnowledge.length > 0) {
    console.log(`[DEBUG] Found ${matchedKnowledge.length} relevant knowledge entries.`);
    // Find the best match based on user input
    const bestMatch = matchedKnowledge.reduce((best, entry) => {
      const promptScore = entry.prompt.includes(userInput) ? 1 : 0;
      return promptScore > (best.score || 0) ? { entry, score: promptScore } : best;
    }, {});

    if (bestMatch.entry) {
      console.log(`[DEBUG] Using matched knowledge entry with intent: ${bestMatch.entry.intent}`);
      aiResponse = bestMatch.entry.response; // Use the response from the best matching entry
    } else {
      console.log("[DEBUG] No suitable matched knowledge found despite relevant entries.");
    }
  } else {
    console.log("[DEBUG] No matched knowledge found.");
  }


  let prompt = `${systemPrompt}\n\n`;

  if (aiResponse) {
    prompt += `\nOlive AI: ${aiResponse}\n`;
  } else {
    prompt += `User: ${userInput}\nOlive AI:`;
  }

  console.log('----------------- FINAL PROMPT TO LLaMA3 -----------------');
  console.log(`Language used for generation: [${language}]`);
  console.log(prompt);
  console.log('----------------------------------------------------------');

  try {
    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.85,
          num_predict: 300
        }
      }),
      timeout: 10000 // Example timeout of 10 seconds (adjust as needed)
    });

    if (!response.ok) {
      console.error(`❌ API call failed with status: ${response.status}`);
      try {
        const errorBody = await response.text();
        console.error(`❌ API error body: ${errorBody}`); // Log the error response
      } catch (e) {
        console.error("❌ Could not parse API error body", e);
      }
      return "There was an error processing your request. Please try again later.";
    }


    const data = await response.json();
    console.log("[DEBUG] Full API response:", JSON.stringify(data, null, 2));
    if (data && data.response) {
      return data.response?.trim() || "⚠️ AI nuk u përgjigj.";
    } else {
      console.error("❌ API response is missing 'response' field.");
      return "⚠️ AI nuk u përgjigj.";
    }


  } catch (err) {
    console.error("❌ Error calling LLaMA3 API:", err.message);
    console.error(`[DEBUG] API call failed. Using fallback response for language "${language}".`);
    const fallback = {
      sq: "Ka një problem me sistemin. Ju lutem provoni më vonë.",
      sr: "Postoji problem sa sistemom. Pokušajte kasnije.",
      en: "There is a temporary issue with the system. Please try again shortly."
    };
    return fallback[language] || fallback["en"];
  }
};

// --- Training Function ---
exports.trainAIEntry = async (req, res) => {
  const TRAINING_API_URL = "https://void.shigjeta.com/api/superadmin/train-ai"; // Ensure this is the correct URL
  const API_KEY = process.env.SUPERADMIN_API_KEY;  //  YOUR SUPERADMIN KEY

  try {
    const data = req.body; // Get the training data from the request body
    const response = await fetch(TRAINING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY  // THE CORRECT KEY
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(`❌ Training API call failed with status: ${response.status}`);
      try {
        const errorBody = await response.text();
        console.error(`❌ Training API error body: ${errorBody}`);
      } catch (e) {
        console.error("❌ Could not parse Training API error body", e);
      }
      return res.status(response.status).send(`Training API call failed with status: ${response.status}`); // Send error status
    }

    const responseData = await response.json();
    console.log("[DEBUG] Training API response:", JSON.stringify(responseData, null, 2));
    res.json(responseData); // Send the response data
  } catch (err) {
    console.error("❌ Error calling Training API:", err);
    res.status(500).send("Error calling Training API"); // Send 500 error
  }
};
// --- Test Functions ---
async function testLoadKnowledgeBase() {
  const tenant1Knowledge = await loadKnowledgeBase('tenant1');
  const tenant2Knowledge = await loadKnowledgeBase('tenant2');

  console.assert(tenant1Knowledge.length > 0, "Tenant 1 knowledge base is empty");
  console.assert(tenant2Knowledge.length > 0, "Tenant 2 knowledge base is empty");
  console.assert(tenant1Knowledge[0].response === 'Hi there!', "Tenant 1 response is incorrect");
  console.assert(tenant2Knowledge[0].response === 'Greetings!', "Tenant 2 response is incorrect");

  console.log("loadKnowledgeBase tests passed!");
}

async function testGetSystemPrompt() {
  const tenant1Prompt = getSystemPrompt('en', 'tenant1');
  const tenant2Prompt = getSystemPrompt('en', 'tenant2');

  console.assert(tenant1Prompt.includes("Tenant 1"), "Tenant 1 prompt is incorrect");
  console.assert(tenant2Prompt.includes("Tenant 2"), "Tenant 2 prompt is incorrect");

  console.log("getSystemPrompt tests passed!");
}

async function testAskOpenAI() {
  const response1 = await exports.askOpenAI('Hello', 'en', 'tenant1');
  const response2 = await exports.askOpenAI('Hello', 'en', 'tenant2');

  console.assert(response1.includes('Hi there!'), "Tenant 1 response is incorrect");
  console.assert(response2.includes('Greetings!'), "Tenant 2 response is incorrect");

  console.log("askOpenAI tests passed!");
}

async function testTrainAIEntry() {
  const newAIEntry = {
    intent: 'testing',
    prompt: 'Test prompt',
    response: 'Test response'
  };
  try {
    const trainingResult = await exports.trainAIEntry(newAIEntry);
    console.log("Training was successful:", trainingResult);
  } catch (error) {
    console.error("Training failed:", error);
  }
}

// -- Example usage: test cases  (Uncomment to run tests)
//testLoadKnowledgeBase();
//testGetSystemPrompt();
//testAskOpenAI();
//testTrainAIEntry();