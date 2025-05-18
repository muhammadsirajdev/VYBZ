const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const connectDB = require('./connect');
const session = require('express-session');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');

const app = express();
const PORT = 2000;

// Connect to MongoDB
connectDB('mongodb://localhost:27017/SocialMediaDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'a-very-secure-and-unique-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});


// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// Mount routes
app.use('/', authRoutes);         // /signup, /login, etc.
app.use('/users', userRoutes);    // /users/feed, /users/:id
app.use('/posts', postRoutes);    // /posts/create, etc.

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
