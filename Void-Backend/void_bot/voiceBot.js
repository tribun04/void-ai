const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

require("dotenv").config();

const router = express.Router();
const knowledgeBasePath = path.join(__dirname, "../data/aiEntries.json");
const uploadDir = "uploads/";

// The backend API for the language model
const LLM_API_URL = "https://voidsystem.shigjeta.com/api/generate";
const LLM_MODEL = "llama3:8b-instruct-q3_K_M";

// Load Knowledge Base
let knowledgeBase = [];
try {
  if (fs.existsSync(knowledgeBasePath)) {
    const content = fs.readFileSync(knowledgeBasePath, "utf-8");
    knowledgeBase = content ? JSON.parse(content) : [];
    console.log("✅ Knowledge base loaded for voice endpoint.");
  } else {
    fs.writeFileSync(knowledgeBasePath, JSON.stringify([], null, 2));
    console.log("📁 Created empty knowledge base for voice endpoint.");
  }
} catch (error) {
  console.error("❌ Failed to load aiEntries.json:", error);
}

// --- Professional, Multi-Lingual System Prompts ---
function getSystemPrompt(lang = "en") {
  const prompts = {
    sq: `Ti je Eleganca AI, një asistent virtual elegant, ndihmues dhe i ditur për Eleganca Store. Përgjigju qartë dhe me stil në gjuhën shqipe, në një mënyrë natyrale. ASNJËHERË mos proceso pagesa apo akseso të dhëna private të klientëve, si numrat e kartave të kreditit. Udhëzo përdoruesit te faqja e sigurt e pagesës për blerjet. Përdor informacionin nga KONTEKSTI vetëm nëse është i disponueshëm për t'iu përgjigjur pyetjes së përdoruesit.`,
    en: `You are Eleganca AI, a helpful, stylish, and knowledgeable virtual assistant for Eleganca Store. You must respond clearly and fashionably in English, in a natural conversational manner. NEVER process payments or access private customer data like credit card numbers. Guide users to the secure checkout page for all transactions. ONLY refer to internal knowledge from the CONTEXT if it is available to answer the user's question.`,
    sr: `Vi ste Eleganca AI, koristan, moderan i informisan virtuelni asistent za Eleganca Store. Morate odgovarati jasno i sa stilom na srpskom jeziku, na prirodan način. NIKADA nemojte obrađivati uplate ili pristupati privatnim podacima kupaca, kao što su brojevi kreditnih kartica. Uputite korisnike na sigurnu stranicu za plaćanje za sve transakcije. KORISTITE informacije iz KONTEKSTA samo ako su dostupne da odgovorite na pitanje korisnika.`
  };
  return prompts[lang] || prompts["en"];
}

// Simple intent matching function
function findRelevantKnowledge(userInput) {
  const words = userInput.toLowerCase().split(/\s+/).filter(Boolean);
  let bestMatch = null;
  let highestScore = 0;
  for (const entry of knowledgeBase) {
    const intentWords = entry.intent.split("_");
    let currentScore = 0;
    for (const word of words) {
      for (const iWord of intentWords) {
        if (word.length > 2 && iWord.length > 2 && (word.includes(iWord) || iWord.includes(word))) {
          currentScore++;
        }
      }
    }
    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestMatch = entry;
    }
  }
  return highestScore > 0 ? bestMatch : null;
}

// Prepare upload folder
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// === Main voice endpoint for Eleganca AI ===
router.post("/", upload.single("audio"), async (req, res) => {
  const language = req.body.language || 'sq';
  console.log(`[VOICE ENDPOINT] Received voice request. Target language for AI response is [${language}]`);

  if (!req.file) {
    return res.status(400).send("No audio file was uploaded.");
  }
  const audioPath = req.file.path;

  try {
    // --- Step 1: Transcription via Whisper ---
    const form = new FormData();
    form.append("file", fs.createReadStream(audioPath), { filename: req.file.originalname });
    form.append("model", "whisper-1");

    // --- CRITICAL FIX ---
    // The line `form.append("language", language);` has been removed.
    // The error log shows OpenAI's API does not accept "sq".
    // By removing this line, we allow Whisper to automatically detect the language from the audio, which it is very good at.
    // The `language` variable is still used later to ensure the AI *responds* in Albanian.

    console.log(`[VOICE ENDPOINT] Sending audio to Whisper for auto-detection and transcription...`);

    const whisperRes = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      { headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const userPrompt = whisperRes.data.text;
    console.log(`🎤 Transcribed User Input: "${userPrompt}"`);

    // --- Step 2: Build professional, language-specific prompt for LLaMA ---
    let systemPrompt = getSystemPrompt(language);

    const matchedKnowledge = findRelevantKnowledge(userPrompt);
    if (matchedKnowledge) {
      const info = matchedKnowledge.responses[language] || matchedKnowledge.responses["en"];
      systemPrompt += `\n\nCONTEXT: ${info}`;
      console.log(`🧠 Matched intent: ${matchedKnowledge.intent}. Using context for [${language}].`);
    }

    const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\nEleganca AI:`;
    console.log(`📝 Sending prompt to LLM for language [${language}]:\n---\n${fullPrompt}\n---`);

    // --- Step 3: Get AI text response ---
    const aiRes = await axios.post(LLM_API_URL, {
      model: LLM_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: { temperature: 0.35, top_p: 0.85, num_predict: 300 },
    });

    const aiReply = aiRes.data.response.trim();
    if (!aiReply) {
        throw new Error("LLM model returned an empty response.");
    }
    console.log(`🤖 Eleganca AI says: "${aiReply}"`);

    // --- Step 4: Convert AI text response to speech (TTS) ---
    console.log("🔊 Requesting audio from OpenAI TTS API...");
    const ttsRes = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        model: "tts-1-hd",
        input: aiReply,
        voice: "shimmer",
        response_format: "opus"
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        responseType: "stream",
      }
    );
    console.log("✅ Received audio stream from OpenAI.");

    // --- Step 5: Stream the audio back to the client ---
    res.setHeader("Content-Type", "audio/opus");
    ttsRes.data.pipe(res);

  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`❌ Eleganca  AI Voice Error: ${errorDetails}`);
    res.status(err.response?.status || 500).json({
      error: "An error occurred while processing your voice request.",
      details: err.response?.data || err.message,
    });
  } finally {
    // --- Step 6: Clean up the uploaded audio file ---
    fs.unlink(audioPath, (err) => {
      if (err) console.error("🧹 Failed to delete temporary audio file:", err);
    });
  }
});

module.exports = router;