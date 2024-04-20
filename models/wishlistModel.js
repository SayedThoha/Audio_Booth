// wishlist model
const mongoose = require('mongoose');



const wishlistSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});


module.exports = mongoose.model('Wishlist', wishlistSchema);
