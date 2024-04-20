const mongoose = require('mongoose');

// Import the database connection module
require('../config/db');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  is_admin: {
    type: Number,
    required: true
  }
});
module.exports = mongoose.model('admin', adminSchema)