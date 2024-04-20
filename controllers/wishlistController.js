const User = require('../models/userModel')
const Wishlist = require('../models/wishlistModel')

// Function to render wishlist view
const renderWishlist = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
        
       
        // Fetch the user record based on the user ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }


        let wishlist = await Wishlist.find({user: userId}).populate('product');
        
        res.render('./user/wishlist', {title:"Wishlist",wishlist });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


//function to add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user_id;
        // Check if the product is already in the wishlist
        const existingWishlistItem = await Wishlist.findOne({ user: userId, product: productId });
        if (existingWishlistItem) {
            return res.status(400).json({ message: 'Product already in the wishlist' });
        }
        // Add product to the wishlist
        const newWishlistItem = new Wishlist({ user: userId, product: productId });
        await newWishlistItem.save();
        res.status(200).json({ message: 'Product added to wishlist successfully' });
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Function to remove a product from the wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user_id;
        
       // Find and remove the wishlist item
       await Wishlist.findOneAndDelete({ user: userId, product: productId });


        
        res.redirect('/wishlist')
        
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
    renderWishlist,
    addToWishlist,
    removeFromWishlist
};

