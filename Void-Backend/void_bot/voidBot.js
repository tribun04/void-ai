// In void_bot/voidBot.js
// --- FINAL CORRECTED VERSION ---

// =================================================================
// --- 1. CORE DEPENDENCIES ---
// =================================================================
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { io } = require("socket.io-client");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();

// =================================================================
// --- 2. INITIALIZATION & VALIDATION ---
// =================================================================

const tenantId = process.argv[2];
if (!tenantId) {
  console.error(
    "FATAL ERROR: A Tenant ID was not provided to the bot process. Exiting."
  );
  process.exit(1);
}

// THIS IS THE CRITICAL FIX FOR YOUR ENVIRONMENT
const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

if (!fs.existsSync(CHROME_PATH)) {
  console.error(`\n--- CRITICAL ERROR ---`);
  console.error(
    `Google Chrome engine could not be found at your specified path: ${CHROME_PATH}`
  );
  console.error(
    `The bot process has crashed. Please correct the CHROME_PATH in voidBot.js`
  );
  console.error(`----------------------\n`);
  process.exit(1);
}

function log(type, message) {
  process.stdout.write(`${type}::${message}\n`);
}

// =================================================================
// --- 3. LANGUAGE AND TRANSLATIONS CONFIGURATION ---
// =================================================================
const translations = {
  /* YOUR ENTIRE TRANSLATIONS OBJECT WAS CORRECT, IT GOES HERE */
  sq: {
    first_contact_welcome:
      "Përshëndetje! Keni kontaktuar Eleganca AI, asistentin virtual të Eleganca Store. Jam këtu t'ju ndihmoj me pyetjet rreth koleksioneve dhe porosive.\n\nPër një listë të komandave, shkruani `ndihme`.",
    help_message:
      "Komandat e disponueshme:\n\n- Për të folur me një këshilltar mode, shkruani `fol me agjent`.\n- Për të ndryshuar gjuhën në Anglisht, shkruani `talk in english`.\n- Për të ndryshuar gjuhën në Serbisht, shkruani `pricam na srpskom`.\n- Për të shkarkuar bisedën, shkruani `shkarko biseden`.",
    lang_switched:
      "Në rregull, gjuha është ndryshuar në Shqip. Si mund t'ju ndihmoj?",
    connecting:
      "Ju lutem prisni një moment, po ju lidh me një këshilltar mode...",
    agentJoined: (name) =>
      `Këshilltari i modës *${name}* i është bashkuar bisedës. Tani po flisni me një person real.`,
    chatEndedByAgent:
      "Biseda me këshilltarin ka përfunduar. Nëse keni pyetje të tjera, jam në dispozicion.\n\nPër të shkarkuar transkriptin, shkruani `shkarko biseden`.",
    transcript_generating:
      "Po përgatis transkriptin e bisedës suaj si PDF. Kjo mund të zgjasë pak...",
    transcript_caption: "Këtu është transkripti i bisedës suaj.",
    error:
      "Më vjen keq, ka një problem teknik. Ju lutem provoni përsëri më vonë.",
    file_error:
      "Më vjen keq, ndodhi një gabim gjatë dërgimit të skedarit tuaj.",
    invalid_choice:
      "Zgjedhje e pavlefshme. Ju lutem provoni përsëri duke dërguar 1, 2, ose 3.",
    handoffKeywords: [
      "agjent",
      "fol me agjent",
      "njeri real",
      "suport direkt",
      "keshilltar",
      "stilist",
      "ndihme personale",
    ],
    downloadKeywords: [
      "shkarko biseden",
      "merr biseden",
      "download chat",
      "download transcript",
    ],
  },
  en: {
    first_contact_welcome:
      "Hello! You have reached Eleganca AI, the official assistant for Eleganca Store. I'm here to help with your inquiries about our collections and orders.\n\nFor a list of available commands, please type `help`.",
    help_message:
      "Available commands:\n\n- To speak with a fashion advisor, type `live agent`.\n- To switch the language to Albanian, type `fol shqip`.\n- To switch the language to Serbian, type `pricam na srpskom`.\n- To download the conversation, type `download transcript`.",
    lang_switched:
      "Okay, the language has been switched to English. How can I help you?",
    connecting:
      "Please wait a moment, I'm connecting you to a fashion advisor...",
    agentJoined: (name) =>
      `Fashion Advisor *${name}* has joined the chat. You are now speaking with a real person.`,
    chatEndedByAgent:
      "The chat with the advisor has ended. If you have any other questions, I'm here to help.\n\nTo download a transcript of this conversation, type `download transcript`.",
    transcript_generating:
      "Generating your chat transcript as a PDF. Please wait a moment...",
    transcript_caption: "Here is your chat transcript.",
    error: "I'm sorry, there is a technical issue. Please try again later.",
    file_error: "I'm sorry, there was an error sending your transcript file.",
    invalid_choice: "Invalid choice. Please try again by sending 1, 2, or 3.",
    handoffKeywords: [
      "real agent",
      "live agent",
      "human support",
      "speak to a person",
      "agent",
      "stylist",
      "advisor",
      "personal shopper",
    ],
    downloadKeywords: [
      "download transcript",
      "download chat",
      "get transcript",
    ],
  },
  sr: {
    first_contact_welcome:
      "Dobar dan! Dobrodošli u Eleganca AI, zvaničnog asistenta Eleganca Store-a. Tu sam da vam pomognem sa vašim upitima o našim kolekcijama i porudžbinama.\n\nZa listu dostupnih komandi, ukucajte `pomoć`.",
    help_message:
      "Dostupne komande:\n\n- Da razgovarate sa modnim savetnikom, ukucajte `live agent`.\n- Da promenite jezik na Albanski, ukucajte `fol shqip`.\n- Da promenite jezik na Engleski, ukucajte `talk in english`.\n- Da preuzmete razgovor, ukucajte `preuzmi transkript`.",
    lang_switched:
      "U redu, jezik je promenjen na Srpski. Kako vam mogu pomoći?",
    connecting:
      "Molimo sačekajte trenutak, povezujem vas sa modnim savetnikom...",
    agentJoined: (name) =>
      `Modni savetnik *${name}* se pridružio razgovoru. Sada razgovarate sa stvarnom osobom.`,
    chatEndedByAgent:
      "Razgovor sa savetnikom je završen. Ako imate drugih pitanja, tu sam da pomognem.\n\nDa preuzmete transkript ovog razgovora, ukucajte `preuzmi transkript`.",
    transcript_generating:
      "Generišem transkript vašeg razgovora kao PDF. Molimo sačekajte...",
    transcript_caption: "Evo transkripta vašeg razgovora.",
    error:
      "Izvinite, došlo je do tehničkog problema. Molimo vas pokušajte ponovo kasnije.",
    file_error: "Žao mi je, došlo je do greške prilikom slanja vaše datoteke.",
    invalid_choice:
      "Nevažeći izbor. Molimo pokušajte ponovo slanjem 1, 2 ili 3.",
    handoffKeywords: [
      "agent",
      "ljudska podrska",
      "razgovor sa osobom",
      "ziva podrska",
      "savetnik",
      "stilista",
    ],
    downloadKeywords: [
      "preuzmi transkript",
      "preuzmi razgovor",
      "download transcript",
    ],
  },
};
const langSwitchCommands = {
  /* YOUR langSwitchCommands OBJECT WAS CORRECT, IT GOES HERE */
  "fol shqip": "sq",
  "flasim shqip": "sq",
  "kalo ne shqip": "sq",
  "talk in albanian": "sq",
  "fol anglisht": "en",
  "flasim anglisht": "en",
  "talk in english": "en",
  "speak english": "en",
  "switch to english": "en",
  "pricam srpski": "sr",
  "pricam na srpskom": "sr",
  "razgovor na srpskom": "sr",
  "talk in serbian": "sr",
};

