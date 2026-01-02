/**
 * Device Routes
 * Handles smartwatch device connection (simulated for beta)
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All device routes require authentication
router.use(authenticateToken);

/**
 * POST /api/devices/connect
 * Connect a smartwatch device (simulated)
 * Beta rule: Only ONE device per user
 * Body: { device_id, device_type, platform }
 */
router.post('/connect', (req, res) => {
  try {
    const { device_id, device_type, platform } = req.body;
    const userId = req.userId;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const db = getDb();

    // Check if user already has a device (beta: one device per user)
    db.get(
      'SELECT id, device_id, device_type, platform FROM devices WHERE user_id = ?',
      [userId],
      (err, existingDevice) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingDevice) {
          // User already has a device - update it
          db.run(
            'UPDATE devices SET device_id = ?, device_type = ?, platform = ?, last_sync_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [device_id, device_type || 'smartwatch', platform || 'unknown', userId],
            (updateErr) => {
              if (updateErr) {
                return res.status(500).json({ error: 'Failed to update device' });
              }
              res.json({
                message: 'Device updated successfully',
                device: {
                  id: existingDevice.id,
                  device_id,
                  device_type: device_type || 'smartwatch',
                  platform: platform || 'unknown',
                },
              });
            }
          );
        } else {
          // Insert new device
          db.run(
            'INSERT INTO devices (user_id, device_id, device_type, platform, last_sync_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [userId, device_id, device_type || 'smartwatch', platform || 'unknown'],
            function (insertErr) {
              if (insertErr) {
                // Check if device_id is already taken by another user
                if (insertErr.message.includes('UNIQUE constraint')) {
                  return res.status(409).json({ error: 'Device ID already in use by another user' });
                }
                return res.status(500).json({ error: 'Failed to connect device' });
              }

              res.status(201).json({
                message: 'Device connected successfully',
                device: {
                  id: this.lastID,
                  device_id,
                  device_type: device_type || 'smartwatch',
                  platform: platform || 'unknown',
                },
              });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error during device connection' });
  }
});

/**
 * GET /api/devices/status
 * Get connected device status for the authenticated user
 */
router.get('/status', (req, res) => {
  try {
    const userId = req.userId;
    const db = getDb();

    db.get(
      'SELECT id, device_id, device_type, platform, connected_at, last_sync_at FROM devices WHERE user_id = ?',
      [userId],
      (err, device) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!device) {
          return res.json({
            connected: false,
            message: 'No device connected',
          });
        }

        // Calculate time since last sync
        const lastSync = device.last_sync_at ? new Date(device.last_sync_at) : null;
        const now = new Date();
        const minutesSinceSync = lastSync ? Math.floor((now - lastSync) / (1000 * 60)) : null;

        res.json({
          connected: true,
          device: {
            id: device.id,
            device_id: device.device_id,
            device_type: device.device_type,
            platform: device.platform,
            connected_at: device.connected_at,
            last_sync_at: device.last_sync_at,
            minutes_since_sync: minutesSinceSync,
          },
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching device status' });
  }
});

/**
 * GET /api/devices
 * Get all connected devices for the authenticated user
 */
router.get('/', (req, res) => {
  try {
    const userId = req.userId;
    const db = getDb();

    db.all(
      'SELECT id, device_id, platform, connected_at, last_sync_at FROM devices WHERE user_id = ?',
      [userId],
      (err, devices) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ devices: devices || [] });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching devices' });
  }
});

module.exports = router;





