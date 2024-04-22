// userController
const User = require("../models/userModel");
const Otp = require("../models/otp");
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
// const mailer = require('../helpers/mailer')
const { sendMail } = require('../helpers/mailer');
const { oneMinuteExpiry, threeMinuteExpiry } = require("../helpers/otpValidate")
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const { Address } = require('../models/addressModel')
const passport = require('passport');
const Wishlist = require('../models/wishlistModel')
const Order = require("../models/orderModel")
const Cart = require('../models/cartModel')


// hashing password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}


// loading front Page
const loadHome = async (req, res) => {
    try {
        // Fetch all categories from the database
        const categories = await Category.find({ _issoftdeleted: false });

        // Create an array to store category-wise product data
        const categoryProducts = [];

        // Iterate over each category
        for (const category of categories) {
            // Fetch products for the current category
            const products = await Product.find({ category: category._id, is_softdeleted: false });

            // Push category and its associated products to the array
            categoryProducts.push({ category, products });
        }
        // Check if the user is logged in
        const loggedInUserId = req.session.user_id;
        let loggedInUserName = null;



        if (loggedInUserId) {
            const loggedInUser = await User.findById(loggedInUserId);
            loggedInUserName = loggedInUser.name;
        }


        res.render('./user/home', { title: 'Audio Booth', categoryProducts });


    } catch (error) {
        console.log(error.message)
    }
}



//landing page after successfull login
const Home = async (req, res) => {
    try {


        // Default values for filters
        const { search = '', sort: sortOrder = '', showOutOfStock = '', category = '' } = req.query;
        
        let query = { is_softdeleted: false };
        if (search) {

            const regex = new RegExp(search, 'i');

            
            query.name = regex;

        }

        
        if (showOutOfStock !== 'true') {
            query.stockQuantity = { $gt: 0 };
        }
        
        if (category) {
            query.category = category;
        }

        
        let sort = {};

        // Sorting functionality
        if (sortOrder === 'priceLowToHigh') {
            sort.price = 1; // Sort by price in ascending order
        } else if (sortOrder === 'priceHighToLow') {
            sort.price = -1; // Sort by price in descending order
        } else if (sortOrder === 'nameAToZ') {
            sort.name = 1; // Sort by name in ascending order
        } else if (sortOrder === 'nameZToA') {
            sort.name = -1; // Sort by name in descending order
        } else if (sortOrder === 'newest') {
            sort.createdAt = -1; // Sort by createdAt field in descending order
        }


        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const perPage = 9; // Number of products per page
        const skip = (page - 1) * perPage;

        // Fetch all products from the database with search, sort, and availability criteria
        const products = await Product.find(query)
            .populate('offers')
            .sort(sort)
            .skip(skip)
            .limit(perPage);
        // Calculate total number of products for pagination
        const totalProducts = await Product.countDocuments(query);

        // Calculate total number of pages
        const totalPages = Math.ceil(totalProducts / perPage);

        // Fetch categories from the database
        const categories = await Category.find();

        // Check if the user is logged in
        const loggedInUserId = req.session.user_id;
        let loggedInUserName = null;



        if (loggedInUserId) {
            const loggedInUser = await User.findById(loggedInUserId);
            loggedInUserName = loggedInUser.name;
        }


        res.render('./user/landHome', { title: 'Audio Booth', products, loggedInUserName, categories, totalPages, currentPage: page, selectedCategory: category });


    } catch (error) {
        console.log(error.message)
    }
}


// loading login page

const loadLogin = async (req, res) => {
    try {
        const message = req.flash('message');
        res.render('./user/login', { title: 'login', message: message });



    } catch (error) {
        console.log(error.message)
    }
}


// load signup

const loadSignup = async (req, res) => {
    try {
        const message = req.flash('message')[0];
        res.render('./user/signup', { title: 'Sign Up', message: message });

    } catch (error) {
        console.log(error.message)
    }
}


