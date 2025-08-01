const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Create a "transporter" object using the credentials from your .env file
// 1. Create a "transporter" object using the credentials from your .env file
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10), // Ensure port is a number
    secure: false, // ✅ ADD THIS LINE. True for 465, false for other ports.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends the welcome email to a new user after they sign up.
 * @param {string} toEmail - The recipient's email address.
 * @param {object} data - An object containing data for the email, like { companyName, activationCode }.
 */
const sendWelcomeEmail = async (toEmail, data) => {
    const { companyName, activationCode } = data;
    
    const subject = 'Welcome to Void AI! Please Complete Your Activation';
    const html = `
        <h1>Welcome, ${companyName}!</h1>
        <p>Thank you for signing up for our platform. Your account has been created and is now awaiting payment verification and activation.</p>
        <p><strong>Your Activation Reference Code is:</strong></p>
        <h2 style="color: #4F46E5; font-size: 24px;">${activationCode}</h2>
        <p>Please make the payment for your selected plan. Once payment is confirmed, a SuperAdmin will activate your account and you will receive another email with your API key.</p>
        <p>Thank you!</p>
    `;

    try {
        await transporter.sendMail({
            from: '"Void AI Platform" <no-reply@void.ai>',
            to: toEmail,
            subject: subject,
            html: html,
        });
        console.log(`✅ Welcome email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error(`❌ Error sending welcome email to ${toEmail}:`, error);
    }
};

/**
 * Sends the activation email after a SuperAdmin activates the tenant.
 * @param {string} toEmail - The recipient's email address.
 * @param {object} data - An object containing data, like { companyName, apiKey }.
 */
const sendActivationEmail = async (toEmail, data) => {
    const { companyName, apiKey } = data;

    const subject = 'Your Void AI Account Has Been Activated!';
    const html = `
        <h1>Congratulations, ${companyName}!</h1>
        <p>Your account has been successfully activated by our team.</p>
        <p>You can now use our services via the API. Your unique API key is:</p>
        <pre style="background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; font-family: monospace;"><code>${apiKey}</code></pre>
        <p>Please keep this key secure and do not share it.</p>
        <p>Thank you for joining the Void AI Platform!</p>
    `;

    try {
        await transporter.sendMail({
            from: '"Void AI Platform" <no-reply@void.ai>',
            to: toEmail,
            subject: subject,
            html: html,
        });
        console.log(`✅ Activation email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error(`❌ Error sending activation email to ${toEmail}:`, error);
    }
};

// Make the functions available to other files
module.exports = {
    sendWelcomeEmail,
    sendActivationEmail,
};