/**
 * Vitals Routes
 * Handles health data ingestion and retrieval
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { evaluateAlerts } = require('../services/alertService');

const router = express.Router();

// All vitals routes require authentication
router.use(authenticateToken);

/**
 * POST /api/vitals
 * Ingest health data from smartwatch
 * Body: { device_id, heart_rate, spo2, temperature, steps }
 */
router.post('/', (req, res) => {
  try {
    const { device_id, heart_rate, spo2, temperature, steps } = req.body;
    const userId = req.userId;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    // Validate that device belongs to user
    const db = getDb();
    db.get(
      'SELECT id FROM devices WHERE device_id = ? AND user_id = ?',
      [device_id, userId],
      (err, device) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!device) {
          return res.status(404).json({ error: 'Device not found or not connected' });
        }

        // Insert vital data
        db.run(
          `INSERT INTO vitals (user_id, device_id, heart_rate, spo2, temperature, steps, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [userId, device_id, heart_rate || null, spo2 || null, temperature || null, steps || null],
          function (insertErr) {
            if (insertErr) {
              return res.status(500).json({ error: 'Failed to save vital data' });
            }

            // Evaluate alerts based on new vital data (async, don't wait)
            evaluateAlerts(userId, { heart_rate, spo2, temperature, steps })
              .catch((alertErr) => {
                console.error('Alert evaluation error:', alertErr);
                // Don't fail the request if alert evaluation fails
              });

            res.status(201).json({
              message: 'Vital data saved successfully',
              vital_id: this.lastID,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error saving vital data' });
  }
});

/**
 * GET /api/vitals/latest
 * Get the most recent vital data for the user
 */
router.get('/latest', (req, res) => {
  try {
    const userId = req.userId;
    const db = getDb();

    db.get(
      `SELECT heart_rate, spo2, temperature, steps, timestamp
       FROM vitals
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [userId],
      (err, vital) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!vital) {
          return res.json({ vital: null, message: 'No vital data available' });
        }

        res.json({ vital });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching latest vitals' });
  }
});

/**
 * GET /api/vitals/history
 * Get historical vital data
 * Query params: period (24h, 7d) - defaults to 24h
 */
router.get('/history', (req, res) => {
  try {
    const userId = req.userId;
    const period = req.query.period || '24h';
    const db = getDb();

    // Calculate time threshold based on period
    let hoursBack = 24;
    if (period === '7d') {
      hoursBack = 24 * 7;
    }

    db.all(
      `SELECT heart_rate, spo2, temperature, steps, timestamp
       FROM vitals
       WHERE user_id = ? AND timestamp >= datetime('now', '-' || ? || ' hours')
       ORDER BY timestamp DESC`,
      [userId, hoursBack],
      (err, vitals) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          vitals: vitals || [],
          period,
          count: vitals ? vitals.length : 0,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

/**
 * GET /api/vitals/stats
 * Get aggregated statistics for vitals
 * Query params: period (24h, 7d) - defaults to 24h
 */
router.get('/stats', (req, res) => {
  try {
    const userId = req.userId;
    const period = req.query.period || '24h';
    const db = getDb();

    let hoursBack = 24;
    if (period === '7d') {
      hoursBack = 24 * 7;
    }

    db.get(
      `SELECT 
        AVG(heart_rate) as avg_heart_rate,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(spo2) as avg_spo2,
        AVG(temperature) as avg_temperature,
        SUM(steps) as total_steps
       FROM vitals
       WHERE user_id = ? AND timestamp >= datetime('now', '-' || ? || ' hours')
       AND heart_rate IS NOT NULL`,
      [userId, hoursBack],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          stats: {
            heart_rate: {
              average: Math.round(stats.avg_heart_rate || 0),
              min: stats.min_heart_rate || 0,
              max: stats.max_heart_rate || 0,
            },
            spo2: {
              average: Math.round((stats.avg_spo2 || 0) * 10) / 10,
            },
            temperature: {
              average: Math.round((stats.avg_temperature || 0) * 10) / 10,
            },
            steps: {
              total: stats.total_steps || 0,
            },
          },
          period,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

module.exports = router;





