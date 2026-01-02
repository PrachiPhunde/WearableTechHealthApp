/**
 * Notification Preferences Routes
 * Handles user notification settings
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All preferences routes require authentication
router.use(authenticateToken);

/**
 * GET /api/preferences
 * Get user notification preferences
 */
router.get('/', (req, res) => {
  try {
    const userId = req.userId;
    const db = getDb();

    db.get(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId],
      (err, preferences) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // If no preferences exist, return defaults
        if (!preferences) {
          return res.json({
            high_heart_rate_enabled: true,
            low_spo2_enabled: true,
            inactivity_enabled: true,
          });
        }

        res.json({
          high_heart_rate_enabled: Boolean(preferences.high_heart_rate_enabled),
          low_spo2_enabled: Boolean(preferences.low_spo2_enabled),
          inactivity_enabled: Boolean(preferences.inactivity_enabled),
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching preferences' });
  }
});

/**
 * PUT /api/preferences
 * Update user notification preferences
 * Body: { high_heart_rate_enabled, low_spo2_enabled, inactivity_enabled }
 */
router.put('/', (req, res) => {
  try {
    const userId = req.userId;
    const { high_heart_rate_enabled, low_spo2_enabled, inactivity_enabled } = req.body;
    const db = getDb();

    // Check if preferences exist
    db.get(
      'SELECT id FROM notification_preferences WHERE user_id = ?',
      [userId],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
          // Update existing preferences
          db.run(
            `UPDATE notification_preferences 
             SET high_heart_rate_enabled = ?,
                 low_spo2_enabled = ?,
                 inactivity_enabled = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [
              high_heart_rate_enabled !== undefined ? (high_heart_rate_enabled ? 1 : 0) : 1,
              low_spo2_enabled !== undefined ? (low_spo2_enabled ? 1 : 0) : 1,
              inactivity_enabled !== undefined ? (inactivity_enabled ? 1 : 0) : 1,
              userId,
            ],
            (updateErr) => {
              if (updateErr) {
                return res.status(500).json({ error: 'Failed to update preferences' });
              }

              res.json({
                message: 'Preferences updated successfully',
                preferences: {
                  high_heart_rate_enabled: Boolean(high_heart_rate_enabled !== undefined ? high_heart_rate_enabled : true),
                  low_spo2_enabled: Boolean(low_spo2_enabled !== undefined ? low_spo2_enabled : true),
                  inactivity_enabled: Boolean(inactivity_enabled !== undefined ? inactivity_enabled : true),
                },
              });
            }
          );
        } else {
          // Insert new preferences
          db.run(
            `INSERT INTO notification_preferences 
             (user_id, high_heart_rate_enabled, low_spo2_enabled, inactivity_enabled)
             VALUES (?, ?, ?, ?)`,
            [
              userId,
              high_heart_rate_enabled !== undefined ? (high_heart_rate_enabled ? 1 : 0) : 1,
              low_spo2_enabled !== undefined ? (low_spo2_enabled ? 1 : 0) : 1,
              inactivity_enabled !== undefined ? (inactivity_enabled ? 1 : 0) : 1,
            ],
            function (insertErr) {
              if (insertErr) {
                return res.status(500).json({ error: 'Failed to create preferences' });
              }

              res.status(201).json({
                message: 'Preferences created successfully',
                preferences: {
                  high_heart_rate_enabled: Boolean(high_heart_rate_enabled !== undefined ? high_heart_rate_enabled : true),
                  low_spo2_enabled: Boolean(low_spo2_enabled !== undefined ? low_spo2_enabled : true),
                  inactivity_enabled: Boolean(inactivity_enabled !== undefined ? inactivity_enabled : true),
                },
              });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

module.exports = router;

