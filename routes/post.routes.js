// routes/post.routes.js

const express = require('express');
const router = express.Router();
const { createPost, getUserPosts ,deletePost,addComment,deleteComment,likePost,unlikePost} = require('../controllers/post.controller');
const {verifyToken} = require('../Middleware/auth'); // JWT verification middleware
const upload = require('../Middleware/upload'); // ✅ M = capital




router.post('/create', verifyToken, upload.single('image'), createPost);


router.get('/create', verifyToken, (req, res) => {
  res.render('createPost'); // Renders a form
});

// router.post('/create', verifyToken, createPost);

// router.get('/feed', verifyToken, getAllPosts); // Feed from all users
router.get('/my-posts', verifyToken, getUserPosts); // Posts from logged-in user

//new routes
router.delete('/:postId', verifyToken, deletePost);
router.post('/:postId/comments', verifyToken, addComment);
router.delete('/:postId/comments/:commentId', verifyToken, deleteComment);
router.put('/:postId/like', verifyToken, likePost);
router.put('/:postId/unlike', verifyToken, unlikePost);

module.exports = router;