// adding user
const insertUser = async (req, res) => {
    try {
        const password = await securePassword(req.body.password);
        const existingUser = await User.findOne({ email: req.body.email });


        // Check if user exists
        if (existingUser) {
            // If the existing user is not verified, update their information and resend OTP
            if (existingUser.is_verified === 0) {
                existingUser.name = req.body.name;
                existingUser.password = password;
                await existingUser.save();
                await sendOtp(req, res, existingUser.email);


            } else {
                // If the existing user is already verified, prompt them to login
                req.flash('message', 'Existing User please login');
                return res.redirect('/login');
            }
        } else {
            // Create a new user
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                password: password,
                phone: req.body.phone,
                is_user: 1,
                is_blocked: false,
                is_verified: 0
            });

            const userData = await user.save();
            if (userData) {


                await sendOtp(req, res, userData.email);



            } else {

                req.flash('message', 'Registration Failed');
                
                res.redirect('/signup');


            }
        }

    } catch (error) {
        res.send(error.message);
    }
}


// load otp page
const loadOtppage = async (req, res) => {
    try {


        const message = req.flash('message');
        res.render('./user/otp', { title: 'otp', message: message });

    } catch (error) {
        console.log(error.message)
    }
}




// otp generation

const generate4Digit = async () => {
    return Math.floor(1000 + Math.random() * 9000)
}


// otp sending
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body

        const userData = await User.findOne({ email })
        if (!userData) {

            return res.redirect('/signup');
        }
        if (userData.is_verified == 1) {


            req.flash('message', 'Existing User please login');
            return res.redirect('/login');
        }



        const g_Otp = await generate4Digit()

        const cDate = new Date();
        req.session.Data = userData;
        await Otp.findOneAndUpdate(
            { user_id: userData._id },
            { otp: g_Otp, timestamp: new Date(cDate.getTime()) },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        const msg = '<p> Hii <b>' + userData.name + '</b>,<h4> Otp For Audio booth </h4></br> <h4>' + g_Otp + '</h4> </p>';


        await sendMail(userData.email, 'otp verification', msg);
        return res.redirect('/otp-page');



    } catch (error) {
        console.log(error.message)
    }
}


//resend otp 
const resendOtp = async (req, res) => {
    try {
        
        // Retrieve user data from session or request body, whichever applicable
        const userData = req.session.Data || req.body.userData;

        


        // Check if user data is available
        if (!userData) {
            return res.status(400).json({ success: false, msg: 'User data not found' });
            
        }

        // Check if the user is already verified
        if (userData.is_verified === 1) {

            

            return res.status(400).json({ success: false, msg: 'User is already verified' });
        }

        // Check if the user has OTP data
        const oldOtpData = await Otp.findOne({ user_id: userData._id });

        

        if (!oldOtpData) {

            

            return res.status(400).json({ success: false, msg: 'OTP data not found' });
        }

        // Check if it's been at least one minute since the last OTP was sent
        const isExpired = await oneMinuteExpiry(oldOtpData.timestamp);

        
        if (!isExpired) {

            return res.status(400).json({ success: false, msg: 'Please wait before requesting a new OTP' });
        }

        // Generate new OTP
        const newOtp = await generate4Digit();

        

        // Update OTP data in the database
        await Otp.findOneAndUpdate(
            { user_id: userData._id },
            { otp: newOtp, timestamp: new Date() },
            { new: true }
        );

        // Send the new OTP to the user's email
        const msg = `<p>Hi ${userData.name},</p><p>Your new OTP is: <strong>${newOtp}</strong></p>`;
        await sendMail(userData.email, 'OTP Verification', msg);

        
        // Respond with success message
        return res.status(200).json({ success: true, msg: 'New OTP sent successfully' });


    } catch (error) {
        console.error('Error in resendOtp:', error);

    }
};


