const mongoose = require('mongoose');
require('../config/db');

const otpSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    otp: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        expires: 300 
        
    
    }
});
module.exports = mongoose.model('otp', otpSchema)