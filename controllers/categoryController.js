// controllers/categoryController.js

const Category = require('../models/categoryModel');
const Product = require('../models/productModel');


// loading category management

const loadCategory = async (req, res) => {
    try {
        var search = "";
        let query = {};
        if (req.query.search) {
            search = req.query.search
            const regex = new RegExp(search, 'i');

            // Add the name field to the MongoDB query to perform search
            query = { name: regex };

        }
        // Retrieve all categories from the database
        const categories = await Category.find(query)
        
        res.render('./admin/category', { title: 'Category', categories, search, successMessage: req.flash('success'), errorMessage: req.flash('error') });

    } catch (error) {
        console.log(error.message)
    }
}



// Function to display the form for adding a new category
const createCategoryForm = async (req, res) => {
    try {
        res.render('./categories/new-category', { title: 'New Category', successMessage: req.flash('success'), errorMessage: req.flash('error') });
    } catch (error) {
        console.log(error.message)
    }

};

// Function to create a new category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Basic validation to check if name is not empty
        if (!name) {
            // return res.status(400).send('Category name is required');
            req.flash('error', 'Category name is required');
            return res.redirect('/admin/category/new');
        }

        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            //   return res.status(400).send('Category with this name already exists');
            req.flash('error', 'Category with this name already exists');
            return res.redirect('/admin/category/new');
        }

        const category = new Category({ name, description });


        // Save the category to the database
        await category.save();


        await category.save();
        req.flash('success', 'Category created successfully');
        res.redirect('/admin/category/new');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

// Function to display the form for editing a category

const editCategoryForm = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            // return res.status(404).send('Category not found');
            req.flash('error', 'Category not found');
            return res.redirect('/admin/category'); // Redirect to category management page
        }
        res.render('./categories/edit-category', { title: "Edit-Category", category, successMessage: req.flash('success'), errorMessage: req.flash('error') });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Function to update a category
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryId = req.params.id;
        // Check if category exists

        const category = await Category.findById(categoryId);
        if (!category) {
            // return res.status(404).send('Category not found');
            req.flash('error', 'Category not found');
            return res.redirect('/admin/category'); // Redirect to category management page
        }
        
        // Check if another category with the same name exists
        const existingCategory = await Category.findOne({ name, _id: { $ne: categoryId } });
        if (existingCategory) {
            
            req.flash('error', 'Category with this name already exists');
            return res.redirect('/admin/category');
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, description }, { new: true });
        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/category');

    } catch (err) {
        res.status(500).send(err.message);
    }
};

// soft deleting

const softDeleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        // If category is not found, return 404 Not Found
        if (!category) {
            return res.status(404).send('Category not found');
        }

        // Soft delete the category by setting _issoftdeleted to true
        category._issoftdeleted = true;
        await category.save();

        // Redirect back to category management page
        res.redirect('/admin/category');
    } catch (err) {
        // Handle any errors
        res.status(500).send(err.message);
    }
};


// Function to remove soft deletion from a category
const removeSoftDeleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        // If category is not found, return 404 Not Found
        if (!category) {
            return res.status(404).send('Category not found');
        }

        // Remove soft deletion from the category by setting _issoftdeleted to false
        category._issoftdeleted = false;
        await category.save();

        // Redirect back to category management page
        res.redirect('/admin/category');
    } catch (err) {
        // Handle any errors
        res.status(500).send(err.message);
    }
};


// Function to delete a category
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/category'); // Redirect to category management page
        }
        req.flash('success', 'Category deleted');
        res.redirect('/admin/category');
    } catch (err) {
        res.status(500).send(err.message);
    }
};


module.exports = {
    loadCategory,
    createCategoryForm,
    createCategory,
    editCategoryForm,
    updateCategory,
    softDeleteCategory,
    removeSoftDeleteCategory,
    deleteCategory


}