// =================================================================
// --- 4. SOCKET.IO & STATE MANAGEMENT SETUP ---
// =================================================================

const socket = io("http://localhost:5000", { transports: ["websocket"] });

// ✅✅ THIS IS THE FIX ✅✅
// These variables were missing, causing the entire script to crash.
const humanSessions = new Map();
const userLanguagePrefs = new Map();
const greetedUsers = new Set();
const usersAwaitingHelpLanguage = new Set();

// =================================================================
// --- 5. WHATSAPP CLIENT SETUP ---
// =================================================================

log("STATUS", `Initializing WhatsApp client for Tenant: ${tenantId}`);

const client = new Client({
  // By removing 'authStrategy', we are telling it to not save the session.
  puppeteer: {
    headless: true, // Keep this false for testing
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    // We are also removing the conflicting 'userDataDir' line.
  },
});

// =================================================================
// --- 6. WHATSAPP & SOCKET EVENT HANDLERS ---
// =================================================================

socket.on("connect", () => {
  log("STATUS", "Bot has connected to the main server.");
  socket.emit("join-session", {
    sessionId: `whatsapp_bot_room_${tenantId}`,
    role: "bot",
  });
});

client.on("qr", (qr) => {
  log("QR_CODE", "QR Code generated.");
  socket.emit("qr_code", { qr });
});

client.on("ready", () => {
  log("STATUS", "WhatsApp Client is ready!");
  socket.emit("whatsapp_ready");
});

client.on("auth_failure", (msg) => log("ERROR", `AUTH FAILURE: ${msg}`));
client.on("disconnected", (reason) =>
  log("ERROR", `Client was logged out: ${reason}`)
);
client.on("error", (err) => log("ERROR", `Client Error: ${err.message}`));