// verify otp
const verifyOtp = async (req, res) => {
    try {
        const otp1 = req.body.otp1
        const otp2 = req.body.otp2
        const otp3 = req.body.otp3
        const otp4 = req.body.otp4

        const inputotp = otp1 + otp2 + otp3 + otp4



        const userData = req.session.Data;
        const otpData = await Otp.findOne({ user_id: userData._id })
        if (!otpData) {

            req.flash('message', 'Invalid Otp');
            return res.redirect('/otp-page');
        }

        if (inputotp !== otpData.otp.toString()) {

            req.flash('message', 'Invalid Otp');
            return res.redirect('/otp-page');
        }

        const isOtpExpired = await threeMinuteExpiry(otpData.timestamp);
        if (isOtpExpired) {
            console.log("otp expired")

            req.flash('message', 'otp expired');
            return res.redirect('/otp-page');
        }

        await User.findByIdAndUpdate({ _id: userData._id }, {
            $set: {
                is_verified: 1
            }
        })

        req.flash('message', 'Otp verified succesfully!')
        return res.redirect('/login');


    } catch (error) {
        console.log(error.message)
    }
}


// verify login
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email })
        if (!userData) {
            req.flash('message', 'Invalid email or password');
            return res.redirect('/login')

        }
        const passwordMatch = await bcrypt.compare(password, userData.password)
        if (!passwordMatch) {

            req.flash('message', 'Invalid email or password');
            return res.redirect('/login');
        }
        if (userData.is_blocked) {


            req.flash('message', 'Your account has been blocked. Please contact support for assistance.');
            return res.redirect('/login');

        }

        // Authentication successful
        req.session.user_id = userData._id;
        res.redirect('/home');


    } catch (error) {
        console.log(error.message)
    }
}



// load user profile

const loadProfile = async (req, res) => {
    try {
        // Get the user ID from the session
        const userId = req.session.user_id;
        // Fetch user details based on the user ID
        const user = await User.findById(userId);
        if (!user) {


            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

        // Fetch the number of items in wishlist, cart, and pending orders
        const wishlistCount = await Wishlist.countDocuments({ user: userId });
        // Fetch the cart for the user
        const cart = await Cart.findOne({ userId }).populate('items.product');

        // Calculate the total number of items in the cart
        let cartItemCount = 0;
        if (cart) {
            cart.items.forEach(item => {
                cartItemCount += item.quantity;
            });
        }
        const pendingOrdersCount = await Order.countDocuments({ user: userId, status: 'pending' });
        // Render the profile page and pass user data to the template
        res.render('./user/profile', { title: 'profile', user, wishlistCount, pendingOrdersCount, cartItemCount });

    } catch (error) {
        console.log(error.message)
    }
}



// address from user profile
const loadAddress = async (req, res) => {
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

        res.render('./user/address', { title: 'Address', user, addresses, message: message });

    } catch (error) {
        console.log(error.message)
    }
}


// add address from user profile
const addAddress = async (req, res) => {
    try {
        // console.log(req.body)
        const { type, street, city, state, postalCode } = req.body;
        const userId = req.session.user_id;
        // Check if an address ID is provided in the form (for editing existing address)
        const addressId = req.body.addressId;

        if (addressId) {
            // Editing existing address
            const addressToUpdate = await Address.findById(addressId);

            if (!addressToUpdate) {
                return res.status(404).send('Address not found');
            }
            // If the address type is being changed, check if there's another address with the same type
            if (addressToUpdate.type !== type) {
                const existingAddress = await Address.findOne({ user: userId, type });
                if (existingAddress) {
                    req.flash('message', 'You can only add one address of each type (Home/Office)');
                    return res.redirect('/profile/address');

                }
            }
            // Update existing address
            await Address.findByIdAndUpdate(addressId, { type, street, city, state, postalCode });
        } else {
            // Check if the user already has an address of the given type
            const existingAddress = await Address.findOne({ user: userId, type });
            if (existingAddress) {

                req.flash('message', 'You can only add one address of each type (Home/Office)');
                return res.redirect('/profile/address');

            }

            // Create new address

            const address = new Address({ user: userId, type, street, city, state, postalCode });
            await address.save();

        }

        // Redirect to the address management page
        res.redirect('/profile/address');
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).send('Error saving address');
    }
}

// delete address from user profile
const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        // Find the address by ID and delete it
        const deletedAddress = await Address.findByIdAndDelete(addressId);

        if (!deletedAddress) {
            // If address with the given ID is not found, return 404 Not Found
            return res.status(404).send('Address not found');
        }

        // Send a success response
        req.flash('message', 'Address deleted successfully');
        return res.redirect('/profile/address');

    } catch (error) {
        // If an error occurs, send a 500 Internal Server Error response
        console.error('Error deleting address:', error);
        res.status(500).send('Error deleting address');
    }
};


