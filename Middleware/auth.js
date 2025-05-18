const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

const verifyToken = async function (req, res, next) {
  try {
    // Check if user is authenticated via session
    if (req.session && req.session.user) {
      // Fetch fresh user data from database
      const user = await User.findById(req.session.user.id);
      if (user) {
        req.user = user;
        return next();
      }
    }

    // If no session, check for token
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/users/login');
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Set both session and req.user
      req.session.user = {
        id: user._id,
        username: user.username,
        fullname: user.fullname
      };
      req.user = user;
      
      next();
    } catch (err) {
      console.error('Token verification failed:', err);
      res.clearCookie('token');
      return res.redirect('/users/login');
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.redirect('/users/login');
  }
};

module.exports = { verifyToken };
