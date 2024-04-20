const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const User = require("../models/userModel");
const { Address } = require('../models/addressModel')
const Order = require("../models/orderModel")
const Coupon = require('../models/couponModel');
const Razorpay = require('razorpay');


// load the cart
const loadCart = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
        let cart = await Cart.findOne({ userId }).populate('items.product');

        
        if (!cart) {
            cart = { items: [], };

            
        }

        // Calculate total amount
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.product.price;
        });

        // Initialize discounted total amount as the total amount
        let discountedTotalAmount = totalAmount;

        // Check if a coupon is applied to the cart
        if (cart.coupon) {
           
            const coupon = await Coupon.findById(cart.coupon);
            if (coupon) {
                if (coupon.discountType === 'fixed') {
                    // If discount type is fixed, subtract the fixed discount amount
                    discountedTotalAmount = totalAmount - Math.max(coupon.discountAmount,0);
                } else if (coupon.discountType === 'percentage') {
                    
                    const discountPercentage = coupon.discountPercentage / 100;
                    
                    let discountAmount = totalAmount * discountPercentage;
            
                    // Check if the calculated discount amount exceeds the maximum discount allowed
                    if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
                        discountAmount = coupon.maximumDiscountAmount; // Apply maximum discount amount if exceeded
                    }
                    
                    discountedTotalAmount = Math.max(totalAmount - discountAmount, 0);
                }
            }
        }
          

        const message = req.flash('message');
        
        discountedTotalAmount=Math.round(discountedTotalAmount)
        
        res.render('./user/cart', { title: 'cart', cart, totalAmount, discountedTotalAmount, message: message });


    } catch (error) {
        console.log(error.message)
    }
}