// YOUR FULL MESSAGE HANDLER LOGIC - IT IS NOW SAFE TO USE
client.on("message", async (msg) => {
  if (msg.isGroupMsg) return;

  const from = msg.from;
  const text = msg.body;
  const lowerCaseText = text ? text.toLowerCase().trim() : "";

  if (humanSessions.has(from)) {
    socket.emit("forward-to-agent", { tenantId, userId: from, message: text });
    return;
  }

  if (msg.hasMedia && msg.type === "ptt") {
    const userLang = userLanguagePrefs.get(from) || "sq";
    log(
      "STATUS",
      `🎙️ Received voice message from ${from}. Processing in [${userLang}]`
    );
    try {
      const media = await msg.downloadMedia();
      if (!media || !media.data) throw new Error("Failed to download media.");
      const audioBuffer = Buffer.from(media.data, "base64");
      const form = new FormData();
      form.append("audio", audioBuffer, {
        filename: "user_voice.ogg",
        contentType: media.mimetype,
      });
      form.append("language", userLang);
      const response = await axios.post(
        "http://localhost:5000/api/voice",
        form,
        { headers: form.getHeaders(), responseType: "arraybuffer" }
      );
      const responseAudioBuffer = Buffer.from(response.data);
      if (responseAudioBuffer.length < 1000)
        throw new Error("AI voice response too short.");
      const responseMedia = new MessageMedia(
        "audio/ogg; codecs=opus",
        responseAudioBuffer.toString("base64"),
        "ai_response.ogg"
      );
      await client.sendMessage(from, responseMedia, { sendAudioAsVoice: true });
    } catch (error) {
      log(
        "ERROR",
        `❌ Error handling voice message: ${error.message || error}`
      );
      const errorLang = userLanguagePrefs.get(from) || "sq";
      await client.sendMessage(from, translations[errorLang].error);
    }
    return;
  }

  if (!greetedUsers.has(from)) {
    greetedUsers.add(from);
    userLanguagePrefs.set(from, "sq");
    await client.sendMessage(from, translations["en"].first_contact_welcome);
    return;
  }

  if (usersAwaitingHelpLanguage.has(from)) {
    let chosenLang = null;
    if (lowerCaseText === "1" || lowerCaseText.includes("english"))
      chosenLang = "en";
    else if (lowerCaseText === "2" || lowerCaseText.includes("shqip"))
      chosenLang = "sq";
    else if (lowerCaseText === "3" || lowerCaseText.includes("srpski"))
      chosenLang = "sr";
    usersAwaitingHelpLanguage.delete(from);
    if (chosenLang) {
      await client.sendMessage(from, translations[chosenLang].help_message);
    } else {
      const userLang = userLanguagePrefs.get(from) || "sq";
      await client.sendMessage(from, translations[userLang].invalid_choice);
    }
    return;
  }

  const userLang = userLanguagePrefs.get(from) || "sq";
  const t = translations[userLang];

  if (
    lowerCaseText === "help" ||
    lowerCaseText === "ndihme" ||
    lowerCaseText === "pomoć"
  ) {
    usersAwaitingHelpLanguage.add(from);
    await client.sendMessage(
      from,
      `Please select your preferred language:\n1. English\n2. Shqip\n3. Srpski`
    );
    return;
  }

  if (langSwitchCommands[lowerCaseText]) {
    const targetLang = langSwitchCommands[lowerCaseText];
    userLanguagePrefs.set(from, targetLang);
    await client.sendMessage(from, translations[targetLang].lang_switched);
    return;
  }

  if (t.handoffKeywords.some((k) => lowerCaseText.includes(k))) {
    await client.sendMessage(from, t.connecting);
    socket.emit("agent-request", {
      tenantId,
      userId: from,
      channel: "whatsapp",
      message: text,
      time: new Date().toISOString(),
    });
    return;
  }

  if (t.downloadKeywords.some((k) => lowerCaseText.includes(k))) {
    await client.sendMessage(from, t.transcript_generating);
    socket.emit("request-whatsapp-transcript", { tenantId, userId: from });
    return;
  }

  socket.emit(
    "get-ai-reply",
    { userInput: text, language: userLang },
    (response) => {
      if (response && response.reply) client.sendMessage(from, response.reply);
      else client.sendMessage(from, t.error);
    }
  );
});

socket.on("agent-reply", ({ userId, message }) =>
  client.sendMessage(userId, message)
);
socket.on("agent-linked", ({ userId, agentSocketId }) =>
  humanSessions.set(userId, agentSocketId)
);
socket.on("inform-user-agent-joined", ({ userId, agentName }) =>
  client.sendMessage(
    userId,
    translations[userLanguagePrefs.get(userId) || "sq"].agentJoined(agentName)
  )
);
socket.on("chat-ended-by-agent", ({ userId }) => {
  humanSessions.delete(userId);
  client.sendMessage(
    userId,
    translations[userLanguagePrefs.get(userId) || "sq"].chatEndedByAgent
  );
});
socket.on("send-file-to-user", async ({ userId, filePath }) => {
  const t = translations[userLanguagePrefs.get(userId) || "sq"];
  try {
    const media = MessageMedia.fromFilePath(filePath);
    await client.sendMessage(userId, media, { caption: t.transcript_caption });
  } catch (error) {
    await client.sendMessage(userId, t.file_error);
  }
});

// =================================================================
// --- 7. START THE BOT ---
// =================================================================

log("STATUS", "Attempting to initialize the WhatsApp client...");
client.initialize().catch((err) => {
  console.error(`\n--- FATAL INITIALIZATION ERROR ---\n`, err);
  process.exit(1);
});
