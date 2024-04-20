// Import the upload middleware
const upload = require('../middleware/upload');
const Product = require('../models/productModel');

// Function to render the form for editing product picture
const renderEditPictureForm = async (req, res) => {
    try {
        // Fetch the product to be edited from the database
        const productId = req.params.id;
        const product = await Product.findById(productId);

        // Render the edit product picture form view
        const message = req.flash('message')
        res.render('./products/editPic', { title: 'Edit Product Picture', product,message:message});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Function to add a new picture to a product
const addProductImage = async (req, res) => {
    try {
        // Retrieve product ID from the request parameters
        const productId = req.params.id;
        

        // Call the upload middleware to handle file uploads
        upload(req, res, async function (err) {
            if (err) {
                console.error(err);
                return res.status(400).send('Error uploading files: ' + err.message);
            }

            // Retrieve the uploaded image files
            const images = req.files;
            

            // Find the product by ID
            const product = await Product.findById(productId);
            

            // Add the new images to the product's images array
            images.forEach(image => {
                product.images.push({ url: `/uploads/products/${image.filename}` });
            });

            // Save the updated product
            await product.save();

            req.flash('message','New image Uploaded');

            // Redirect back to the product editing page with a success message
     res.redirect(`/admin/products/edit-picture/${productId}`);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Function to remove an existing picture from a product
const removeProductImage = async (req, res) => {
    try {
        // Retrieve product ID and image index from the request parameters
        const productId = req.params.id;
        const imageIndex = parseInt(req.params.index);

        

        // Find the product by ID
        const product = await Product.findById(productId);
        
        // Remove the specified image from the product's images array
        product.images.splice(imageIndex, 1);
        
        // Save the updated product
        await product.save();

        req.flash('message','Image deleted');
        // Redirect back to the product editing page with a success message
    return res.redirect(`/admin/products/edit-picture/${productId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Export the controller functions
module.exports = {
    renderEditPictureForm,
    addProductImage,
    removeProductImage
};
