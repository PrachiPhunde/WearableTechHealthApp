/**
 * Alerts Routes
 * Handles health alert retrieval and management
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All alerts routes require authentication
router.use(authenticateToken);

/**
 * GET /api/alerts
 * Get all alerts for the authenticated user
 * Query params: resolved (true/false) - filter by resolved status
 */
router.get('/', (req, res) => {
  try {
    const userId = req.userId;
    const resolved = req.query.resolved;
    const db = getDb();

    let query = 'SELECT * FROM alerts WHERE user_id = ?';
    const params = [userId];

    // Filter by resolved status if provided
    if (resolved !== undefined) {
      query += ' AND resolved = ?';
      params.push(resolved === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, alerts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        alerts: alerts || [],
        count: alerts ? alerts.length : 0,
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching alerts' });
  }
});

/**
 * GET /api/alerts/unread
 * Get count of unresolved alerts (for badge display)
 */
router.get('/unread', (req, res) => {
  try {
    const userId = req.userId;
    const db = getDb();

    db.get(
      'SELECT COUNT(*) as count FROM alerts WHERE user_id = ? AND resolved = 0',
      [userId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          unread_count: result.count || 0,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching unread count' });
  }
});

/**
 * PATCH /api/alerts/:id/resolve
 * Mark an alert as resolved
 */
router.patch('/:id/resolve', (req, res) => {
  try {
    const userId = req.userId;
    const alertId = req.params.id;
    const db = getDb();

    // Verify alert belongs to user
    db.get(
      'SELECT id FROM alerts WHERE id = ? AND user_id = ?',
      [alertId, userId],
      (err, alert) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!alert) {
          return res.status(404).json({ error: 'Alert not found' });
        }

        // Mark as resolved
        db.run(
          'UPDATE alerts SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
          [alertId],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ error: 'Failed to resolve alert' });
            }

            res.json({ message: 'Alert resolved successfully' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error resolving alert' });
  }
});

module.exports = router;





