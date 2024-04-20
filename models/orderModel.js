// orderModel.js
const {addressSchema} = require('./addressModel');
const mongoose = require('mongoose');


//the schema for order items
const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1, validate: { validator: Number.isInteger, message: '{VALUE} is not an integer value' } },
    price: { type: Number, required: true },
    totalPrice:{type: Number, required: true }
});



// Function to generate a random alphanumeric string
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


//the schema for orders
const orderSchema = new mongoose.Schema({
    orderId: { type: String, default: () => generateRandomString(8) }, 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },// Allow any payment method
    address: addressSchema,
    status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Returned','Payment Pending'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    cancelReason: { type: String } ,
    returnReason: { type: String } ,
    returnRequested: { type: Boolean, default: false }, // Indicates if return is requested
    returnApproved: { type: Boolean, default: false }, 
    coupon:{type: mongoose.Schema.Types.ObjectId, ref:'Coupon'},
    totalActualAmount:{ type: Number}
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;






