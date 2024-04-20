
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel')
const User = require("../models/userModel");
const { Address } = require('../models/addressModel')
const Order = require("../models/orderModel")
const Wallet = require('../models/walletModel');
const Offer = require('../models/offerModel')
const ReferralOffer = require('../models/refferalOfferModel')



// load offer page of admin side
const loadOffers = async (req, res) => {
    try {
        // Fetch offers from the database

        const offers = await Offer.find().populate('targetId');
        const message = req.flash('message');
        res.render('./admin/offer', { title: 'Offers', offers, message: message });

    } catch (error) {
        console.log(error.message)
    }
}


// form for creating category offer
const categoryOfferForm = async (req, res) => {
    try {

        // Fetch categories from the database
        const categories = await Category.find();
        const message = req.flash('message');
        res.render('./categories/categoryOffer', { title: 'Category Offer', categories, message: message });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}



// Route handler to apply an offer to a category
const applyOfferToCategory = async (req, res) => {
    try {
        // Extract data from request body
        const { category, discountPercentage, startDate, endDate } = req.body;

        // Find the category by ID
        const targetCategory = await Category.findById(category);

        if (!targetCategory) {
            return res.status(404).send('Category not found');
        }
        // Check if an offer already exists for the specified category
        const existingOffer = await Offer.findOne({ type: 'Category', targetId: category });

        if (existingOffer) {
            // If an offer already exists, send a message indicating that the offer already exists
            req.flash('message', 'An offer already exists for this category.');
            // Redirect back to the form page without further processing
            return res.redirect('/admin/offer/apply-offer-to-category');
        }
        // Create the offer object
        const newOffer = new Offer({
            type: 'Category',
            targetId: category,
            discountPercentage,
            startDate,
            endDate
        });

        // Save the offer to the database
        await newOffer.save();

        // Find all products in the category
        const productsToUpdate = await Product.find({ category });
        const offerId = newOffer._id; 
        // Update prices of products
        for (const product of productsToUpdate) {

            // Store the original price before applying the offer
            product.originalPrice = product.price;
            // Calculate the discounted price based on the discount percentage
            const discountedPrice = product.price - (product.price * discountPercentage) / 100;

            // Round the discounted price to the nearest whole number
            const roundedDiscountedPrice = Math.round(discountedPrice);
            // Update the product's price
            product.price = roundedDiscountedPrice;
            product.offers.push(offerId);
            // Save the updated product
            await product.save();
        }

        req.flash('message', 'Offer applied successfully');
        // res.status(201).send('Offer applied successfully');
        res.redirect('/admin/offer')
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



// Route handler to delete an offer
const deleteOffer = async (req, res) => {
    try {
        // Extract offer ID from request parameters
        const { id } = req.params;

        // Find the offer by ID
        const offerToDelete = await Offer.findById(id);

        if (!offerToDelete) {
            // If the offer is not found, send a 404 error
            return res.status(404).send('Offer not found');
        }
        
        // Restore prices of products affected by the offer
        const productsToUpdate = await Product.find({ category: offerToDelete.targetId });
        
        for (const product of productsToUpdate) {
            // Restore the original price
            product.price = product.originalPrice;

            // Save the updated product
            await product.save();

        }

        // Delete the offer from the database
        await Offer.findByIdAndDelete(id);

        req.flash('message', 'Offer deleted successfully');
        res.redirect('/admin/offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


// Route handler to render the edit offer form
const renderEditOfferForm = async (req, res) => {
    try {
        // Extract offer ID from request parameters
        const { id } = req.params;

        // Find the offer by ID
        const offer = await Offer.findById(id);

        if (!offer) {
            // If the offer is not found, send a 404 error
            return res.status(404).send('Offer not found');
        }

        // Render the edit offer form with the offer data
        res.render('./categories/categoryOfferEdit', { title: 'Edit Offer', offer });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


// update the offer
const updateOffer = async (req, res) => {
    try {
        // Extract offer ID from request parameters
        const { id } = req.params;


        // Find the offer by ID
        const offerToUpdate = await Offer.findById(id);

        if (!offerToUpdate) {
            // If the offer is not found, send a 404 error
            return res.status(404).send('Offer not found');
        }
        // Extract updated offer data from request body
        const { discountPercentage, startDate, endDate } = req.body;


        // Update the offer properties with new data
        offerToUpdate.discountPercentage = discountPercentage;
        offerToUpdate.startDate = startDate;
        offerToUpdate.endDate = endDate;

        // Save the updated offer to the database
        await offerToUpdate.save();


        // Update product prices if the offer is for a category
        if (offerToUpdate.type === 'Category') {
            const productsToUpdate = await Product.find({ category: offerToUpdate.targetId });

            for (const product of productsToUpdate) {
                product.originalPrice = product.originalPrice;
                const discountedPrice = product.price - (product.price * discountPercentage) / 100;
                // Round the discounted price to the nearest whole number
                const roundedDiscountedPrice = Math.round(discountedPrice);
                product.price = roundedDiscountedPrice;
                await product.save();
            }
        }


        req.flash('message', 'Offer updated successfully');
        res.redirect('/admin/offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




// load referral offers page of admin side
const loadReferralOffers = async (req, res) => {
    try {
        const referralOffers = await ReferralOffer.find()
        const message = req.flash('message');
        res.render('./admin/referralOffer', { title: 'Referral Offers', referralOffers, message });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}


// form for creating referral offer
const referralOfferForm = async (req, res) => {
    try {
        const message = req.flash('message');
        res.render('./admin/createreferralForm', { title: 'Referral Offer', message: message });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}

// Route handler to apply a referral offer
const applyReferralOffer = async (req, res) => {
    try {
        const { referrerReward, refereeReward, startDate, endDate } = req.body;

        const newReferralOffer = new ReferralOffer({
            referrerReward,
            refereeReward,
            startDate,
            endDate
        });

        await newReferralOffer.save();

        req.flash('message', 'Referral offer applied successfully');
        res.redirect('/admin/referral-offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Route handler to delete a referral offer
const deleteReferralOffer = async (req, res) => {
    try {
        const { id } = req.params;

        await ReferralOffer.findByIdAndDelete(id);

        req.flash('message', 'Referral offer deleted successfully');
        res.redirect('/admin/referral-offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadOffers,
    categoryOfferForm,
    applyOfferToCategory,
    deleteOffer,
    renderEditOfferForm,
    updateOffer,
    loadReferralOffers,
    referralOfferForm,
    applyReferralOffer,
    deleteReferralOffer

}