// function to add a product to the cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const maxQuantityPerProduct = 3;
        // Validate quantity
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be a positive integer' });
        }

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product is in stock
        if (product.stockQuantity < quantity) {
            return res.status(400).json({ message: 'Product out of stock' });
        }

        // Get user ID from session
        const userId = req.session.user_id;

        // Find the cart for the user
        let cart = await Cart.findOne({ userId });

        // If the cart does not exist, create it
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if adding the requested quantity will exceed the available stock
        const totalItemsInCart = cart.items.reduce((total, item) => total + item.quantity, 0);
        if (totalItemsInCart + quantity > product.stockQuantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }

        // Check if the total items in the cart plus the requested quantity exceeds the limit
        const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
        if (totalItems + quantity > 6) {
            return res.status(400).json({ message: 'Maximum items in cart reached' });
        }


        // Check if the product already exists in the cart
        const existingItemIndex = cart.items.findIndex(item => item.product.equals(productId));
        if (existingItemIndex !== -1) {
            // Check if adding the requested quantity will exceed the maximum quantity per product
            if (cart.items[existingItemIndex].quantity + quantity > maxQuantityPerProduct) {
                return res.status(400).json({ message: `Maximum quantity per product is ${maxQuantityPerProduct}` });
            }
            // If the product already exists in the cart, update its quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // If the product doesn't exist in the cart, add it
            cart.items.push({ product: productId, quantity });
        }

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Controller function to remove a product from the cart
const removeFromCart = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Get user ID from session
        const userId = req.session.user_id;
        // Find the cart for the current user
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the index of the product in the cart items
        const indexToRemove = cart.items.findIndex(item => item.product.equals(productId));
        if (indexToRemove !== -1) {
            // If the product quantity is greater than 1, decrement the quantity by 1
            if (cart.items[indexToRemove].quantity > 1) {
                cart.items[indexToRemove].quantity -= 1;
            } else {
                // If the product quantity is 1, remove the product from the cart
                cart.items.splice(indexToRemove, 1);
            }
        }

        // Save the updated cart
        await cart.save();

        // Check if the cart is empty after removing the product
        if (cart.items.length === 0) {
            // If the cart is empty, remove the applied coupon and reset total amount to zero
            cart.coupon = null;
            cart.totalAmount = 0;
            await cart.save();
        }
        // res.status(200).json({ message: 'Product removed from cart successfully' });
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// update stock from cart
const updateFromCart = async (req, res) => {
    try {
        const productId = req.params.id;

        
        
        const quantity = parseInt(req.body.quantity);

        console.log(quantity)

        // Check if the requested quantity is a positive integer
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be a positive integer' });
        }

        // Check if the product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Check if the product is in stock
        if (product.stockQuantity < quantity) {
            return res.status(400).json({ message: 'Product out of stock' });
        }
        // Get the maximum quantity per product and the maximum items in cart
        const maxQuantityPerProduct = 3; 
        const maxItemsInCart = 6; 

        // Find the cart for the user
        const userId = req.session.user_id;

        let cart = await Cart.findOne({ userId }).populate('items.product');

        // Check if the cart exists
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.product.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Check if updating the quantity will exceed the maximum quantity per product
        const totalItemsInCart = cart.items.reduce((total, item) => total + item.quantity, 0);
        if (totalItemsInCart - cart.items[itemIndex].quantity + quantity > maxItemsInCart) {
            
            return res.status(400).json({ message: 'Maximum items in cart reached' });
            

        } else if (quantity > maxQuantityPerProduct) {
            
            return res.status(400).json({ message: `Maximum quantity per product is ${maxQuantityPerProduct}` });
        
        }

        // Update the quantity of the item
        cart.items[itemIndex].quantity = quantity;

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Cart item quantity updated successfully' });
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


// function to apply a coupon to the cart

const applyCoupon = async (req, res) => {
    try {
        const { code } = req.query; // Get the coupon code from the query parameters
        
        // Find the coupon by code
        const coupon = await Coupon.findOne({ code });

        // Check if the coupon exists and is valid
        if (!coupon || new Date() > coupon.expirationDate) {
            return res.status(400).json({ message: 'Invalid coupon code or expired' });


        }

        // Get the user's cart
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ userId }).populate('items.product'); // Populate the product details
        // Calculate the total amount of the products in the cart
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.product.price; // Calculate the total amount
        });

        if (totalAmount < coupon.minimumPurchaseAmount) {
            return res.status(400).json({ message: `Minimum purchase amount of ${coupon.minimumPurchaseAmount} not met` });


        }

        // Check if the total amount of the cart is greater than or equal to the coupon amount
        if (totalAmount < coupon.discountAmount) {
            return res.status(400).json({ message: `Total amount of the cart is less than the coupon amount` });
        }


        let discountedTotalAmount;

        if (coupon.discountType === 'fixed') {
            discountedTotalAmount = Math.max(totalAmount - coupon.discountAmount,0);

        } else if (coupon.discountType === 'percentage') {
            // If discount type is percentage, calculate the discount percentage
            const discountPercentage = coupon.discountPercentage / 100;
            // Subtract the discounted amount from the total amount
            // discountedTotalAmount = totalAmount * (1 - discountPercentage);
            let discountAmount = totalAmount * discountPercentage;
            
            // Check if the calculated discount amount exceeds the maximum discount allowed
            if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
                discountAmount = coupon.maximumDiscountAmount; // Apply maximum discount amount if exceeded
            }
            
            discountedTotalAmount = Math.max(totalAmount - discountAmount, 0); 

        }

        cart.coupon = coupon._id;
        cart.totalAmount = Math.round(discountedTotalAmount);
        


        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Coupon applied successfully', totalAmount, discountedTotalAmount });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Controller function to remove a coupon from the cart
const removeCoupon = async (req, res) => {
    try {
        // Get the user's cart
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ userId }).populate('items.product');

        // Check if the cart exists
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Remove the coupon from the cart
        cart.coupon = null;

        // Calculate the total amount of the products in the cart
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.product.price; // Calculate the total amount
        });
        cart.totalAmount = totalAmount;

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Coupon removed successfully', totalAmount });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





