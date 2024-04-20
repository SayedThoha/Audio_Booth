const mongoose = require('mongoose');

// the schema for the Cart model
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true // each user has only one cart
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value'
            }
        }
    }],
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0 // default to 0,
    }
});

// Create the Cart model
const Cart = mongoose.model('Cart', cartSchema);

module.exports =Cart
