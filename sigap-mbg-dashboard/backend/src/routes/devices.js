const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');

// GET /api/devices - List all devices with latest status
router.get('/', async (req, res) => {
  try {
    const [devices] = await pool.query(`
      SELECT 
        d.device_id,
        d.location_name,
        d.created_at,
        r.reading_timestamp,
        r.prediction,
        r.confidence,
        r.temp_mean,
        r.humidity_mean
      FROM devices d
      LEFT JOIN (
        SELECT device_id, reading_timestamp, prediction, confidence, temp_mean, humidity_mean
        FROM readings r1
        WHERE reading_timestamp = (
          SELECT MAX(reading_timestamp) 
          FROM readings r2 
          WHERE r2.device_id = r1.device_id
        )
      ) r ON d.device_id = r.device_id
      ORDER BY d.device_id
    `);

    res.json(devices);
  } catch (error) {
    console.error('[ERROR] GET /api/devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// GET /api/devices/:device_id/latest - Latest reading for one device
router.get('/:device_id/latest', async (req, res) => {
  try {
    const { device_id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        r.*,
        d.location_name
      FROM readings r
      JOIN devices d ON r.device_id = d.device_id
      WHERE r.device_id = ?
      ORDER BY r.reading_timestamp DESC
      LIMIT 1
    `, [device_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Device not found or no readings yet' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('[ERROR] GET /api/devices/:device_id/latest:', error);
    res.status(500).json({ error: 'Failed to fetch latest reading' });
  }
});

// GET /api/devices/:device_id/readings - Reading history for one device
router.get('/:device_id/readings', async (req, res) => {
  try {
    const { device_id } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const [rows] = await pool.query(`
      SELECT *
      FROM readings
      WHERE device_id = ?
      ORDER BY reading_timestamp DESC
      LIMIT ?
    `, [device_id, limit]);

    res.json(rows);
  } catch (error) {
    console.error('[ERROR] GET /api/devices/:device_id/readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

module.exports = router;
