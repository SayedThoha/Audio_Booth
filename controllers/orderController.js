const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const User = require("../models/userModel");
const { Address } = require('../models/addressModel')
const Order = require("../models/orderModel")
const Wallet = require('../models/walletModel');
const easyinvoice = require('easyinvoice');
const fs = require('fs');
const path = require('path');


// get oder history to user profile
const getOrderHistory = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const page = parseInt(req.query.page) || 1; // Current page (default to 1)
        const perPage = 3; // Number of orders per page
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('items.product')
            .populate('coupon');

        const totalOrdersCount = await Order.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalOrdersCount / perPage);

        // Calculate total actual amount for each order
        orders.forEach(order => {
            let totalActualAmount = 0;
            order.items.forEach(item => {
                // Calculate amount for each item based on actualPrice
                const itemActualAmount = item.quantity * item.product.actualPrice;
                totalActualAmount += itemActualAmount;
            });
            order.totalActualAmount = totalActualAmount;
        });

        res.render('./user/orders', {
            title: 'Order History',
            orders,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).send('Internal server error');
    }
};


//cancel oder for user
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { cancelReason } = req.body;

        const order = await Order.findById(orderId).populate('items.product');
        if (!order || order.user.toString() !== req.session.user_id) {
            return res.status(404).send('Order not found');
        }
        if (order.status !== 'Pending') {
            return res.status(400).send('Cannot cancel order with status other than Pending');
        }

        // Get payment method from the order
        const paymentMethod = order.paymentMethod;

        // If payment method is Razorpay, process refund
        if (paymentMethod === 'Razorpay') {

            const refundAmount = order.totalAmount; // Refund full amount


            // Update wallet balance
            const userId = req.session.user_id;
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(404).send('Wallet not found');
            }
            wallet.balance += refundAmount;

            // Log the refund transaction in the wallet history
            wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                reason: 'Refund for canceled order',
                orderId: order.orderId,
                paymentMethod: paymentMethod
            });
            await wallet.save();
        }

        // Iterate through order items to restore product quantities
        for (const item of order.items) {
            const product = item.product;
            product.stockQuantity += item.quantity;
            await product.save();
        }
        // Update order status to Cancelled
        order.status = 'Cancelled';
        order.cancelReason = cancelReason; // Save the cancellation reason
        await order.save();

        // Redirect to order history page or display success message
        res.redirect('/profile/orders');
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).send('Internal server error');
    }
};



// Return an order
const returnOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const { returnReason } = req.body;

        const order = await Order.findById(orderId).populate('items.product');
        if (!order || order.user.toString() !== req.session.user_id) {
            return res.status(404).send('Order not found');
        }
        if (order.status !== 'Delivered') {
            return res.status(400).send('Cannot return order with status other than Delivered');
        }


        order.returnRequested = true;
        order.returnReason = returnReason
        await order.save();

        // Redirect to order history page or display success message
        res.redirect('/profile/orders');
    } catch (error) {
        console.error('Error returning order:', error);
        res.status(500).send('Internal server error');
    }
};



// load orders page of admin side
const loadOrders = async (req, res) => {
    try {

        const pageSize = 10; // Number of orders per page
        const page = parseInt(req.query.page) || 1; // Get current page from query parameter

        // Fetch orders from the database
        const totalCount = await Order.countDocuments();
        const totalPages = Math.ceil(totalCount / pageSize);
        // Fetch orders from the database
        const orders = await Order.find()
            .populate('items.product')
            .populate('coupon')
            .populate('user')
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize);


             // Calculate total actual amount for each order
        orders.forEach(order => {
            let totalActualAmount = 0;
            order.items.forEach(item => {
                // Calculate amount for each item based on actualPrice
                const itemActualAmount = item.quantity * item.product.actualPrice;
                totalActualAmount += itemActualAmount;
            });
            order.totalActualAmount = totalActualAmount;
        });

        const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];

        res.render('./admin/orders',
            {
                title: 'Orders',
                orders, statuses,
                currentPage: page,
                totalPages
            });

    } catch (error) {
        console.log(error.message)
    }
}


