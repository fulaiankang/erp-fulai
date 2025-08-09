const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Get fresh user data from database
    db.get(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [user.id],
      (err, userData) => {
        if (err || !userData) {
          return res.status(403).json({ error: 'User not found' });
        }
        
        req.user = userData;
        next();
      }
    );
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
