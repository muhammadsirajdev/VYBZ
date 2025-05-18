const express = require('express');
const router = express.Router();
const {
  showSignupPage,
  registerUser,
  showLoginPage,
  loginUser,
  logoutUser
} = require('../controllers/user.controllers');

// Auth routes
router.get('/signup', showSignupPage);
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/login', showLoginPage);



module.exports = router;