// update order status for admin
const changeOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;

        const newStatus = req.body.status


        // Update the order status in the database
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });


        res.redirect('/admin/orders')

    } catch (error) {
        console.error('Error changing order status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// cancel oder from admin
const AdmincancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        
        const order = await Order.findById(orderId).populate('items.product');

        // Iterate through order items to restore product quantities
        for (const item of order.items) {
            const product = item.product;
            product.stockQuantity += item.quantity;
            await product.save();
        }
        // Update order status to Cancelled
        order.status = 'Cancelled';
        await order.save();

        // Send a response indicating success
        
        res.redirect('/admin/orders')
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// admin approve return
const approveReturn = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Find the order by orderId and populate the associated items
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.status !== 'Delivered' || !order.returnRequested) {
            return res.status(400).send('Invalid order status or return request');
        }

        // Calculate the total amount of the returned order
        const returnedAmount = order.totalAmount;

        // Get the payment method from the order
        const paymentMethod = order.paymentMethod;

        // Update the user's wallet balance
        const userId = order.user;
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        wallet.balance += returnedAmount;

        // Log the transaction in the wallet history
        wallet.transactions.push({
            type: 'credit',
            amount: returnedAmount,
            reason: 'Refund for Returned order',
            orderId: order.orderId,
            paymentMethod: paymentMethod
        });

        await wallet.save();

        // Iterate through order items to restore product quantities
        for (const item of order.items) {
            const product = item.product;
            product.stockQuantity += item.quantity;
            await product.save();
        }

        // Update order status and return approval status
        order.status = 'Returned';
        order.returnApproved = true;

        await order.save();

        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error approving return request:', error);
        res.status(500).send('Internal server error');
    }
};




const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const order = await Order.findById(orderId).populate('user').populate('items.product');

        if (!order) {
            return res.status(404).send({ error: 'Order not found' });
        }


        // Function to prepare products array for the invoice
        const prepareProducts = (items) => {
            return items.map(item => ({
                quantity: item.quantity,
                description: item.product.name,
                taxRate: 0,
                price: item.price,
            }));
        };

        // Prepare products array from order items
        const products = prepareProducts(order.items);

        // Prepare data for the invoice
        const data = {

            apiKey: "free",
            mode: "development",
            documentTitle: 'Invoice',
            currency: 'INR',
            taxNotation: 'gst',
            marginTop: 25,
            marginRight: 25,
            marginLeft: 25,
            marginBottom: 25,
            images: {
                logo: "https://cdn.dribbble.com/users/1365253/screenshots/4566965/booth-v6__1_.png",

            },
            sender: {
                company: 'Audio Booth',
                address: 'Audio Booth City',
                zip: '1234 AB',
                city: 'Kerala',
                country: 'India',
            },
            client: {
                company: order.user.name,
                address: `${order.address.street}, ${order.address.city}, ${order.address.state}`,
                zip: ` ${order.address.postalCode}`,
                city: `${order.address.city}`,
                country: "India",
                custom1: order.user.phone,
                custom2: order.user.email

            },
            information: {
                number: order.orderId,
                date: order.createdAt.toISOString().split('T')[0],

            },
            products: products,

            bottomNotice: 'Thank you for your business!',
            settings: {
                currency: "INR",
            }
        };


        const result = await easyinvoice.createInvoice(data)
        const pdfBase64 = result.pdf.toString("base64")

        res.attachment(`invoice_${order.orderId}.pdf`)
        res.send(Buffer.from(pdfBase64, "base64"))

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}







module.exports = {
    getOrderHistory,
    cancelOrder,
    returnOrder,
    loadOrders,
    changeOrderStatus,
    AdmincancelOrder,
    approveReturn,
    downloadInvoice
}


