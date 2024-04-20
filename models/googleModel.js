const mongoose = require('mongoose');

const googleSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },

});

const User = mongoose.model('Google', googleSchema);

module.exports = User;
