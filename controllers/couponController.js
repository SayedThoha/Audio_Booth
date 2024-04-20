const Coupon = require('../models/couponModel');


const renderCoupon = async (req, res) => {
    try {

        // Fetch all coupons from the database
        const coupons = await Coupon.find();
        res.render('./admin/coupons', { title: 'Coupons', coupons });

    } catch {
        console.log(error.message)

    }
}



const renderCouponForm = async (req, res) => {
    try {

        res.render('./admin/createCoupon', { title: 'Create Coupon' });

    } catch {
        console.log(error.message)

    }
}

// Function to create a new coupon
const createCoupon = async (req, res) => {
    try {
        
        // Retrieve coupon details from the request body
        const { code, discountType, discountAmount, percentageDiscount, expirationDate, minimumPurchaseAmount, maximumDiscountAmount } = req.body;

        let calculatedDiscountAmount;
        let discountPercentage;
        
        
        // Check if the discount type is 'fixed' or 'percentage' 
        if (discountType === 'fixed') {
            // For fixed discount, use the provided discount amount directly
            calculatedDiscountAmount = parseFloat(discountAmount);
        } else if (discountType === 'percentage') {
            
            discountPercentage = parseFloat(percentageDiscount);

        } else {
            // Handle invalid discount type
            throw new Error('Invalid discount type');
        }


        // Create a new coupon instance using your Coupon model
        const newCoupon = new Coupon({
            code,
            discountType,
            discountAmount: calculatedDiscountAmount,
            discountPercentage, // Include the percentage directly if it's a percentage discount
            expirationDate: new Date(expirationDate),
            minimumPurchaseAmount,
            maximumDiscountAmount
        });

        // Save the coupon to the database
        await newCoupon.save();

        // Redirect to the coupon list page or display a success message
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}



// Delete coupon
const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        // Find the coupon by ID and delete it
        await Coupon.findByIdAndDelete(couponId);
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};



// coupon listing for user
const couponList = async (req, res) => {
    try {
        // Fetch coupons from the database
        const coupons = await Coupon.find();
        res.render('./user/couponlist', { title: 'Coupon', coupons });

    } catch {
        console.log(error.message)

    }
}


module.exports = {
    renderCoupon,
    renderCouponForm,
    createCoupon,
    deleteCoupon,
    couponList

}



