const mongoose = require('mongoose');

// Import the database connection module
require('../config/db');

const userSchema = new mongoose.Schema({
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
    phone: {
        type: String,
        required: true

    },
    is_user: {
        type: Number,
        required: true
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    is_verified: {
        type: Number,
        required: true
    },

    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }] 
});
module.exports = mongoose.model('user', userSchema)


