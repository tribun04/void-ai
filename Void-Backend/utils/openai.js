const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const LLM_API_URL = "https://voidsystem.shigjeta.com/api/generate";
const MODEL_NAME = "llama3:8b-instruct-q3_K_M";

const knowledgeBasePath = path.join(__dirname, "../data/aiEntries.json");

// --- System Prompt by Language ---
function getSystemPrompt(lang = "en") {
  console.log(`[DEBUG] getSystemPrompt function was called with lang: "${lang}"`);
  const prompts = {
    en: `You are Olive AI, the official assistant of Olive Medical Center. Be helpful, clear, and strictly respond in English. Always guide users professionally across services, systems, or digital inquiries.`,
    sq: `Ti je Olive AI, asistenti zyrtar i Olive Medical Center. Përgjigju në mënyrë profesionale dhe qartë në shqip. Ndihmo përdoruesin me informacion të saktë sipas kontekstit mjekësor.`,
    sr: `Vi ste Olive AI, zvanični asistent Olive Medical Center-a. Odgovarajte jasno i profesionalno na srpskom jeziku, pružajući korisne informacije pacijentima.`
  };
  const selectedPrompt = prompts[lang] || prompts["en"];
  if (!prompts[lang]) {
    console.log(`[DEBUG] Language "${lang}" not found in system prompts, falling back to "en".`);
  }
  return selectedPrompt;
}

// --- Load Knowledge Base (no changes needed here) ---
function loadKnowledgeBase() {
  try {
    const knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, "utf-8"));
    return knowledgeBase || [];
  } catch (err) {
    console.error("❌ Error reading aiEntries.json:", err);
    return [];
  }
}

// --- Match Relevant Entries (no changes needed here) ---
function findRelevantKnowledge(userInput, maxResults = 3) {
  const knowledgeBase = loadKnowledgeBase();
  // ... (rest of the function is unchanged)
  const words = userInput.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = knowledgeBase.map(entry => {
    const intentWords = entry.intent.split('_');
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
exports.askOpenAI = async (userInput, language) => {
  console.log(`[DEBUG] askOpenAI function started. Received language: "${language}"`);

  // Defensive check
  if (!language) {
    console.error('[DEBUG] FATAL: Language parameter was undefined or empty! Defaulting to "en".');
    language = 'en';
  }

  const systemPrompt = getSystemPrompt(language);
  const matchedKnowledge = findRelevantKnowledge(userInput);
  
  let prompt = `${systemPrompt}\n\n`;

  if (matchedKnowledge.length > 0) {
    console.log(`[DEBUG] Found ${matchedKnowledge.length} relevant knowledge entries.`);
    matchedKnowledge.forEach((entry, idx) => {
      console.log(`[DEBUG] Processing entry for intent "${entry.intent}". Checking for response in language "${language}".`);
      const response = entry.responses[language] || entry.responses["en"];
      if (!entry.responses[language]) {
         console.log(`[DEBUG] No response found for "${language}", falling back to "en" for this entry.`);
      }
      prompt += `KNOWN CONTEXT ${idx + 1}: "${response}"\n\n`;
    });
  } else {
    console.log("[DEBUG] No matched knowledge found.");
  }

  prompt += `User: ${userInput}\nOlive AI:`;

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
      })
    });

    const data = await response.json();
    return data.response?.trim() || "⚠️ AI nuk u përgjigj.";
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