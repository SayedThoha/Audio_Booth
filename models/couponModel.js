const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true 
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'], 
        required: true
    },
    discountAmount: {
        type: Number,
        
    },
    minimumPurchaseAmount: {
        type: Number,
        default: 0 
    },
    expirationDate: {
        type: Date,
        required: true
    },
    discountPercentage: {
        type: Number,
        
    },
    maximumDiscountAmount: {
        type: Number,
    
    },
    
});

// TTL index on expirationDate
couponSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 }); // remove documents immediately after expiration

module.exports = mongoose.model('Coupon', couponSchema);
