var express = require('express');
var router = express.Router();
const session = require('express-session')
const { v4: uuidv4 } = require('uuid');
// require('dotenv').config();
// Import required modules and models
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/googleModel');
const userController = require("../controllers/userController")
const detailController = require("../controllers/productdetail")
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const walletController = require('../controllers/walletController')
const couponController=require('../controllers/couponController')
const wishlistController = require('../controllers/wishlistController')
const validator = require("../middleware/userValidation")
const userAuth =require("../middleware/userAuth")
const userBlock = require("../middleware/checkBlocked")
const flash = require('connect-flash');

router.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  }));

  
// Initialize Passport and restore authentication state, if any, from the session
router.use(passport.initialize());
router.use(passport.session());



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/auth/google/callback" // Set your callback URL
  },
  async function(accessToken, refreshToken, profile, done) {
    // Check if user exists in database
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // If user doesn't exist, create a new user
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        // You may want to add more fields here if needed
      });
    }

    return done(null, user);
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Google authentication route
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

// Google authentication callback route
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });





  


/* GET home page. */
router.get('/', userAuth.islogout, userController.loadHome)
// land page after login
router.get('/home', userAuth.islogin,userBlock.checkBlocked, userController.Home)

// login
router.get('/login', userAuth.islogout,userController.loadLogin)
// signup
router.get('/signup',userAuth.islogout,userController.loadSignup)
// verify login
router.post('/login', userController.verifyLogin)
// verify signup
router.post('/signup', validator.signupValidation, validator.validate, userController.insertUser)

// otp
router.post('/send-otp', userController.sendOtp)
router.get('/otp-page', userController.loadOtppage)
router.post('/verify', userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)
router.get('/products/details/:id', userAuth.islogin,detailController.getProductDetails)
router.get('/products/list',userController.loadProducts)


// user profile
router.get('/profile',userAuth.islogin,userController.loadProfile)
router.get('/profile/address',userAuth.islogin,userController.loadAddress)
router.post('/profile/address',userController.addAddress)
router.delete('/profile/address/:id',userController.deleteAddress)
router.get('/profile/edit',userAuth.islogin,userController.loadEdituser)
router.post('/profile/change-password',userController.changePassword)
router.post('/profile/edit-user', userController.editUser);

// profile orders
router.get('/profile/orders',userAuth.islogin,orderController.getOrderHistory)
router.post('/profile/orders/cancel/:id',orderController.cancelOrder);
router.post('/profile/orders/return/:id', orderController.returnOrder);

//invoice
router.get('/profile/orders/invoice/:id',orderController.downloadInvoice)

//profile wallet
router.get('/profile/wallet',userAuth.islogin,walletController.renderWallet)
router.get('/profile/coupons',userAuth.islogin,couponController.couponList)

router.post('/wallet/add-money',walletController.addMoneyToWallet)
router.post('/wallet/stripe-webhook',walletController.handleStripeWebhook)

// cart
router.get('/cart',userAuth.islogin,cartController.loadCart)
router.post('/cart/add',cartController.addToCart)
router.get('/cart/remove/:id',userAuth.islogin,cartController.removeFromCart)
router.put('/cart/update/:id',cartController.updateFromCart)

// coupon
router.post('/cart/applyCoupon',cartController.applyCoupon)
router.post('/cart/removeCoupon',cartController.removeCoupon)

// checkout
router.get('/cart/checkout',userAuth.islogin,cartController.loadcheckout)
router.get('/cart/checkout/edit',userAuth.islogin,cartController.checkoutAddress)
router.post('/cart/checkout/process',cartController.processOrder)
// razor pay
router.post('/create/orderId',cartController.razororder)
// confirmation page
router.get('/confirmation',userAuth.islogin,cartController.loadConfirmationPage)

//failed payment
router.get('/payment-failure',userAuth.islogin,cartController.loadFailurePage)

// wishlist
router.get('/wishlist',userAuth.islogin,wishlistController.renderWishlist)
router.post('/wishlist/add',wishlistController.addToWishlist)
router.post('/wishlist/remove',wishlistController.removeFromWishlist)


// logout
router.post('/logout',userController.logout)



module.exports = router;
