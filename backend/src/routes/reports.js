// src/routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
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

// Generate and send report
router.post('/generate', async (req, res) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert user
        const userResult = await client.query(
            'INSERT INTO users (email, company_name, phone) VALUES ($1, $2, $3) RETURNING id',
            [req.body.email, req.body.company_name, req.body.phone]
        );
        
        // Save report
        const reportResult = await client.query(
            `INSERT INTO reports 
             (user_id, input_parameters, results, system_type, total_cost, system_size_kw, battery_capacity_kwh)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                userResult.rows[0].id,
                JSON.stringify(req.body.inputs),
                JSON.stringify(req.body.results),
                req.body.systemType,
                req.body.totalCost,
                req.body.systemSize,
                req.body.batteryCapacity
            ]
        );

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: 'Your Solar System Report',
            html: `
                <h1>Your Solar System Report</h1>
                <p>Dear ${req.body.company_name || 'Valued Customer'},</p>
                <p>Thank you for using our Solar Calculator. Please find your system details below:</p>
                <ul>
                    <li>System Size: ${req.body.systemSize} kW</li>
                    <li>Battery Capacity: ${req.body.batteryCapacity} kWh</li>
                    <li>Total Investment: R${req.body.totalCost}</li>
                </ul>
                <p>Please find your detailed report attached.</p>
                <p>Best regards,<br>Your Solar Team</p>
            `,
            attachments: [
                {   
                    filename: 'solar-report.pdf',
                    content: req.body.pdfContent // We'll implement PDF generation later
                }
            ]
        });

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            reportId: reportResult.rows[0].id 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Get analytics
router.get('/analytics', async (req, res) => {
    try {
        const monthly = await db.query('SELECT * FROM monthly_calculations LIMIT 12');
        const popular = await db.query('SELECT * FROM popular_configurations LIMIT 5');
        
        res.json({
            monthly: monthly.rows,
            popularConfigs: popular.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;