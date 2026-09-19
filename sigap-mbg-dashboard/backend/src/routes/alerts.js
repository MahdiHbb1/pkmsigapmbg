const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');

// GET /api/alerts - Get critical readings (Perlu Diperiksa or Tidak Layak)
router.get('/', async (req, res) => {
  try {
    const status = req.query.status; // optional filter
    const limit = parseInt(req.query.limit) || 50;
    const since = req.query.since; // optional datetime filter

    let query = `
      SELECT 
        r.*,
        d.location_name
      FROM readings r
      JOIN devices d ON r.device_id = d.device_id
      WHERE r.prediction IN ('Perlu Diperiksa', 'Tidak Layak')
    `;

    const params = [];

    // Add status filter if provided
    if (status) {
      const validStatuses = ['Perlu Diperiksa', 'Tidak Layak', 'Layak'];
      if (validStatuses.includes(status)) {
        query += ` AND r.prediction = ?`;
        params.push(status);
      }
    }

    // Add time filter if provided
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        query += ` AND r.reading_timestamp >= ?`;
        params.push(sinceDate);
      }
    }

    query += ` ORDER BY r.reading_timestamp DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('[ERROR] GET /api/alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
