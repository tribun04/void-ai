// In utils/emailSender.js

const nodemailer = require('nodemailer');
const path = require('path');

// Load .env variables from the root of the project
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // false for port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log('✅ Nodemailer Transporter Configured.');

async function sendInvoiceEmail(toEmail, pdfBuffer, customerName) {
    const mailOptions = {
        from: `"Void AI Solutions" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Your Invoice from Void AI Solutions',
        html: `
            <p>Dear ${customerName},</p>
            <p>Thank you for creating an account with Void AI Solutions. We are excited to have you on board.</p>
            <p>Please find your initial invoice attached to this email. Your account will be fully activated by our team once payment has been confirmed.</p>
            <p>If you have any questions, please feel free to contact us.</p>
            <p>Best regards,<br>The Void AI Team</p>
        `,
        attachments: [
            {
                filename: 'Invoice-VoidAI.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Invoice email sent successfully to ${toEmail}`);
        return true;
    } catch (error) {
        console.error(`!!! FAILED to send invoice email to ${toEmail}:`, error);
        return false;
    }
}

async function sendWelcomeEmail (toEmail, apiKey) {
    const dashboardUrl = 'http://localhost:3000/dashboard';

    const mailOptions = {
        from: `"Void AI Solutions" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Welcome to Void AI! Your Account is Active',
        html: `
            <p>Hello,</p>
            <p>Great news! Your account with Void AI Solutions has been successfully activated. You can now start using our platform.</p>
            <p><strong>Your API Key is:</strong></p>
            <pre style="background-color:#f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace;">${apiKey}</pre>
            <p>Please keep this key secure, as it provides access to your account's resources.</p>
            <p>You can access your personal dashboard to view your token usage and manage your account here:</p>
            <a href="${dashboardUrl}" style="background-color:#16a085; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Go to Your Dashboard</a>
            <p><br>Thank you for choosing Void AI.</p>
            <p>Best regards,<br>The Void AI Team</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent successfully to ${toEmail}`);
        return true;
    } catch (error) {
        console.error(`!!! FAILED to send welcome email to ${toEmail}:`, error);
        return false;
    }
};

module.exports = { sendInvoiceEmail, sendWelcomeEmail };