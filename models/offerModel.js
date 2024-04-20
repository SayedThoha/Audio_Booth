// models/Offer.js

const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Category'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Offer', offerSchema);

