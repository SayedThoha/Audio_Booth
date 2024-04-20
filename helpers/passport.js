const passport = require('passport'); 
var GoogleStrategy = require('passport-google-oauth20').Strategy;
// const User = require("../models/userModel");


passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret:CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Import required modules and models
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/googleModel'); // Assuming you have a User model

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret:CLIENT_SECRET,
    callbackURL: "/auth/google/callback" // Set your callback URL
  },
  async function(accessToken, refreshToken, profile, done) {
    // Check if user exists in database
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // If user doesn't exist, create a new user
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        // You may want to add more fields here if needed
      });
    }

    return done(null, user);
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Create a function to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login'); // Redirect to login page if not authenticated
}

// Export the ensureAuthenticated function along with other functions
module.exports = {
  ensureAuthenticated
};

// In your login route, add the Google authentication middleware
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// Now, modify your '/' route to check if the user is authenticated
router.get('/', ensureAuthenticated, userController.loadHome);

// Your loadHome function remains the same
