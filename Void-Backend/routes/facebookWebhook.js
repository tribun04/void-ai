// routes/facebookWebhook.js - FINAL & CORRECTED

const express = require('express');
const router = express.Router();
const { askOpenAI } = require('../utils/openai');
const { sendFacebookMessage, sendTypingIndicator } = require('../utils/facebook');

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

// Translations remain unchanged, they are well-structured.
const translations = {
    sq: {
        help_message: "Komandat e disponueshme:\n\n- Për të folur me një këshilltar, shkruani `fol me agjent`.\n- Për të ndryshuar gjuhën në Anglisht, shkruani `talk in english`.\n- Për të ndryshuar gjuhën në Serbisht, shkruani `pricam na srpskom`.",
        invalid_choice: "Zgjedhje e pavlefshme. Ju lutem provoni përsëri duke dërguar 1, 2, ose 3.",
        connecting: "Ju lutem prisni një moment, po ju lidh me një këshilltar...",
        handoffKeywords: ["agjent real", "fol me agjent", "njeri real", "suport direkt", "keshilltar"],
    },
    en: {
        first_contact_welcome: "Hello and welcome to the Banka Ekonomike Virtual Assistant on Messenger! I'm here to help with your inquiries.\n\nFor a list of available commands, please type `help`.\n\nTo speak with a human advisor at any time, just ask to 'talk to an agent'.",
        help_message: "Available commands:\n\n- To speak with an advisor, type `fol me agjent`.\n- To switch the language to Albanian, type `fol shqip`.\n- To switch the language to Serbian, type `pricam na srpskom`.",
        invalid_choice: "Invalid choice. Please try again by sending 1, 2, or 3.",
        connecting: "Please wait a moment, I'm connecting you to a human agent...",
        handoffKeywords: ["real agent", "live agent", "human support", "speak to a person", "advisor", "agent"],
    },
    sr: {
        help_message: "Dostupne komande:\n\n- Da razgovarate sa savetnikom, ukucajte `fol me agjent`.\n- Da promenite jezik na Albanski, ukucajte `fol shqip`.\n- Da promenite jezik na Engleski, ukucajte `talk in english`.",
        invalid_choice: "Nevažeći izbor. Molimo pokušajte ponovo slanjem 1, 2 ili 3.",
        connecting: "Molimo sačekajte trenutak, povezujem vas sa savetnikom...",
        handoffKeywords: ["pravi agent", "ljudska podrska", "razgovor sa osobom", "ziva podrska", "savetnik"],
    }
};

const allHandoffKeywords = [
    ...translations.en.handoffKeywords,
    ...translations.sq.handoffKeywords,
    ...translations.sr.handoffKeywords
];

router.get('/webhook', (req, res) => {
    // This part is correct and remains unchanged
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ [Facebook Webhook] Verified');
            res.status(200).send(challenge);
        } else {
            console.error('❌ [Facebook Webhook] Verification failed: Tokens do not match.');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

router.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        const io = req.app.get('socketio');
        const activeConversations = req.app.get('activeConversations');
        const logMessage = req.app.get('logMessage');
        const usersAwaitingHelpLanguage = req.app.get('usersAwaitingHelpLanguage');
        const greetedFacebookUsers = req.app.get('greetedFacebookUsers');

        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            if (!webhookEvent.message || !webhookEvent.message.text) continue;

            const senderId = webhookEvent.sender.id;
            const messageText = webhookEvent.message.text;
            const lowerCaseText = messageText.toLowerCase().trim();
            const timestamp = new Date(webhookEvent.timestamp).toISOString();

            console.log(`💬 [Facebook] Received from ${senderId}: "${messageText}"`);
            logMessage(senderId, { from: 'user', text: messageText, timestamp });

            // --- PRIORITY 1: First Contact Welcome Logic ---
            if (!greetedFacebookUsers.has(senderId)) {
                greetedFacebookUsers.add(senderId);
                await sendFacebookMessage(senderId, translations.en.first_contact_welcome);
                console.log(`✅ [Facebook] Sent first-contact welcome to new user ${senderId}.`);
                continue; 
            }

            // --- PRIORITY 2: Check if user is in a session with a human agent ---
            // This part is correct. It sends the message to a specific agent's socket.
            if (activeConversations.has(senderId)) {
                const agentSocketId = activeConversations.get(senderId);
                if (agentSocketId) {
                    console.log(`[Facebook] Forwarding message from ${senderId} to agent ${agentSocketId}`);
                    // The event 'user-message' and its payload are correct for the ChatProvider.
                    io.to(agentSocketId).emit('user-message', { userId: senderId, message: messageText, channel: 'messenger' });
                }
                continue;
            }

            // --- PRIORITY 3: Help language selection ---
            if (usersAwaitingHelpLanguage.has(senderId)) {
                let chosenLang = null;
                if (lowerCaseText === '1' || lowerCaseText.includes('english')) chosenLang = 'en';
                else if (lowerCaseText === '2' || lowerCaseText.includes('shqip')) chosenLang = 'sq';
                else if (lowerCaseText === '3' || lowerCaseText.includes('srpski')) chosenLang = 'sr';

                usersAwaitingHelpLanguage.delete(senderId);

                if (chosenLang) await sendFacebookMessage(senderId, translations[chosenLang].help_message);
                else await sendFacebookMessage(senderId, translations['en'].invalid_choice);
                continue;
            }

            // --- PRIORITY 4: 'help' command ---
            if (lowerCaseText === 'help') {
                usersAwaitingHelpLanguage.add(senderId);
                const promptMessage = `Please select your preferred language for the help menu:\n(Ju lutemi zgjidhni gjuhën tuaj të preferuar për menynë e ndihmës:)\n(Molimo izaberite željeni jezik za meni pomoći:)\n\n*1.* English\n*2.* Shqip\n*3.* Srpski`;
                await sendFacebookMessage(senderId, promptMessage);
                continue;
            }
            
            // --- PRIORITY 5: Human handoff check ---
            if (allHandoffKeywords.some(keyword => lowerCaseText.includes(keyword))) {
    const newRequest = { 
        userId: senderId, 
        message: messageText,
        timestamp, 
        channel: 'messenger'
    };

    // ADD THIS LOG
    console.log("SERVER CHECKPOINT [A]: Webhook is about to EMIT 'agent-request' with data:", newRequest);

    io.emit('agent-request', newRequest);
                console.log(`[Facebook] Emitted 'agent-request' for user ${senderId} to all clients.`);

                logMessage(senderId, { type: 'event', event: 'agent-requested', message: messageText, timestamp, channel: 'messenger' });
                await sendFacebookMessage(senderId, translations['en'].connecting);
                continue;
            }
            
            // --- PRIORITY 6: Default to AI Reply ---
            try {
                await sendTypingIndicator(senderId, true);
                const aiReply = await askOpenAI(messageText, 'sq'); 
                logMessage(senderId, { from: 'ai', text: aiReply, timestamp: new Date().toISOString() });
                await sendFacebookMessage(senderId, aiReply);
            } catch (error) {
                console.error("❌ [AI Error] Could not get AI reply for Facebook:", error);
                await sendFacebookMessage(senderId, "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.");
            }
        }

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;