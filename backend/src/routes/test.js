// src/routes/test.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.ahallaby@gmail.com,
        pass: process.env.rckhyqgnpjrjfgok
    }
});

// Test email endpoint
router.post('/email', async (req, res) => {
    try {
        // Send test email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sending to yourself for testing
            subject: 'Solar Calculator Test Email',
            html: `
                <h1>Test Email</h1>
                <p>This is a test email from your Solar Calculator application.</p>
                <p>If you received this, your email configuration is working correctly!</p>
                <p>Time sent: ${new Date().toLocaleString()}</p>
            `
        });

        res.json({ success: true, message: 'Test email sent successfully!' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;