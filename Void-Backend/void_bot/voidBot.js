const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { io } = require("socket.io-client");
const { startVoiceSession } = require('./voiceHandler'); 
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// A structured logging function to communicate with the main server
function log(type, message) {
    console.log(`${type}::${message}`);
}

// --- Multi-Lingual Configuration for VOID AI Assistant by Shigjeta LLC ---
const translations = {
   
  "sq": {
    "first_contact_welcome": "Përshëndetje! Keni kontaktuar Eleganca AI, asistentin virtual të Eleganca Store. Jam këtu t'ju ndihmoj me pyetjet rreth koleksioneve dhe porosive.\n\nPër një listë të komandave, shkruani `ndihme`.",
    "help_message": "Komandat e disponueshme:\n\n- Për të folur me një këshilltar mode, shkruani `fol me agjent`.\n- Për të ndryshuar gjuhën në Anglisht, shkruani `talk in english`.\n- Për të ndryshuar gjuhën në Serbisht, shkruani `pricam na srpskom`.\n- Për të shkarkuar bisedën, shkruani `shkarko biseden`.",
    "lang_switched": "Në rregull, gjuha është ndryshuar në Shqip. Si mund t'ju ndihmoj?",
    "connecting": "Ju lutem prisni një moment, po ju lidh me një këshilltar mode...",
    "agentJoined": (name) => `Këshilltari i modës *${name}* i është bashkuar bisedës. Tani po flisni me një person real.`,
    "chatEndedByAgent": "Biseda me këshilltarin ka përfunduar. Nëse keni pyetje të tjera, jam në dispozicion.\n\nPër të shkarkuar transkriptin, shkruani `shkarko biseden`.",
    "transcript_generating": "Po përgatis transkriptin e bisedës suaj si PDF. Kjo mund të zgjasë pak...",
    "transcript_caption": "Këtu është transkripti i bisedës suaj.",
    "error": "Më vjen keq, ka një problem teknik. Ju lutem provoni përsëri më vonë.",
    "file_error": "Më vjen keq, ndodhi një gabim gjatë dërgimit të skedarit tuaj.",
    "invalid_choice": "Zgjedhje e pavlefshme. Ju lutem provoni përsëri duke dërguar 1, 2, ose 3.",
    "handoffKeywords": ["agjent", "fol me agjent", "njeri real", "suport direkt", "keshilltar", "stilist", "ndihme personale"],
    "downloadKeywords": ["shkarko biseden", "merr biseden", "download chat", "download transcript"]
  },
  "en": {
    "first_contact_welcome": "Hello! You have reached Eleganca AI, the official assistant for Eleganca Store. I'm here to help with your inquiries about our collections and orders.\n\nFor a list of available commands, please type `help`.",
    "help_message": "Available commands:\n\n- To speak with a fashion advisor, type `live agent`.\n- To switch the language to Albanian, type `fol shqip`.\n- To switch the language to Serbian, type `pricam na srpskom`.\n- To download the conversation, type `download transcript`.",
    "lang_switched": "Okay, the language has been switched to English. How can I help you?",
    "connecting": "Please wait a moment, I'm connecting you to a fashion advisor...",
    "agentJoined": (name) => `Fashion Advisor *${name}* has joined the chat. You are now speaking with a real person.`,
    "chatEndedByAgent": "The chat with the advisor has ended. If you have any other questions, I'm here to help.\n\nTo download a transcript of this conversation, type `download transcript`.",
    "transcript_generating": "Generating your chat transcript as a PDF. Please wait a moment...",
    "transcript_caption": "Here is your chat transcript.",
    "error": "I'm sorry, there is a technical issue. Please try again later.",
    "file_error": "I'm sorry, there was an error sending your transcript file.",
    "invalid_choice": "Invalid choice. Please try again by sending 1, 2, or 3.",
    "handoffKeywords": ["real agent", "live agent", "human support", "speak to a person", "agent", "stylist", "advisor", "personal shopper"],
    "downloadKeywords": ["download transcript", "download chat", "get transcript"]
  },
  "sr": {
    "first_contact_welcome": "Dobar dan! Dobrodošli u Eleganca AI, zvaničnog asistenta Eleganca Store-a. Tu sam da vam pomognem sa vašim upitima o našim kolekcijama i porudžbinama.\n\nZa listu dostupnih komandi, ukucajte `pomoć`.",
    "help_message": "Dostupne komande:\n\n- Da razgovarate sa modnim savetnikom, ukucajte `live agent`.\n- Da promenite jezik na Albanski, ukucajte `fol shqip`.\n- Da promenite jezik na Engleski, ukucajte `talk in english`.\n- Da preuzmete razgovor, ukucajte `preuzmi transkript`.",
    "lang_switched": "U redu, jezik je promenjen na Srpski. Kako vam mogu pomoći?",
    "connecting": "Molimo sačekajte trenutak, povezujem vas sa modnim savetnikom...",
    "agentJoined": (name) => `Modni savetnik *${name}* se pridružio razgovoru. Sada razgovarate sa stvarnom osobom.`,
    "chatEndedByAgent": "Razgovor sa savetnikom je završen. Ako imate drugih pitanja, tu sam da pomognem.\n\nDa preuzmete transkript ovog razgovora, ukucajte `preuzmi transkript`.",
    "transcript_generating": "Generišem transkript vašeg razgovora kao PDF. Molimo sačekajte...",
    "transcript_caption": "Evo transkripta vašeg razgovora.",
    "error": "Izvinite, došlo je do tehničkog problema. Molimo vas pokušajte ponovo kasnije.",
    "file_error": "Žao mi je, došlo je do greške prilikom slanja vaše datoteke.",
    "invalid_choice": "Nevažeći izbor. Molimo pokušajte ponovo slanjem 1, 2 ili 3.",
    "handoffKeywords": ["agent", "ljudska podrska", "razgovor sa osobom", "ziva podrska", "savetnik", "stilista"],
    "downloadKeywords": ["preuzmi transkript", "preuzmi razgovor", "download transcript"]
  }

};

