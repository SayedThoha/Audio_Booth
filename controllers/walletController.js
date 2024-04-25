// walletController.js
const User = require('../models/userModel')
const Wallet = require('../models/walletModel');

const stripe = require('stripe')(process.env.stripe_secret_key);


// Function to render wallet view
const renderWallet = async (req, res) => {
    try {

        const userId = req.session.user_id;
        let wallet = await Wallet.findOne({ userId });
        // Fetch the user record based on the user ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }
        if (!wallet) {
            wallet = new Wallet({
                userId: userId,
                balance: 0 
            });
            await wallet.save();
        }
        const pageSize = 5; 
        const page = parseInt(req.query.page) || 1; 

        const totalCount = wallet.transactions.length;
        
        const totalPages = Math.ceil(totalCount / pageSize);
        

        // Calculate start and end index for pagination
        const startIndex = (page - 1) * pageSize;
        
        const endIndex = Math.min(startIndex + pageSize, totalCount);
        
        let transactions = wallet.transactions.slice().reverse().slice(startIndex, endIndex);
        
        
        
        const message = req.flash('message');
        res.render('./user/wallet', 
        { title: "wallet", 
        username: user.name,
         wallet, 
         transactions, 
         message: message,
         currentPage: page,
         totalPages : totalPages
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const addMoneyToWallet = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);
        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).send('Invalid amount');
        }

        // Find user's wallet
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).send('Wallet not found');
        }

        // Create a Payment Intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parsedAmount * 100, 
            currency: 'inr', 
            description: 'Adding money to wallet',
        });

        

        
        res.json({ clientSecret: paymentIntent.client_secret });

        
        
        wallet.balance += parsedAmount;
        wallet.transactions.push({
            type: 'credit',
            orderId:paymentIntent.id,
            amount: parsedAmount,
            reason: 'Added money to wallet'
        });

        // Save changes
        await wallet.save();

        // Send response
        res.status(200).send('Money added successfully');
        req.flash('message', 'Money added successfully');
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


// Webhook endpoint to handle Stripe events
const handleStripeWebhook = async (req, res) => {
    try {
        const event = req.body;

        // Handle payment intent succeeded event
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;

            // Retrieve user ID from payment metadata or any other source
            const userId = paymentIntent.metadata.userId;

            // Find user's wallet
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                return res.status(404).send('Wallet not found');
            }

            // Update wallet balance and log transaction
            const parsedAmount = parseFloat(paymentIntent.amount) / 100; // Amount in INR
            wallet.balance += parsedAmount;
            wallet.transactions.push({ type: 'credit', amount: parsedAmount, reason: 'Added money to wallet' });

            // Save changes
            await wallet.save();

            // Send response
            res.status(200).send('Money added to wallet successfully');
        } else {
            // For other event types, simply acknowledge the event
            res.json({ received: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const handleWebhookEvent = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, 'your_webhook_secret');

        // Handle the event based on its type
        switch (event.type) {
            case 'payment_intent.succeeded':
                // Handle successful payment
                console.log('Payment succeeded:', event.data.object);
                break;
            case 'payment_intent.payment_failed':
                // Handle failed payment
                console.log('Payment failed:', event.data.object);
                break;
            // Handle other event types as needed
        }

        // Respond with a 200 status code to acknowledge receipt of the event
        res.status(200).end();
    } catch (err) {
        console.error('Error handling webhook event:', err.message);
        // Respond with a 400 status code to indicate a problem with the request
        res.status(400).send('Webhook Error:' + err.message);
    }
};



module.exports = {
    renderWallet,
    addMoneyToWallet,
    handleStripeWebhook,
    handleWebhookEvent


};
