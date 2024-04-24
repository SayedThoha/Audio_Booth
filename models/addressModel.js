//addressModel.js
// address model
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    type: {
        type: String,
        enum: ['Home', 'Office'],
        required: true
    },

    street: {
        type: String,
        required: true,
        maxlength: 100,
    },
    city: {
        type: String,
        required: true,
        maxlength: 50,
    },
    state: {
        type: String,
        required: true,
        maxlength: 50,
    },
    postalCode: {
        type: String,
        required: true,
        maxlength: 6
    }
});



const Address = mongoose.model('Address', addressSchema);

module.exports = { Address, addressSchema }