const langSwitchCommands = {
    'fol shqip': 'sq', 'flasim shqip': 'sq', 'kalo ne shqip': 'sq', 'talk in albanian': 'sq',
    'fol anglisht': 'en', 'flasim anglisht': 'en', 'talk in english': 'en', 'speak english': 'en', 'switch to english': 'en',
    'pricam srpski': 'sr', 'pricam na srpskom': 'sr', 'razgovor na srpskom': 'sr', 'talk in serbian': 'sr'
};

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  log('STATUS', 'Connected to backend via Socket.IO');
  socket.emit('join-session', { sessionId: 'whatsapp_bot_room', role: 'bot' });
});

const humanSessions = new Map();
const userLanguagePrefs = new Map();
const greetedUsers = new Set(); 
const usersAwaitingHelpLanguage = new Set();

log("STATUS", "Initializing WhatsApp client...");
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "shigjeta-llc-void-ai-session" }),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', (qr) => log('QR_CODE', qr));
client.on('ready', () => log('STATUS', 'VOID AI Assistant by Shigjeta LLC is ready and connected!'));
client.on('auth_failure', (msg) => log('ERROR', `Authentication Failed: ${msg}`));
client.on('disconnected', (reason) => log('STATUS', `Client was logged out: ${reason}`));

client.on('message', async (msg) => {
  if (msg.isGroupMsg) return;

  const from = msg.from;
  const text = msg.body;
  const lowerCaseText = text ? text.toLowerCase().trim() : '';

  if (humanSessions.has(from)) {
    socket.emit('forward-to-agent', { userId: from, message: text });
    return;
  }

  // --- VOICE MESSAGE HANDLER (PRIORITY 1.5) ---
  if (msg.hasMedia && msg.type === 'ptt') {
    // --- FIXED: Get the user's current language preference. Default to Albanian ('sq') if not found.
    const userLang = userLanguagePrefs.get(from) || 'sq';
    log('STATUS', `🎙️ Received voice message from ${from}. Processing in language: [${userLang}]`);

    try {
      const media = await msg.downloadMedia();
      if (!media || !media.data) {
        throw new Error("Failed to download media from WhatsApp.");
      }

      const audioBuffer = Buffer.from(media.data, 'base64');
      const form = new FormData();
      
      form.append('audio', audioBuffer, {
        filename: 'user_voice.ogg', // WhatsApp sends ogg files
        contentType: media.mimetype
      });

      // --- FIXED: Add the detected language to the form data. This is the key to the solution.
      form.append('language', userLang);

      log('STATUS', `📡 Sending to /api/voice for transcription + AI + TTS in [${userLang}]...`);

      // --- FIXED: The URL does not need a query parameter; the language is now in the form data body.
      const response = await axios.post('http://localhost:5000/api/voice', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer'
      });

      const responseAudioBuffer = Buffer.from(response.data);
      log('DEBUG', `✅ Received audio buffer: ${responseAudioBuffer.length} bytes`);

      if (responseAudioBuffer.length < 1000) {
        throw new Error("AI voice response too short — likely empty or invalid.");
      }

      const responseMedia = new MessageMedia(
        'audio/ogg; codecs=opus', // Ensure correct mimetype for WhatsApp voice notes
        responseAudioBuffer.toString('base64'),
        'ai_response.ogg'
      );

      await client.sendMessage(from, responseMedia, { sendAudioAsVoice: true });
      log('STATUS', `✅ Voice reply sent to ${from}.`);

    } catch (error) {
      log('ERROR', `❌ Error handling voice message: ${error.message || error}`);
      const errorLang = userLanguagePrefs.get(from) || 'sq'; // Use the same lang for the error message
      await client.sendMessage(from, translations[errorLang].error);
    }

    return;
  }

  // --- First Contact Welcome Logic ---
  if (!greetedUsers.has(from)) {
    greetedUsers.add(from);
    userLanguagePrefs.set(from, 'sq'); 
    await client.sendMessage(from, translations['en'].first_contact_welcome);
    log('STATUS', `Sent universal English welcome to new user ${from}.`);
    return;
  }
  
  // --- HELP LANGUAGE SELECTION LOGIC ---
  if (usersAwaitingHelpLanguage.has(from)) {
    let chosenLang = null;
    if (lowerCaseText === '1' || lowerCaseText.includes('english')) {
        chosenLang = 'en';
    } else if (lowerCaseText === '2' || lowerCaseText.includes('shqip') || lowerCaseText.includes('albanian')) {
        chosenLang = 'sq';
    } else if (lowerCaseText === '3' || lowerCaseText.includes('srpski') || lowerCaseText.includes('serbian')) {
        chosenLang = 'sr';
    }

    usersAwaitingHelpLanguage.delete(from);

    if (chosenLang) {
        await client.sendMessage(from, translations[chosenLang].help_message);
        log('STATUS', `Sent help message to ${from} in selected language: ${chosenLang}`);
    } else {
        const userLang = userLanguagePrefs.get(from) || 'sq';
        await client.sendMessage(from, translations[userLang].invalid_choice);
        log('STATUS', `User ${from} made an invalid help language selection.`);
    }
    return;
  }

  // --- Help Command ---
  if (lowerCaseText === 'help' || lowerCaseText === 'ndihme' || lowerCaseText === 'pomoć') {
      usersAwaitingHelpLanguage.add(from);
      const promptMessage = `Please select your preferred language for the help menu:\n(Ju lutemi zgjidhni gjuhën tuaj të preferuar për menynë e ndihmës:)\n(Molimo izaberite željeni jezik za meni pomoći:)\n\n*1.* English\n*2.* Shqip\n*3.* Srpski`;
      await client.sendMessage(from, promptMessage);
      log('STATUS', `Sent help language selection prompt to ${from}.`);
      return;
  }
  
  // --- Language Change Command ---
  if (langSwitchCommands[lowerCaseText]) {
    const targetLang = langSwitchCommands[lowerCaseText];
    userLanguagePrefs.set(from, targetLang);
    await client.sendMessage(from, translations[targetLang].lang_switched);
    log('STATUS', `User ${from} switched language to ${targetLang.toUpperCase()}`);
    return;
  }

  const userLang = userLanguagePrefs.get(from) || 'sq';
  const t = translations[userLang];
  
  // --- Handoff to Human Agent ---
  if (t.handoffKeywords.some(k => lowerCaseText.includes(k))) {
    await client.sendMessage(from, t.connecting);
    socket.emit('agent-request', { 
      userId: from, 
      channel: 'whatsapp',
      message: text,
      time: new Date().toISOString() 
    });
    return;
  }
  
  // --- Transcript Download Request ---
  if (t.downloadKeywords.some(k => lowerCaseText.includes(k))) {
      log('STATUS', `User ${from} requested a transcript download in ${userLang}.`);
      await client.sendMessage(from, t.transcript_generating);
      socket.emit('request-whatsapp-transcript', { userId: from });
      return;
  }

  // --- Get AI Text Reply (Default Fallback) ---
  log('STATUS', `Requesting AI text reply for: "${text}" in language: ${userLang}`);
  socket.emit('get-ai-reply', { userInput: text, language: userLang }, (response) => {
      if (response && response.reply) {
          client.sendMessage(from, response.reply);
      } else {
          log('ERROR', 'Received invalid or empty AI reply from server.');
          client.sendMessage(from, t.error);
      }
  });
});

