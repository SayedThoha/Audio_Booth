
// Assuming you're using Mongoose for MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const referralOfferSchema = new Schema({
    referrerReward: {
        type: Number,
        required: true
    },
    refereeReward: {
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
    }
});

const ReferralOffer = mongoose.model('ReferralOffer', referralOfferSchema);

module.exports = ReferralOffer;
