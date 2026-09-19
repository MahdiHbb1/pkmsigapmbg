const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');

// POST /api/readings - Receive sensor data from ESP32
router.post('/', async (req, res) => {
  try {
    const {
      device_id,
      timestamp,
      mq135_mean, mq135_std, mq135_slope,
      mq136_mean, mq136_std, mq136_slope,
      temp_mean, humidity_mean,
      prediction,
      confidence
    } = req.body;

    // Validate required fields
    if (!device_id || !timestamp || !prediction) {
      return res.status(400).json({ 
        error: 'Missing required fields: device_id, timestamp, prediction' 
      });
    }

    // Validate prediction enum
    const validPredictions = ['Layak', 'Perlu Diperiksa', 'Tidak Layak'];
    if (!validPredictions.includes(prediction)) {
      return res.status(400).json({ 
        error: `Invalid prediction value. Must be one of: ${validPredictions.join(', ')}` 
      });
    }

    // Validate sensor values (must be numbers if provided)
    const sensorValues = [
      mq135_mean, mq135_std, mq135_slope,
      mq136_mean, mq136_std, mq136_slope,
      temp_mean, humidity_mean
    ];
    
    for (let val of sensorValues) {
      if (val !== undefined && val !== null && typeof val !== 'number') {
        return res.status(400).json({ 
          error: 'Sensor values must be numbers' 
        });
      }
    }

    // Parse timestamp
    const reading_timestamp = new Date(timestamp);
    if (isNaN(reading_timestamp.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid timestamp format. Use ISO 8601 (e.g., 2026-09-19T10:15:00Z)' 
      });
    }

    // Auto-create device if not exists
    const [existingDevice] = await pool.query(
      'SELECT device_id FROM devices WHERE device_id = ?',
      [device_id]
    );

    if (existingDevice.length === 0) {
      await pool.query(
        'INSERT INTO devices (device_id, location_name) VALUES (?, ?)',
        [device_id, null]
      );
      console.log(`[DEVICE] Auto-created device: ${device_id}`);
    }

    // Insert reading
    const [result] = await pool.query(
      `INSERT INTO readings (
        device_id, reading_timestamp,
        mq135_mean, mq135_std, mq135_slope,
        mq136_mean, mq136_std, mq136_slope,
        temp_mean, humidity_mean,
        prediction, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        device_id, reading_timestamp,
        mq135_mean, mq135_std, mq135_slope,
        mq136_mean, mq136_std, mq136_slope,
        temp_mean, humidity_mean,
        prediction, confidence
      ]
    );

    console.log(`[READING] Stored reading from ${device_id}: ${prediction}`);

    res.status(201).json({
      success: true,
      id: result.insertId,
      device_id,
      prediction
    });

  } catch (error) {
    console.error('[ERROR] POST /api/readings:', error);
    res.status(500).json({ error: 'Failed to store reading' });
  }
});

// GET /api/readings - Get all readings (for debugging)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const [rows] = await pool.query(
      'SELECT * FROM readings ORDER BY reading_timestamp DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error('[ERROR] GET /api/readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

module.exports = router;