// --- Socket.IO Event Handlers (no changes needed) ---
socket.on('agent-reply', async ({ userId, message }) => {
    try {
      await client.sendMessage(userId, message);
    } catch (err) {
      log("ERROR", `Failed to send WA reply: ${err.message}`);
    }
});

socket.on('agent-linked', ({ userId, agentSocketId }) => {
  if (userId.includes('@c.us')) {
      humanSessions.set(userId, agentSocketId);
      log('STATUS', `Agent linked to WhatsApp user ${userId}`);
  }
});

socket.on('inform-user-agent-joined', async ({ userId, agentName }) => {
    const userLang = userLanguagePrefs.get(userId) || 'sq';
    const message = translations[userLang].agentJoined(agentName);
    try {
        await client.sendMessage(userId, message);
    } catch (err) {
        log("ERROR", `Failed to send agent-joined message: ${err.message}`);
    }
});

socket.on('chat-ended-by-agent', async ({ userId }) => {
    if (humanSessions.has(userId)) {
        humanSessions.delete(userId);
        const userLang = userLanguagePrefs.get(userId) || 'sq';
        await client.sendMessage(userId, translations[userLang].chatEndedByAgent);
    }
});

socket.on('send-file-to-user', async ({ userId, filePath }) => {
    log('STATUS', `Received command to send file ${filePath} to ${userId}`);
    const userLang = userLanguagePrefs.get(userId) || 'sq';
    const t = translations[userLang];
    try {
        const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(userId, media, { caption: t.transcript_caption });
    } catch (error) {
        log('ERROR', `Failed to send file: ${error.message}`);
        await client.sendMessage(userId, t.file_error);
    }
});

client.initialize().catch(err => log("ERROR", `WA Init Error: ${err.message}`));