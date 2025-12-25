/**
 * Authentication Middleware
 * Verifies JWT tokens for protected routes
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to verify JWT token from Authorization header
 * Adds user_id to request object if token is valid
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Attach user info to request for use in route handlers
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
};





