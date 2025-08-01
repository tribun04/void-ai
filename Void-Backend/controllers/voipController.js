const { VoiceResponse } = require('twilio').twiml;
const axios = require('axios');
const FormData = require('form-data');

// --- Import the knowledge base logic from your openai.js util ---
const { findRelevantKnowledge, getSystemPrompt } = require('../utils/openai.js');


// =================================================================
// ADAPTER PATTERN: Translators for each VOIP Provider
// (This section is correct and remains unchanged)
// =================================================================
const voipAdapters = {
    twilio: {
        parse: (message) => JSON.parse(message),
        getAudio: (msg) => Buffer.from(msg.media.payload, 'base64'),
        format: (chunk, streamSid) => JSON.stringify({ event: 'media', streamSid, media: { payload: chunk.toString('base64') } }),
        formatMark: (streamSid) => JSON.stringify({ event: 'mark', streamSid, mark: { name: 'ai_response_finished' } }),
    },
    signalwire: {
        parse: (message) => JSON.parse(message),
        getAudio: (msg) => Buffer.from(msg.media.payload, 'base64'),
        format: (chunk, streamSid) => JSON.stringify({ event: 'media', streamSid, media: { payload: chunk.toString('base64') } }),
        formatMark: (streamSid) => JSON.stringify({ event: 'mark', streamSid, mark: { name: 'ai_response_finished' } }),
    },
    vonage: {
        parse: (message) => ({ event: 'media' }),
        getAudio: (msg, originalMessage) => originalMessage,
        format: (chunk) => chunk,
        formatMark: () => null,
    },
    plivo: {
        parse: (message) => JSON.parse(message),
        getAudio: (msg) => Buffer.from(msg.audio, 'base64'),
        format: (chunk, streamSid) => JSON.stringify({ event: 'play_audio', streamUuid: streamSid, audio: { payload: chunk.toString('base64') } }),
        formatMark: () => null,
    },
    telnyx: {
        parse: (message) => JSON.parse(message),
        getAudio: (msg) => Buffer.from(msg.media.payload, 'base64'),
        format: (chunk, streamId) => JSON.stringify({ command: 'stream_audio', stream_id: streamId, payload: chunk.toString('base64') }),
        formatMark: () => null,
    },
};

// =================================================================
// HANDSHAKE HANDLERS: The "Front Doors" for each provider
// ✅ --- This section is now fixed and simplified ---
// =================================================================

const handleTwilioCall = (req, res) => {
    const wssUrl = `wss://${req.headers.host}/api/voip/stream/twilio`;
    const twiml = new VoiceResponse();
    twiml.say('Hello, connecting you to the VOID AI Assistant.');
    const connect = twiml.connect();
    connect.stream({ url: wssUrl }); 
    res.type('text/xml').send(twiml.toString());
};

const handleSignalWireCall = (req, res) => {
    const wssUrl = `wss://${req.headers.host}/api/voip/stream/signalwire`;
    const laml = new VoiceResponse();
    laml.say('Hello, connecting you to the VOID AI Assistant.');
    const connect = laml.connect();
    connect.stream({ url: wssUrl });
    res.type('text/xml').send(laml.toString());
};

const handleVonageCall = (req, res) => {
    const wssUrl = `wss://${req.headers.host}/api/voip/stream/vonage`;
    const ncco = [
        { action: 'talk', text: 'Hello, connecting you to the VOID AI Assistant.' },
        { action: 'connect', endpoint: [{ type: 'websocket', uri: wssUrl, 'content-type': 'audio/l16;rate=16000' }] }
    ];
    res.status(200).json(ncco);
};

const handlePlivoCall = (req, res) => {
    const wssUrl = `wss://${req.headers.host}/api/voip/stream/plivo`;
    const response = new VoiceResponse();
    response.say('Hello, connecting you to the VOID AI Assistant.');
    const connect = response.connect();
    connect.stream({ url: wssUrl });
    res.type('text/xml').send(response.toString());
};

const handleTelnyxCall = (req, res) => {
    const wssUrl = `wss://${req.headers.host}/api/voip/stream/telnyx`;
    const commands = [
      { command: "answer" },
      { command: "speak", payload: "Hello, connecting you to the VOID AI Assistant.", voice: "en-US-Wavenet-D" },
      { command: "stream_start", stream_url: wssUrl }
    ];
    res.status(200).json({ commands });
};


