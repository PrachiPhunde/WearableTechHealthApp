/**
 * LifeSync Backend Server
 * Express server for health monitoring smartwatch application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const deviceRoutes = require('./routes/devices');
const vitalsRoutes = require('./routes/vitals');
const alertsRoutes = require('./routes/alerts');
const preferencesRoutes = require('./routes/preferences');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow React Native app to connect
app.use(express.json()); // Parse JSON request bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LifeSync API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/preferences', preferencesRoutes);

// Initialize database and start server
initDatabase()
  .then(() => {
    // Listen on all network interfaces (0.0.0.0) to allow connections from other devices
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 LifeSync Backend running on http://localhost:${PORT}`);
      console.log(`📊 Database initialized successfully`);
      console.log(`\n💡 For physical device testing:`);
      console.log(`   - Find your IP address (ipconfig on Windows, ifconfig on Mac/Linux)`);
      console.log(`   - Update LifeSync/constants/api.ts with: http://YOUR_IP:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

module.exports = app;





