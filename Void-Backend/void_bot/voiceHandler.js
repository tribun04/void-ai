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
    console.log("✅ Knowledge base loaded for voice bot.");
  } else {
    fs.writeFileSync(knowledgeBasePath, JSON.stringify([], null, 2));
    console.log("📁 Created empty knowledge base.");
  }
} catch (error) {
  console.error("❌ Failed to load aiEntries.json:", error);
}

// NEW: System Prompts for different languages, just like in the text chat.
function getSystemPrompt(lang = "en") {
 const prompts = {
  en: `You are Eleganca AI, a helpful, stylish, and professional virtual assistant for Eleganca Store. You must respond clearly and professionally in English. NEVER process payments or access private customer data.`,
  sq: `Ti je Eleganca AI, një asistent virtual elegant dhe profesional për Eleganca Store. Duhet t'i përgjigjesh qartë dhe me stil në gjuhën shqipe. ASNJËHERË mos proceso pagesa apo akseso të dhëna private të klientëve.`,
  sr: `Vi ste Eleganca AI, koristan i moderan virtuelni asistent za Eleganca Store. Morate odgovarati jasno i profesionalno na srpskom jeziku. NIKADA nemojte obrađivati uplate ili pristupati privatnim podacima kupaca.`
};
  return prompts[lang] || prompts["en"];
}

// Simple intent matching function (no changes needed here)
function findRelevantKnowledge(userInput) {
    // ... (your existing function is fine)
}

// Prepare upload folder
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// === Main voice endpoint for Eleganca AI ===
router.post("/", upload.single("audio"), async (req, res) => {
  // FIXED: Get language from the request body. Default to 'en' if not provided.
  const language = req.body.language || 'en';
  console.log(`[VOICE BOT] Received request for language: "${language}"`);

  if (!req.file) {
    return res.status(400).send("No audio file was uploaded.");
  }
  const audioPath = req.file.path;

  try {
    // --- Step 1: Transcription via Whisper ---
    const form = new FormData();
    form.append("file", fs.createReadStream(audioPath), { filename: req.file.originalname });
    form.append("model", "whisper-1");
    // FIXED: Provide the language hint to Whisper for better accuracy.
    form.append("language", language); 

    console.log(`[VOICE BOT] Sending audio to Whisper for transcription in [${language}]...`);
    
    const whisperRes = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const userPrompt = whisperRes.data.text;
    console.log(`🎤 Transcribed User Input: ${userPrompt}`);

    // --- Step 2: Build prompt for Elegnca  AI ---
    // FIXED: Use the new function to get the correct system prompt for the detected language.
    let systemPrompt = getSystemPrompt(language);
    
    const matchedKnowledge = findRelevantKnowledge(userPrompt);
    if (matchedKnowledge) {
      // FIXED: Select the correct response language from the knowledge base.
      const contextResponse = matchedKnowledge.responses[language] || matchedKnowledge.responses["en"];
      systemPrompt += `\n\nCONTEXT: The user is likely asking about '${matchedKnowledge.intent}'. Use the following information to respond: ${contextResponse}`;
      console.log(`🧠 Matched intent: ${matchedKnowledge.intent}`);
    }

    const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\nEleganca AI:`;
    console.log(`📝 Sending prompt to LLM in [${language}]:\n---\n${fullPrompt}\n---`);

    // --- Step 3: Get AI text response ---
    const aiRes = await axios.post(LLM_API_URL, {
      model: LLM_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: 0.35,
        top_p: 0.85,
        num_predict: 300,
      },
    });

    const aiReply = aiRes.data.response.trim();
    console.log(`🤖 Eleganca AI says: ${aiReply}`);

    // --- Step 4: Convert AI text response to speech (TTS) ---
    console.log("🔊 Requesting audio from OpenAI TTS API...");
    const ttsRes = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        model: "tts-1",
        input: aiReply,
        voice: "nova",
        response_format: "mp3"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        responseType: "stream",
      }
    );
    console.log("✅ Received audio stream from OpenAI.");

    // --- Step 5: Stream the audio back to the client ---
    res.setHeader("Content-Type", "audio/mpeg");
    ttsRes.data.pipe(res);

  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`❌ Eleganca AI Voice Error: ${errorDetails}`);
    res.status(err.response?.status || 500).json({
      error: "An error occurred while processing your request.",
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