// =================================================================
// THE BRAIN: Generic Real-Time Conversation Handler
// =================================================================
const handleLiveConversation = (ws, providerName, streamId) => {
    console.log(`-> New conversation handler created for provider: ${providerName}`);
    
    const adapter = voipAdapters[providerName];
    if (!adapter) {
        console.error(`❌ Unknown provider: ${providerName}. Closing connection.`);
        return ws.close();
    }

    let audioBuffer = [];
    let silenceTimer = null;
    let isAIResponding = false;
    const SILENCE_THRESHOLD = 700;

    const processAudioAndRespond = async () => {
        if (isAIResponding) return;
        isAIResponding = true;
        const audioPayload = Buffer.concat(audioBuffer);
        audioBuffer = [];

        if (audioPayload.length < 1024) {
            isAIResponding = false;
            return;
        }

        try {
            // === STEP 1: Transcribe audio to text ===
            const form = new FormData();
            form.append('file', audioPayload, { filename: 'user_speech.raw' });
            form.append('model', 'whisper-1');
            const whisperResponse = await axios.post("https://api.openai.com/v1/audio/transcriptions", form, { headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
            const userPrompt = whisperResponse.data.text;
            console.log(`[${providerName}] User said: "${userPrompt}"`);
            
            // === STEP 2: Use your knowledge base logic ===
            const relevantKnowledge = findRelevantKnowledge(userPrompt);
            const systemPrompt = getSystemPrompt('en'); 
            const messages = [{ role: "system", content: systemPrompt }];

            if (relevantKnowledge) {
                const responseInLanguage = relevantKnowledge.responses['en'] || Object.values(relevantKnowledge.responses)[0];
                const contextMessage = `INTERNAL KNOWLEDGE CONTEXT: A user is asking about '${relevantKnowledge.intent}'. Respond clearly and naturally using the following information: "${responseInLanguage}"`;
                messages.push({ role: "system", name: "internal_context", content: contextMessage });
                console.log(`🧠 Knowledge Found! Intent: ${relevantKnowledge.intent}`);
            } else {
                console.log("No specific internal knowledge found. Relying on general AI capabilities.");
            }

            messages.push({ role: "user", content: userPrompt });
            
            // === STEP 3: Get AI completion ===
            const completionResponse = await axios.post("https://api.openai.com/v1/chat/completions", 
                { model: "gpt-4o", messages: messages, temperature: 0.5 }, 
                { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" } }
            );
            const aiReply = completionResponse.data.choices[0].message.content;
            console.log(`[${providerName}] AI will say: "${aiReply}"`);

            // === STEP 4: Stream TTS response using the adapter ===
            const ttsResponse = await axios.post("https://api.openai.com/v1/audio/speech", { model: "tts-1", input: aiReply, voice: "nova" }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, responseType: 'stream' });

            ttsResponse.data.on('data', (chunk) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(adapter.format(chunk, streamId));
                }
            });

            ttsResponse.data.on('end', () => {
                const markMessage = adapter.formatMark(streamId);
                if (markMessage && ws.readyState === ws.OPEN) {
                    ws.send(markMessage);
                }
                console.log(`✅ [${providerName}] Finished streaming AI response.`);
                isAIResponding = false;
            });
        } catch (err) {
            const errorMessage = err.response?.data?.error?.message || err.message;
            console.error(`❌ [${providerName}] Error in AI pipeline:`, errorMessage);
            isAIResponding = false;
        }
    };

    // --- WebSocket Message Listeners ---
    ws.on('message', (message) => {
        try {
            const msg = adapter.parse(message);
            if (msg.event === 'start' && msg.streamSid) { streamId = msg.streamSid; }
            if (msg.event === 'media' || Buffer.isBuffer(message)) {
                clearTimeout(silenceTimer);
                const audioChunk = adapter.getAudio(msg, message);
                audioBuffer.push(audioChunk);
                silenceTimer = setTimeout(processAudioAndRespond, SILENCE_THRESHOLD);
            }
        } catch (parseError) {
            // This can happen if a non-audio message is received. We can safely ignore it.
        }
    });

    ws.on('close', () => console.log(`-> [${providerName}] WebSocket connection closed.`));
    ws.on('error', (err) => console.error(`-> [${providerName}] WebSocket error:`, err));
};

module.exports = {
    handleTwilioCall,
    handleSignalWireCall,
    handleVonageCall,
    handlePlivoCall,
    handleTelnyxCall,
    handleLiveConversation,
};