const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Load the Facebook config
const configPath = path.join(__dirname, '../data/facebookConfig.json');
const { pageAccessToken } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const FACEBOOK_API_URL = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;

async function sendTypingIndicator(recipientId, isTyping = true) {
    const action = isTyping ? 'typing_on' : 'typing_off';
    const requestBody = {
        recipient: { id: recipientId },
        sender_action: action,
    };

    try {
        await axios.post(FACEBOOK_API_URL, requestBody);
    } catch (error) {
        console.error("❌ [Facebook Action] Error sending typing indicator:", error.response?.data?.error);
    }
}

async function sendFacebookMessage(recipientId, messageText) {
    await sendTypingIndicator(recipientId, false);

    const messageData = {
        recipient: { id: recipientId },
        message: { text: messageText },
        messaging_type: 'RESPONSE'
    };

    try {
        await axios.post(FACEBOOK_API_URL, messageData);
        console.log(`✅ [Facebook Reply] Sent to ${recipientId}`);
    } catch (error) {
        console.error("❌ [Facebook Reply] Error sending message:", error.response?.data?.error);
    }
}

module.exports = { 
    sendFacebookMessage,
    sendTypingIndicator
};
