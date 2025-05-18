const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const Post = require('../model/post.model');

// Show Signup Page
const showSignupPage = (req, res) => {
  res.render('home');
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { username, email, fullname, password, bio } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('home', { error: "Username or Email already exists" });
    }

    const newUser = new User({ username, email, fullname, password, bio });
    await newUser.save();

    res.redirect('/users/login');
  } catch (error) {
    res.render('home', { error: "Error during signup. Please try again." });
  }
};

// Show Login Page
const showLoginPage = (req, res) => {
  res.render('login', { message: null, success: null });
};

// Login User
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Attempting login for username:', username);

    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { message: 'Invalid username', success: false });
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      return res.render('login', { message: 'Incorrect password', success: false });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      fullname: user.fullname,
    };

    const token = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    req.user = user;

    res.redirect('/users/feed');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { message: 'Login failed: ' + err.message, success: false });
  }
};

// Search Users
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.render('searchResults', { users: [], query: '', currentUser: req.user });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullname: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('username fullname profilePic followers');

    res.render('searchResults', { users, query, currentUser: req.user });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).render('error', { 
      message: 'Error performing search',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};

// View User Profile
const viewProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const currentUserId = req.user.id;

    const profileUser = await User.findById(profileId)
      .select('username fullname bio profilePic followers following')
      .lean();

    if (!profileUser) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(401).redirect('/users/login');
    }

    const isFollowing = profileUser.followers.includes(currentUserId);

    const posts = await Post.find({ user: profileId })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 })
      .lean();

    const followerCount = profileUser.followers.length;
    const followingCount = profileUser.following.length;

    res.render('profile', {
      profileUser,
      currentUser,
      posts,
      isFollowing,
      followerCount,
      followingCount
    });
  } catch (error) {
    console.error('Error viewing profile:', error);
    res.status(500).render('error', { message: 'Error loading profile' });
  }
};

// // Follow User
// const followUser = async (req, res) => {
//   try {
//     const targetUserId = req.params.id;
//     const currentUserId = req.user.id;

//     if (targetUserId === currentUserId) {
//       return res.status(400).json({ message: 'You cannot follow yourself' });
//     }

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId)
//     ]);

//     if (!targetUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (targetUser.followers.includes(currentUserId)) {
//       return res.status(400).json({ message: 'Already following' });
//     }

//     targetUser.followers.push(currentUserId);
//     currentUser.following.push(targetUserId);

//     await Promise.all([targetUser.save(), currentUser.save()]);

//     res.json({ message: 'User followed successfully' });
//   } catch (error) {
//     console.error('Error following user:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Unfollow User
// const unfollowUser = async (req, res) => {
//   try {
//     const targetUserId = req.params.id;
//     const currentUserId = req.user.id;

//     if (targetUserId === currentUserId) {
//       return res.status(400).json({ message: 'You cannot unfollow yourself' });
//     }

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId)
//     ]);

//     if (!targetUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (!targetUser.followers.includes(currentUserId)) {
//       return res.status(400).json({ message: 'You are not following this user' });
//     }

//     targetUser.followers.pull(currentUserId);
//     currentUser.following.pull(targetUserId);

//     await Promise.all([targetUser.save(), currentUser.save()]);

//     res.json({ message: 'User unfollowed successfully' });
//   } catch (error) {
//     console.error('Error unfollowing user:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Follow or Unfollow User

const followOrUnfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    return res.json({ 
  success: true, 
  isFollowing: !isFollowing,
  followerCount: targetUser.followers.length,
  followingCount: targetUser.following.length
});

  } catch (err) {
    console.error("Toggle follow error:", err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




// Get Feed
const getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(401).redirect('/users/login');
    }

    const posts = await Post.find({
      user: { $in: [...currentUser.following, currentUser._id] }
    })
    .populate('user', 'username profilePic')
    .sort({ createdAt: -1 })
    .lean();

    res.render('feed', {
      posts,
      currentUser
    });
  } catch (error) {
    console.error('Error loading feed:', error);
    res.status(500).render('error', { message: 'Error loading feed' });
  }
};

// Add logout function
const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/users/feed'); // fallback
    }

    res.clearCookie('token'); // Remove JWT
    res.redirect('/login');
  });
};


// EXPORT ALL FUNCTIONS AT ONCE
module.exports = {
  showSignupPage,
  registerUser,
  showLoginPage,
  loginUser,
  logoutUser,
  searchUsers,
  viewProfile,

  getFeed,
  followOrUnfollowUser
};
