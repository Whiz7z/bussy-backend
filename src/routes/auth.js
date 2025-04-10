const router = require('express').Router();
const passport = require('passport');

// Auth middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log(req);
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
  (req, res) => {
    console.log('req', req);
    res.redirect(process.env.CLIENT_URL);
  }
);

router.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: `${process.env.CLIENT_URL}/`,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    
  }),
  (req, res) => {
    console.log('req', req);
    res.redirect(process.env.CLIENT_URL);
  }
);

// Get current user
router.get('/user', isAuthenticated, (req, res) => {
  console.log('req', req);
  res.json(req.user);
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router; 