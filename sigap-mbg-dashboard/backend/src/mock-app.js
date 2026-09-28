const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage (替代 MySQL)
let devices = [
  {
    device_id: 'SIGAP-MBG-01',
    location_name: 'SPPG Universitas Negeri Semarang',
    reading_timestamp: null,
    prediction: null,
    confidence: null,
    temp_mean: null,
    humidity_mean: null
  }
];

let readings = [];
let readingIdCounter = 1;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../frontend/views'));

// API: POST /api/readings
app.post('/api/readings', (req, res) => {
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

    // Store reading
    const reading = {
      id: readingIdCounter++,
      device_id,
      reading_timestamp: timestamp,
      mq135_mean, mq135_std, mq135_slope,
      mq136_mean, mq136_std, mq136_slope,
      temp_mean, humidity_mean,
      prediction,
      confidence,
      created_at: new Date().toISOString()
    };
    
    readings.push(reading);

    // Update or create device
    const deviceIndex = devices.findIndex(d => d.device_id === device_id);
    if (deviceIndex >= 0) {
      devices[deviceIndex] = {
        device_id,
        location_name: devices[deviceIndex].location_name,
        reading_timestamp: timestamp,
        prediction,
        confidence,
        temp_mean,
        humidity_mean
      };
    } else {
      devices.push({
        device_id,
        location_name: null,
        reading_timestamp: timestamp,
        prediction,
        confidence,
        temp_mean,
        humidity_mean
      });
      console.log(`[DEVICE] Auto-created device: ${device_id}`);
    }

    console.log(`[READING] Stored reading from ${device_id}: ${prediction}`);

    res.status(201).json({
      success: true,
      id: reading.id,
      device_id,
      prediction
    });

  } catch (error) {
    console.error('[ERROR] POST /api/readings:', error);
    res.status(500).json({ error: 'Failed to store reading' });
  }
});

// API: GET /api/devices
app.get('/api/devices', (req, res) => {
  try {
    res.json(devices);
  } catch (error) {
    console.error('[ERROR] GET /api/devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// API: GET /api/devices/:device_id/latest
app.get('/api/devices/:device_id/latest', (req, res) => {
  try {
    const { device_id } = req.params;
    
    const deviceReadings = readings
      .filter(r => r.device_id === device_id)
      .sort((a, b) => new Date(b.reading_timestamp) - new Date(a.reading_timestamp));

    if (deviceReadings.length === 0) {
      return res.status(404).json({ error: 'Device not found or no readings yet' });
    }

    const device = devices.find(d => d.device_id === device_id);
    const latest = deviceReadings[0];
    
    res.json({
      ...latest,
      location_name: device ? device.location_name : null
    });

  } catch (error) {
    console.error('[ERROR] GET /api/devices/:device_id/latest:', error);
    res.status(500).json({ error: 'Failed to fetch latest reading' });
  }
});

// API: GET /api/devices/:device_id/readings
app.get('/api/devices/:device_id/readings', (req, res) => {
  try {
    const { device_id } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const deviceReadings = readings
      .filter(r => r.device_id === device_id)
      .sort((a, b) => new Date(b.reading_timestamp) - new Date(a.reading_timestamp))
      .slice(0, limit);

    res.json(deviceReadings);

  } catch (error) {
    console.error('[ERROR] GET /api/devices/:device_id/readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// API: GET /api/alerts
app.get('/api/alerts', (req, res) => {
  try {
    const { status, limit: limitParam } = req.query;
    const limit = parseInt(limitParam) || 50;

    let alertReadings = readings.filter(r => 
      r.prediction === 'Tidak Layak' || r.prediction === 'Perlu Diperiksa'
    );

    if (status) {
      alertReadings = alertReadings.filter(r => r.prediction === status);
    }

    alertReadings = alertReadings
      .sort((a, b) => new Date(b.reading_timestamp) - new Date(a.reading_timestamp))
      .slice(0, limit)
      .map(r => {
        const device = devices.find(d => d.device_id === r.device_id);
        return {
          ...r,
          location_name: device ? device.location_name : null
        };
      });

    res.json(alertReadings);

  } catch (error) {
    console.error('[ERROR] GET /api/alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Frontend routes
app.get('/', (req, res) => {
  res.redirect('/overview');
});

app.get('/overview', (req, res) => {
  res.render('overview', { title: 'Overview - SIGAP MBG' });
});

app.get('/device/:device_id', (req, res) => {
  res.render('device-detail', { 
    title: 'Device Detail - SIGAP MBG',
    device_id: req.params.device_id 
  });
});

app.get('/alerts', (req, res) => {
  res.render('alerts', { title: 'Alerts - SIGAP MBG' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`[SERVER] SIGAP MBG Dashboard (Mock Mode)`);
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  console.log(`[SERVER] Using in-memory database (no MySQL required)`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================');
  console.log('');
  console.log('📍 Access dashboard at:');
  console.log(`   http://localhost:${PORT}/overview`);
  console.log('');
  console.log('💡 This is a mock server for quick testing.');
  console.log('   Data will be lost when server restarts.');
  console.log('   For persistent storage, use MySQL version (app.js).');
  console.log('========================================');
});

module.exports = app;
