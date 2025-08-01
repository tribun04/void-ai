const crypto = require('crypto-js');
const qs = require('qs');
const { Subscription } = require('../models'); // Your database model

// This function creates the secure signature for the payment request
function createPayseraSignature(data, password) {
    const base64Data = Buffer.from(data).toString('base64');
    // Replace '+' with '-' and '/' with '_' as required by Paysera
    const urlSafeBase64Data = base64Data.replace(/\+/g, '-').replace(/\//g, '_');
    
    const signature = crypto.MD5(urlSafeBase64Data + password).toString();
    return signature;
}

// This function creates the payment link
exports.createPayseraRequest = async (req, res) => {
    // Get the organizationId from the logged-in user's token
    const { organizationId } = req.user;

    // Find the subscription record to get a unique order ID
    const subscription = await Subscription.findOne({ where: { organizationId } });
    if (!subscription) {
        return res.status(404).json({ message: "Subscription record not found for this organization." });
    }

    const payseraBaseUrl = 'https://www.paysera.com/pay/';

    // Payment details
    const paymentParams = {
        projectid: process.env.PAYSERA_PROJECT_ID,
        orderid: subscription.id, // Use YOUR database ID as the unique order ID
        amount: '4900', // Amount in cents (e.g., 49.00 EUR -> 4900)
        currency: 'EUR',
        accepturl: `${process.env.YOUR_FRONTEND_URL}/dashboard?payment_success=true`,
        cancelurl: `${process.env.YOUR_FRONTEND_URL}/dashboard/billing`,
        callbackurl: `${process.env.YOUR_BACKEND_URL}/api/payments/paysera-callback`,
        test: '1', // Use '1' for testing, '0' for live payments
    };

    const dataString = qs.stringify(paymentParams);
    const sign = createPayseraSignature(dataString, process.env.PAYSERA_SIGN_PASSWORD);

    const fullRequestParams = { ...paymentParams, sign };
    const finalUrl = `${payseraBaseUrl}?${qs.stringify(fullRequestParams)}`;

    res.json({ url: finalUrl });
};


exports.handlePayseraCallback = async (req, res) => {
    const { data, ss1 } = req.query; // Paysera sends parameters in the query string

    if (!data || !ss1) {
        return res.status(400).send('Missing Paysera callback parameters.');
    }

    try {
        // SECURITY CHECK: Verify the signature to ensure the request is from Paysera
        const expectedSign = crypto.MD5(data + process.env.PAYSERA_SIGN_PASSWORD).toString();
        
        if (ss1 !== expectedSign) {
            console.error('CRITICAL: Invalid Paysera callback signature.');
            return res.status(403).send('Invalid signature.');
        }

        // Signature is valid, now process the payment
        const decodedData = Buffer.from(data, 'base64').toString('utf-8');
        const params = qs.parse(decodedData);
        
        const { orderid, status } = params;

        // Check if the payment was successful (status=1)
        if (status === '1') {
            // Find the subscription in YOUR database using the order ID
            await Subscription.update(
                { status: 'active' },
                { where: { id: orderid } }
            );
            console.log(`✅ Subscription activated for Order ID: ${orderid}`);
        } else {
            console.log(`ℹ️ Received non-successful payment status (${status}) for Order ID: ${orderid}`);
        }
        
        // Respond to Paysera to acknowledge receipt
        res.send('OK');

    } catch (error) {
        console.error('Error handling Paysera callback:', error);
        res.status(500).send('Internal Server Error');
    }
};