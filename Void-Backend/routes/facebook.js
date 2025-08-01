// routes/facebook.js - FINAL & FULLY CORRECTED with VOICE INTEGRATION

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data'); // <-- NEW: Required for sending audio files

// Your existing utility functions - make sure these paths are correct
const { askOpenAI } = require('../utils/openai');
const { sendFacebookMessage, sendTypingIndicator } = require('../utils/facebook');

// --- Configuration Setup ---
const CONFIG_FILE_PATH = path.join(__dirname, '../data/facebookConfig.json');
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'YOUR_SECRET_VERIFY_TOKEN';

// --- Helper Functions for Reading/Writing Config (These are correct) ---
async function readConfig() {
    try {
        await fs.access(CONFIG_FILE_PATH);
        const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { pageAccessToken: '', appSecret: '' };
    }
}
async function saveConfig(config) {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
}

// ===================================================================
//  API Endpoints for Admin Dashboard (This section is correct)
// ===================================================================
router.get('/config', async (req, res) => {
    try {
        const config = await readConfig();
        const callbackUrl = `https://${req.get('host')}/api/facebook/webhook`;
        const status = config && config.pageAccessToken ? 'active' : 'inactive';
        res.json({ callbackUrl, verifyToken: VERIFY_TOKEN, status });
    } catch (error) {
        console.error("❌ [Facebook Config] Error fetching configuration:", error);
        res.status(500).json({ message: 'Error fetching configuration.' });
    }
});
router.post('/activate', async (req, res) => {
    const { pageAccessToken, appSecret } = req.body;
    if (!pageAccessToken || !appSecret) {
        return res.status(400).json({ message: 'Both Page Access Token and App Secret are required.' });
    }
    try {
        await saveConfig({ pageAccessToken, appSecret });
        res.status(200).json({ message: 'Facebook integration activated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving configuration.' });
    }
});
router.post('/deactivate', async (req, res) => {
    try {
        await saveConfig({ pageAccessToken: '', appSecret: '' });
        res.status(200).json({ message: 'Facebook integration has been deactivated.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deactivating integration.' });
    }
});


// ===================================================================
//  Facebook Webhook Logic (CORRECTED with VOICE)
// ===================================================================

// Webhook verification (This is correct)
router.get('/webhook', (req, res) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ [Facebook Webhook] Verified');
        res.status(200).send(challenge);
    } else {
        console.error('❌ [Facebook Webhook] Verification failed. Make sure tokens match.');
        res.sendStatus(403);
    }
});

