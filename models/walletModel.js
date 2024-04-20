// walletModel.js

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        unique: true,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }, 
    transactions: [
        {
            type: {
                type: String, // 'credit' or 'debit'
                enum: ['credit', 'debit']
            },
            amount: Number,
            reason: String, // Reason for the transaction 
            orderId:{ type: String,required: true} , 
            paymentMethod: {
                type: String, // 'cash_on_delivery' or 'razorpay'
                enum: ['Cash On Delivery', 'Razorpay']
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

module.exports = mongoose.model('Wallet', walletSchema);
