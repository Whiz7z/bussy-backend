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

      console.log(token);
      
      // Set JWT token in HTTP-only cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Redirect to client
      res.redirect(`${process.env.CLIENT_URL}/auth-callback`);
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
  // Clear the JWT cookie
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 