const isAuthenticated = (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    //console.log(error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
};

module.exports = {
  isAuthenticated
}; 