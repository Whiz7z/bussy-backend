const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookie instead of Authorization header
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id } 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Failed to authenticate' });
  }
};

module.exports = {
  isAuthenticated
}; 