const loadcheckout = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user_id;

        // Fetch user details based on the user ID
        const user = await User.findById(userId);
        const addresses = await Address.find({ user: userId });

        // Initialize cart as an empty object
        let cart = { items: [] };

        // Calculate total amount
        let totalAmount = 0;

        // Check if there's a specific order ID in the query parameters
        const orderId = req.query.orderId;
        

        if (orderId) {
            try {
                // If an order ID is provided, find the order
                const order = await Order.findById(orderId).populate('items.product');
                if (!order || order.user.toString() !== userId) {
                    // If the order doesn't exist or doesn't belong to the current user, return an error or handle it appropriately
                    return res.status(404).send('Order not found or unauthorized access');
                }
                // Set cart to items from the order
                cart = {
                    items: order.items.map(item => ({
                        product: item.product,
                        quantity: item.quantity
                    }))
                };
                
                // Calculate total amount from order items
                totalAmount = order.totalAmount;
                
            } catch (error) {
                console.error('Error finding order:', error);
                return res.status(500).send('Internal Server Error');
            }
        } else {
            // If no order ID, fetch the user's cart
            cart = await Cart.findOne({ userId }).populate('items.product');
            if (cart) {
                // Calculate total amount from cart items
                cart.items.forEach(item => {
                    totalAmount += item.quantity * item.product.price;
                });
            }
        }

        // Check for cart coupon and adjust total amount if applicable
        if (cart && cart.coupon) {
            totalAmount = cart.totalAmount; // Use the discounted total amount from the cart if a coupon is applied
        }
       
        const message = req.flash('message');

        // Define rendering data
        let renderingData = {
            title: 'checkout',
            cart,
            totalAmount,
            addresses,
            user,
            message: message
        };

        // Add orderId to rendering data if it exists
        if (orderId) {
            renderingData.orderId = orderId;
            
        }
        
        
        // Render the checkout page with cart or order details
        res.render('./user/checkout', renderingData);

    } catch (error) {
        console.error('Error loading checkout:', error);
        res.status(500).send('Internal Server Error');
    }
}




const checkoutAddress = async (req, res) => {
    try {
        // Get the user ID from the session
        const userId = req.session.user_id;
        // Fetch user details based on the user ID
        const user = await User.findById(userId);
        const addresses = await Address.find({ user: userId });
        if (!user) {
            
            
            req.flash('message', 'User not found');
            return res.redirect('/login');
        }
        const message = req.flash('message');
        // Render the page and pass user data to the template
        res.render('./user/checkoutedit', { title: 'Address', user, addresses, message: message });

    } catch (error) {
        console.log(error.message)
    }
}




// Create a new instance of Razorpay with your Razor Pay API Key ID and Secret
var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});



const razororder = async (req, res) => {
    try {
        // Extract the total amount from the request body
        const { totalAmount } = req.body;
        // Get user ID from session
        const userId = req.session.user_id;
        // Create Razorpay order
        const options = {
            amount: totalAmount * 100, // Amount in paisa
            currency: 'INR',
            receipt: 'order_' + userId, // Receipt ID
        };

        // Create the order
        const razorpayOrder = await instance.orders.create(options);
        

        // Send the Razorpay order ID back to the client
        res.json({ orderId: razorpayOrder.id });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        // Handle error
        res.status(500).json({ error: 'Error creating Razorpay order' });
    }
};




