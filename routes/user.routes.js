const express = require('express');
const router = express.Router();
const {
  getFeed,
  searchUsers,
  viewProfile,
  followUser,
  unfollowUser,
  followOrUnfollowUser
} = require('../controllers/user.controllers');
const { verifyToken } = require('../Middleware/auth');

// Protected routes
router.get('/feed', verifyToken, getFeed);
router.get('/search', verifyToken, searchUsers);
router.post('/follow/:id', verifyToken, followOrUnfollowUser);
router.get('/:id', verifyToken, viewProfile);


module.exports = router;
