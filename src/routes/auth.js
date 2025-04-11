const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isAuthenticated } = require('../middleware/auth');

// Auth middleware to check if user is authenticated
// No longer needed as we have the middleware in auth.js

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Redirect with token in query params
      res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${token}`);
    } catch (error) {
      console.error('Auth error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// Get current user
router.get('/user', isAuthenticated, (req, res) => {
  // User is already attached to the request by the isAuthenticated middleware
  res.json(req.user);
});

// Logout route
router.get('/logout', (req, res) => {
  // No server-side logout required for JWT
  // Client will handle token removal
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 