// edit address from user profile
const loadEdituser = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
        // Fetch user details based on the user ID
        const user = await User.findById(userId);
        if (!user) {


            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

        const message = req.flash('message');

        // Render the page and pass user data 
        res.render('./user/editUser', { title: 'Edit profile', user, message: message });

    } catch (error) {
        console.log(error.message)
    }
}



// Change password
const changePassword = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user_id;
        // Fetch user details
        const user = await User.findById(userId);
        
        if (!user) {
            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

        
        // Extract current and new password
        const { currentPassword, newPassword } = req.body;


        // Verify if the current password matches the stored password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            req.flash('message', 'Current password is incorrect');
            return res.redirect('/profile/edit');
        }


        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        user.password = hashedPassword;

        // Save the updated user details
        await user.save();

        
        req.flash('message', 'Password changed successfully');


        return res.json({ success: true });

    } catch (error) {
        console.log(error.message);
        
        req.flash('message', 'Error changing password');
        res.redirect('/profile/edit');
    }
}


const editUser = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user_id;
        // Fetch user details
        const user = await User.findById(userId);
        if (!user) {
            req.flash('message', 'User not found');
            return res.redirect('/login');
        }

        // Extract name from the request body
        const { name, phone } = req.body;

        // Update user's name
        user.name = name;
        user.phone = phone
        // Save the updated user details
        await user.save();

        // Respond with success message
        req.flash('message', 'User details updated');
        res.json({ success: true });



    } catch (error) {
        console.log(error.message);
        // Handle errors appropriately
        req.flash('message', 'Error updating user details');
        res.redirect('/profile/edit');
    }
}




// load products
const loadProducts = async (req, res) => {
    try {


        // Default values for filters
        const { search = '', sort: sortOrder = '', showOutOfStock = '', category = '' } = req.query;
        // Constructing the base query
        let query = { is_softdeleted: false };

        if (search) {

            const regex = new RegExp(search, 'i');


            query.name = regex;

        }


        if (showOutOfStock !== 'true') {
            query.stockQuantity = { $gt: 0 };
        }
        // Filter by category if provided
        if (category) {
            query.category = category;
        }


        let sort = {};

        // Sorting functionality with category consideration
        if (sortOrder) {
            if (sortOrder === 'priceLowToHigh') {
                sort.price = 1;
            } else if (sortOrder === 'priceHighToLow') {
                sort.price = -1;
            } else if (sortOrder === 'nameAToZ') {
                sort.name = 1;
            } else if (sortOrder === 'nameZToA') {
                sort.name = -1;
            } else if (sortOrder === 'newest') {
                sort.createdAt = -1;
            }
        }

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const perPage = 9; // Number of products per page
        const skip = (page - 1) * perPage;


        // Fetch all products from the database with search, sort, and availability criteria
        const products = await Product.find(query)
            .populate('offers')
            .sort(sort)
            .skip(skip)
            .limit(perPage);

        // Calculate total number of products for pagination
        const totalProducts = await Product.countDocuments(query);

        // Calculate total number of pages
        const totalPages = Math.ceil(totalProducts / perPage);

        // Fetch categories from the database
        const categories = await Category.find();


        res.render('./user/productList', { title: 'Products', products, categories, totalPages, currentPage: page, selectedCategory: category })
    } catch (error) {
        // Handle errors
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// logout

const logout = (req, res) => {
    if (req.session.user_id) {
        delete req.session.user_id;

    }
    res.redirect('/');

}



module.exports = {

    loadHome,
    Home,
    loadLogin,
    loadSignup,
    insertUser,
    verifyLogin,
    sendOtp,
    verifyOtp,
    loadOtppage,
    logout,
    resendOtp,
    loadProfile,
    loadAddress,
    addAddress,
    deleteAddress,
    loadEdituser,
    changePassword,
    editUser,
    loadProducts


}

