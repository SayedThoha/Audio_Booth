// models/Product.js
const mongoose = require('mongoose');
// Import the database connection module
require('../config/db');


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 30
    },
    description:{
        type:String,
        maxlength:80

    } ,
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        
    },
    stockQuantity: {
        type: Number,
        default: 0
    },
    brand: String,
    features: [String],
    rating: {
        type: Number,
        default: 0
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        rating: Number,
        comment: String
    }],
    images: [{
        url: String,
        description: String
    }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    discount: {
        type: Number,
        default: 0
    },
    actualPrice: {
        type: Number,
        required: true
    },
    is_softdeleted:{
        type:Boolean,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now 
    },
    offers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    }]
});

module.exports = mongoose.model('Product', productSchema);