// Webhook for receiving ALL messages from Facebook
router.post('/webhook', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED'); // Acknowledge the request immediately

    const body = req.body;
    if (body.object !== 'page') return;

    // Get necessary tools from the main server app
    const io = req.app.get('socketio');
    const activeConversations = req.app.get('activeConversations');
    const logMessage = req.app.get('logMessage');
    const greetedFacebookUsers = req.app.get('greetedFacebookUsers');

    if (!io || !activeConversations || !logMessage) {
        return console.error("CRITICAL SERVER ERROR: 'socketio' or 'activeConversations' not set in server.js.");
    }

    try {
        const config = await readConfig();
        const pageAccessToken = config.pageAccessToken;

        if (!pageAccessToken) {
            return console.warn("⚠️ [Facebook Webhook] Received event but integration is inactive (no Page Access Token).");
        }
        
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            // Stop if there is no message content
            if (!webhookEvent.message) continue;

            const senderId = webhookEvent.sender.id;
            const timestamp = new Date(webhookEvent.timestamp).toISOString();
            
            // ========================================================
            // --- NEW: VOICE MESSAGE HANDLER ---
            // This block checks for audio attachments first.
            // ========================================================
            if (webhookEvent.message.attachments && webhookEvent.message.attachments[0].type === 'audio') {
                const audioUrl = webhookEvent.message.attachments[0].payload.url;
                console.log(`🎤 [Facebook] Received voice message from ${senderId}. URL: ${audioUrl}`);
                logMessage(senderId, { from: 'user', type: 'voice', url: audioUrl, timestamp });

                try {
                    // 1. Download the user's voice message from Facebook's URL
                    const userAudioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                    const userAudioBuffer = Buffer.from(userAudioResponse.data);

                    // 2. Send the audio to your internal AI voice service (same as WhatsApp bot)
                    const form = new FormData();
                    form.append('audio', userAudioBuffer, { filename: 'user_voice.mp4', contentType: 'audio/mp4' });

                    console.log(`[Facebook] Calling internal /api/voice endpoint for AI voice response...`);
                    const aiVoiceResponse = await axios.post('http://localhost:5000/api/voice', form, {
                        headers: form.getHeaders(),
                        responseType: 'arraybuffer'
                    });
                    const aiAudioBuffer = Buffer.from(aiVoiceResponse.data);

                    // 3. Prepare to send the AI's audio response back to the user via Facebook API
                    const fbUploadForm = new FormData();
                    fbUploadForm.append('recipient', JSON.stringify({ id: senderId }));
                    fbUploadForm.append('message', JSON.stringify({ attachment: { type: 'audio', payload: { is_reusable: false } } }));
                    fbUploadForm.append('filedata', aiAudioBuffer, { filename: 'ai_response.mp3', contentType: 'audio/mpeg' });

                    // 4. Upload and send the voice reply
                    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, fbUploadForm, {
                        headers: fbUploadForm.getHeaders(),
                    });
                    
                    console.log(`✅ [Facebook] Successfully sent voice reply to ${senderId}.`);
                    logMessage(senderId, { from: 'ai', type: 'voice', text: '[AI Voice Reply Sent]', timestamp: new Date().toISOString() });

                } catch (error) {
                    console.error("❌ [Facebook Voice Error] Failed to process voice message:", error.response?.data || error.message);
                    // Send a text-based error message if voice processing fails
                    await sendFacebookMessage(senderId, "I'm sorry, I had trouble understanding your voice message. Please try again.", pageAccessToken);
                }

                continue; // IMPORTANT: Stop processing this event further
            }


            // --- TEXT MESSAGE HANDLING ---
            // This part only runs if the message was NOT a voice message.
            if (!webhookEvent.message.text) continue;

            const messageText = webhookEvent.message.text;
            const lowerCaseText = messageText.toLowerCase().trim();
            console.log(`💬 [Facebook] Received text from ${senderId}: "${messageText}"`);
            logMessage(senderId, { from: 'user', text: messageText, timestamp });

            // Priority 1: Check if user is ALREADY talking to an agent
            if (activeConversations.has(senderId)) {
                const agentSocketId = activeConversations.get(senderId);
                io.to(agentSocketId).emit('user-message', { userId: senderId, message: messageText, channel: 'messenger' });
                continue;
            }

            // Priority 2: Check if the user is ASKING for an agent
            if (allHandoffKeywords.some(keyword => lowerCaseText.includes(keyword))) {
                const newRequest = { userId: senderId, message: messageText, timestamp, channel: 'messenger' };
                io.to('agents-pool').emit('agent-request', newRequest);
                console.log(`✅ [Facebook Handoff] Emitted 'agent-request' for user ${senderId} to 'agents-pool'.`);
                await sendFacebookMessage(senderId, translations['en'].connecting, pageAccessToken);
                continue;
            }

            // Priority 3: First-time welcome message
            if (!greetedFacebookUsers.has(senderId)) {
                greetedFacebookUsers.add(senderId);
                await sendFacebookMessage(senderId, translations.en.first_contact_welcome, pageAccessToken);
                continue;
            }

            // Priority 4: Default to AI text reply
            try {
                await sendTypingIndicator(senderId, true, pageAccessToken);
                const aiReply = await askOpenAI(messageText, 'sq'); 
                logMessage(senderId, { from: 'ai', text: aiReply, timestamp: new Date().toISOString() });
                await sendFacebookMessage(senderId, aiReply, pageAccessToken);
            } catch (error) {
                console.error("❌ [AI Error] Could not get AI text reply for Facebook:", error);
                await sendFacebookMessage(senderId, "I'm sorry, I'm having trouble connecting to my brain right now.", pageAccessToken);
            }
        }
    } catch (error) {
        console.error("❌ [Facebook Webhook] Critical error processing webhook:", error);
    }
});


// Translations and keywords must be defined for the webhook to use them
const translations = {
    sq: {
        connecting: "Ju lutem prisni një moment, po ju lidh me një këshilltar...",
        handoffKeywords: ["agjent real", "fol me agjent", "njeri real", "suport direkt", "keshilltar"],
    },
    en: {
        first_contact_welcome: "Hello and welcome to the Virtual Assistant on Messenger! I'm here to help with your inquiries.\n\nTo speak with a human advisor at any time, just ask to 'talk to an agent'.",
        connecting: "Please wait a moment, I'm connecting you to a human agent...",
        handoffKeywords: ["real agent", "live agent", "human support", "speak to a person", "advisor", "agent"],
    },
    sr: {
        connecting: "Molimo sačekajte trenutak, povezujem vas sa savetnikom...",
        handoffKeywords: ["pravi agent", "ljudska podrska", "razgovor sa osobom", "ziva podrska", "savetnik"],
    }
};

const allHandoffKeywords = [
    ...translations.en.handoffKeywords,
    ...translations.sq.handoffKeywords,
    ...translations.sr.handoffKeywords
];

module.exports = router;