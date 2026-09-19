const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../frontend/views'));

// Routes (will be added in next steps)
const readingsRouter = require('./routes/readings');
const devicesRouter = require('./routes/devices');
const alertsRouter = require('./routes/alerts');

app.use('/api/readings', readingsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/alerts', alertsRouter);

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
async function startServer() {
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('[ERROR] Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`[SERVER] SIGAP MBG Dashboard running on http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

module.exports = app;
