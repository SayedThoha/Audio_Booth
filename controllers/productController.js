// controllers/categoryController.js
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const sharp = require('sharp');
const upload = require('../middleware/upload')
const resizeImages = require('../middleware/resizeImage')

const loadProducts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 9; 
        const skip = (page - 1) * limit; 

        var search = "";
        let query = {};
        if (req.query.search) {
            search = req.query.search
            const regex = new RegExp(search, 'i');

            
            query = { name: regex };

        }
        const totalProductsCount = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProductsCount / limit);
        // Fetch all products from the database
        const products = await Product.find(query).populate('category').skip(skip).limit(limit);
        res.render('./admin/products', {
            title: 'products',
            products,
            search,
            currentPage: page,
            totalPages,
            limit,
            successMessage: req.flash('success'),
            errorMessage: req.flash('error')
        });

    } catch (error) {
        console.log(error.message)
    }
}

// Function to display the form for adding a new product

const renderAddProductForm = async (req, res) => {
    try {
        // Fetch categories from the database 
        const categories = await Category.find({});
        res.render('./products/newProduct', { title: 'Add New Product', categories, successMessage: req.flash('success'), errorMessage: req.flash('error') });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// add product
const addProduct = async (req, res) => {
    try {

        // Invoke multer middleware to handle file uploads
        upload(req, res, async (err) => {
            if (err) {
                console.error(err);
                return res.status(400).send('Error uploading files');
            }

            // Process uploaded images with the resizeImages middleware
            resizeImages(req, res, async (err) => {
                if (err) {
                    console.error(err);
                    return res.status(400).send('Error processing images');
                }

                // Access req.files here, which now contains processed images
                const images = req.files.map((file) => ({
                    url: '/uploads/products/' + file.filename,
                    description: file.originalname,

                }));

                //  other product details from the request body

                const { name, description, price, stockQuantity, brand, features, discount, category, actualPrice } = req.body;

                // Check if a product with the same name already exists
                const existingProduct = await Product.findOne({ name });

                // If a product with the same name exists, return an error
                if (existingProduct) {
                    req.flash('error', 'Product with this name already exists');
                    return res.redirect('/admin/products/new');
                    
                }

                // Create a new product instance
                const product = new Product({
                    name,
                    description,
                    price,
                    stockQuantity,
                    brand,
                    features,
                    discount,
                    category,
                    actualPrice,
                    originalPrice: price,
                    images,
                    createdAt: new Date()
                });

                // Save the product to the database
                await product.save();

            
                
                req.flash('success', 'Product created successfully');
                res.redirect('/admin/products/new');
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


// Function to display the form for edit product
const renderEditProductForm = async (req, res) => {
    try {
        // Fetch the product to be edited from the database
        const productId = req.params.id;
        const product = await Product.findById(productId);

        // Fetch categories from the database 
        const categories = await Category.find({});

        // Render the edit product form view with product details and categories
        res.render('./products/editProduct', { title: 'Edit Product', product, categories, successMessage: req.flash('success'), errorMessage: req.flash('error') });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// update product
const editProduct = async (req, res) => {
    try {
        //  product ID from the request parameters
        const productId = req.params.id;

        //  updated product details from the request body
        const { name, description, price, stockQuantity, brand, features, discount, category, actualPrice } = req.body;

        // update object with the new data
        const updateData = {
            name,
            description,
            price,
            stockQuantity,
            brand,
            features,
            discount,
            category,
            actualPrice,
            updatedAt: new Date()
        };

        
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });

        // If the product doesn't exist, return an error
        if (!updatedProduct) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Respond with success message
        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



//soft delete
const softDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        
        const product = await Product.findById(productId);

        
        if (!product) {
            return res.status(404).send('Category not found');
        }

        // Soft delete the category by setting _issoftdeleted to true
        product.is_softdeleted = true;
        
        await product.save();
        

        // Redirect back to category management page
        res.redirect('/admin/products');
    } catch (err) {
        // Handle any errors
        res.status(500).send(err.message);
    }
};


// Function to remove soft deletion
const removeSoftDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        // If category is not found
        if (!product) {
            return res.status(404).send('Category not found');
        }

        // Remove soft deletion from the category by setting _issoftdeleted to false
        product.is_softdeleted = false;
        
        await product.save();
        

        // Redirect back to category management page
        res.redirect('/admin/products');
    } catch (err) {
        
        res.status(500).send(err.message);
    }
};


// Function to delete a product
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/products'); // Redirect to category management page
        }
        req.flash('success', 'Product deleted');
        res.redirect('/admin/products');
    } catch (err) {
        res.status(500).send(err.message);
    }
};


module.exports = {
    loadProducts,
    renderAddProductForm,
    addProduct,
    renderEditProductForm,
    editProduct,
    softDeleteProduct,
    removeSoftDeleteProduct,
    deleteProduct,


}