/**
 * Profile Routes
 * Handles user profile data and baseline calculations
 */

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { getUserBaseline } = require('../services/baselineService');

const router = express.Router();

// All profile routes require authentication
router.use(authenticateToken);

/**
 * GET /api/profile
 * Get user profile with calculated baseline values
 */
router.get('/', (req, res) => {
  try {
    const userId = req.userId;
    const db = getDb();

    db.get(
      'SELECT id, name, email, birth_date, gender, created_at FROM users WHERE id = ?',
      [userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Calculate baseline values based on user profile
        const baseline = getUserBaseline({
          birth_date: user.birth_date,
          gender: user.gender,
        });

        res.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            birth_date: user.birth_date,
            gender: user.gender,
            created_at: user.created_at,
          },
          baseline,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 * Body: { name, birth_date, gender }
 */
router.put('/', (req, res) => {
  try {
    const userId = req.userId;
    const { name, birth_date, gender } = req.body;
    const db = getDb();

    // Validate birth_date format if provided
    if (birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birth_date)) {
        return res.status(400).json({ error: 'Birth date must be in YYYY-MM-DD format' });
      }
      const birthDate = new Date(birth_date);
      if (birthDate > new Date()) {
        return res.status(400).json({ error: 'Birth date cannot be in the future' });
      }
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (birth_date !== undefined) {
      updates.push('birth_date = ?');
      values.push(birth_date);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender ? gender.toLowerCase() : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values,
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Fetch updated user
        db.get(
          'SELECT id, name, email, birth_date, gender, created_at FROM users WHERE id = ?',
          [userId],
          (fetchErr, user) => {
            if (fetchErr) {
              return res.status(500).json({ error: 'Database error' });
            }

            const baseline = getUserBaseline({
              birth_date: user.birth_date,
              gender: user.gender,
            });

            res.json({
              message: 'Profile updated successfully',
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                birth_date: user.birth_date,
                gender: user.gender,
                created_at: user.created_at,
              },
              baseline,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;