// process the oder
const processOrder = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user_id;

        // Fetch user details based on the user ID
        const user = await User.findById(userId);
        if (!user) {
            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

       
        // Fetch cart details for the user
        let cart;
       // Fetch cart details for the user if no orderId is present
       if (!req.body.orderId) {
        cart = await Cart.findOne({ userId }).populate('items.product');
    }
        

        // Get the selected payment method from the request body
        const paymentMethod = req.body.payMethod;
        

        // Get the selected address ID from the request body
        const addressId = req.body.addressId;
        
        // Extract the order ID from the request body
        const orderId = req.body.orderId;
        

        // Fetch the address based on the address ID
        const address = await Address.findById(addressId);
        if (!address) {
            // req.flash('message', 'Address not found');
            console.log("address not found")
            return res.redirect('/cart/checkout');
        }

 // Check if an order ID is present
 if (orderId) {
    
    try {
        // Find the existing order by its ID
        const existingOrder = await Order.findById(orderId).populate('items.product');
        if (!existingOrder || existingOrder.user.toString() !== userId) {
            // If the order doesn't exist or doesn't belong to the current user, return an error or handle it appropriately
            req.flash('message', 'Order not found or unauthorized access');
            return res.redirect('/cart');
        }

    
        // Update the existing order details
        existingOrder.paymentMethod = paymentMethod;
        existingOrder.address = address;
        existingOrder.status = 'Pending'; 

          // Check if payment method is Razorpay and payment was not successful
          if (paymentMethod === 'Razorpay' && req.body.paymentSuccess === 'false') {
           
            // Set the status as "Payment Pending"
            existingOrder.status = 'Payment Pending';
            // Save the updated order
            await existingOrder.save();
            // Redirect or handle the failure appropriately
            return res.redirect('/payment-failure');
        }
        
           // Check if paymentMethod is "Cash On Delivery" and total amount is greater than 1000
           if (paymentMethod === 'Cash On Delivery' && existingOrder.totalAmount>1000) {
           
                req.flash('message', 'Cash on Delivery is not available for orders greater than 1000.');
                
                return res.redirect(`/cart/checkout?orderId=${existingOrder._id}`);
            
        }

        // Save the updated order
        await existingOrder.save();

        // Redirect to a confirmation page
        return res.redirect('/confirmation');
    } catch (error) {
        console.error('Error updating existing order:', error);
        req.flash('message', 'Error processing order');
        return res.redirect('/cart');
    }
} 

        // Calculate total amount
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.product.price;
        });
    
        let discountedTotalAmount = totalAmount; // Default to total amount if no coupon applied
        if (cart.coupon) {
            // If a coupon is applied, use the discounted total amount from the cart
            discountedTotalAmount = cart.totalAmount;
            // Set the totalAmount to the discountedTotalAmount if a coupon is applied
            totalAmount = discountedTotalAmount;
        }

        // Check if paymentMethod is "Cash On Delivery" and total amount is greater than 1000
        if (paymentMethod === 'Cash On Delivery' && totalAmount > 1000) {
            req.flash('message', 'Cash on Delivery is not available for orders greater than 1000.');
            return res.redirect('/cart/checkout');
        }


           
            // Create an order based on the cart items and the selected address
            const order = new Order({
                user: userId,
                items: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price,
                    totalPrice: item.quantity * item.product.price
                })),
                totalAmount: totalAmount,
                paymentMethod: paymentMethod,
                address: address, // save the selected address
                status: 'Pending',
                coupon: cart.coupon

            });


            // Check if payment method is Razorpay and payment was not successful
            if (paymentMethod === 'Razorpay' && req.body.paymentSuccess === 'false') {

                
                // Set payment status as "pending"
               
                order.status = 'Payment Pending';
               
                try {
                    // Save the order with pending payment status
                    const savedOrder = await order.save();
                    
                    

                } catch (error) {
                    console.error('Error saving order:', error);
                    // Handle error saving order
                    return res.status(500).send('Error saving order');
                }

            }

            // Save the order
            await order.save();
        
        // Decrease stock quantity of products in the order
        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stockQuantity -= item.quantity;
                await product.save();
            }
        }

       
        if (cart) {
        await Cart.deleteOne({ userId });
        }
        // Redirect to a confirmation page
        res.redirect('/confirmation');

    } catch (error) {
        console.error('Error processing order:', error);
        
        res.status(500).send('Error processing order');
    }


};






// payment confirmation page
const loadConfirmationPage = async (req, res) => {
    try {

        res.render('./user/confirmation', { title: 'confirmation', });


    } catch (error) {
        console.log(error.message)
    }
}

// payment failure page
const loadFailurePage = async (req, res) => {
    try {

        res.render('./user/failure', { title: 'Failed' });


    } catch (error) {
        console.log(error.message)
    }
}




module.exports = {
    addToCart,
    removeFromCart,
    updateFromCart,
    loadCart,
    loadcheckout,
    checkoutAddress,
    processOrder,
    loadConfirmationPage,
    applyCoupon,
    removeCoupon,
    razororder,
    loadFailurePage
};
