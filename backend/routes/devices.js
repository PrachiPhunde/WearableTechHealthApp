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
 * Body: { device_id, platform }
 */
router.post('/connect', (req, res) => {
  try {
    const { device_id, platform } = req.body;
    const userId = req.userId;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const db = getDb();

    // Check if device already exists for this user
    db.get(
      'SELECT id FROM devices WHERE device_id = ? AND user_id = ?',
      [device_id, userId],
      (err, existingDevice) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingDevice) {
          // Update last sync time
          db.run(
            'UPDATE devices SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?',
            [existingDevice.id],
            (updateErr) => {
              if (updateErr) {
                return res.status(500).json({ error: 'Failed to update device' });
              }
              res.json({
                message: 'Device already connected, sync time updated',
                device: {
                  id: existingDevice.id,
                  device_id,
                  platform: platform || 'unknown',
                },
              });
            }
          );
        } else {
          // Insert new device
          db.run(
            'INSERT INTO devices (user_id, device_id, platform, last_sync_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [userId, device_id, platform || 'unknown'],
            function (insertErr) {
              if (insertErr) {
                return res.status(500).json({ error: 'Failed to connect device' });
              }

              res.status(201).json({
                message: 'Device connected successfully',
                device: {
                  id: this.lastID,
                  device_id,
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





