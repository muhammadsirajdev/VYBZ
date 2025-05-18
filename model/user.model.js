const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
     type: String,
     required: true,
     unique: true
    },
  email: { 
    type: String,
    required: true, 
    unique: true
   },
   fullname: {
    type: String,
    required: true,
   },
  password: { 
    type: String, 
    required: true
   },
  bio: { 
    type: String
 },
 refreshToken: {
    type: String
  },
  profilePic: { 
    type: String, 
    default: '' 
},
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

//It's a middleware function that runs before the user is saved to the database, and it generates a token using the user's id and a secret key, and sets the token in the user object
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});


//this is used to verify that the password entered by the user is correct or not, before logging in,because we are hashing the password before saving it to the database, so we need to compare the hashed password with the entered password

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
    }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
    }
  );
};
const User= mongoose.model('User', userSchema);
module.exports = User;
