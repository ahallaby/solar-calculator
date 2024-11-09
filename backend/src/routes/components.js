// src/routes/components.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all solar panels
router.get('/panels', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM solar_panels WHERE is_active = true');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all batteries
router.get('/batteries', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM batteries WHERE is_active = true');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all inverters
router.get('/inverters', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM inverters WHERE is_active = true');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;