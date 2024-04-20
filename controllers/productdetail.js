const Category = require('../models/categoryModel');
const Product = require('../models/productModel');


// Controller method to render product details
const getProductDetails = async (req, res) => {
    try {
        // Retrieve the product ID from the request parameters
        const productId = req.params.id;

        // Fetch the product details from the database
        const product = await Product.findById(productId).populate('category');

        // Render the product details view with the retrieved product
        res.render('./details/productDetails', {title:"details", product });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


module.exports={
    getProductDetails
}