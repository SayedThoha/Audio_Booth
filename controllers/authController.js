const passport = require('passport');
const User = require("../models/userModel");

// Controller action for handling Google authentication
exports.googleAuth = passport.authenticate('google', { scope: ['profile'] });

// Callback route for Google authentication
exports.googleAuthCallback = passport.authenticate('google', { failureRedirect: '/login' }), 
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  };
