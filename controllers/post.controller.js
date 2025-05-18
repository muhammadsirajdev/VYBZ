// controllers/post.controller.js
const User = require('../model/user.model');
const Post = require('../model/post.model');

exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.redirect('/users/login');
    }

    const { content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = new Post({
      user: req.user.id,
      content,
      image
    });

    await newPost.save();
    res.redirect('/users/feed');
    console.log('Post created successfully:', newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).render('error', { message: 'Failed to create post' });
    console.error('Error in createPost:', error);
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.redirect('/users/login');
    }

    const posts = await Post.find({ user: req.user.id })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.render('myPosts', { posts, currentUser: req.user });
  } catch (err) {
    console.error('Error in getUserPosts:', err);
    res.status(500).render('error', { 
      message: 'Error loading your posts',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};

// New routes controller functions
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Use findByIdAndDelete instead of remove()
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};


exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      user: req.user.id,
      comment: req.body.comment
    };

    post.comments.unshift(newComment);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find(
      comment => comment._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.comments = post.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );

    await post.save();
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if post has already been liked by user
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    post.likes.push(req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: 'Error liking post' });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if post has been liked by user
    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Post has not been liked yet' });
    }

    post.likes = post.likes.filter(like => like.toString() !== req.user.id);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: 'Error unliking post' });
  }
};