// models/Category.js
const mongoose = require('mongoose');

// Import the database connection module
require('../config/db');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 30
    },
    description: {
        type: String,
        maxlength: 80
    },
    _issoftdeleted: {
        type: Boolean,
        default: false
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
   
});

module.exports = mongoose.model('Category', categorySchema);
