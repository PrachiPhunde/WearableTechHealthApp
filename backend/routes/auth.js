/**
 * Authentication Routes
 * Handles user registration and login
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, birth_date, gender }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, birth_date, gender } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate birth_date format (YYYY-MM-DD)
    if (birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birth_date)) {
        return res.status(400).json({ error: 'Birth date must be in YYYY-MM-DD format' });
      }
      // Validate date is not in the future
      const birthDate = new Date(birth_date);
      if (birthDate > new Date()) {
        return res.status(400).json({ error: 'Birth date cannot be in the future' });
      }
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }

    const db = getDb();

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert new user with birth_date and gender
      db.run(
        'INSERT INTO users (email, password_hash, birth_date, gender) VALUES (?, ?, ?, ?)',
        [email, passwordHash, birth_date || null, gender ? gender.toLowerCase() : null],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          // Generate JWT token
          const token = jwt.sign(
            { userId: this.lastID, email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
              id: this.lastID,
              email,
              birth_date: birth_date || null,
              gender: gender ? gender.toLowerCase() : null,
            },
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();

    // Find user by email
    db.get('SELECT id, email, password_hash FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;





