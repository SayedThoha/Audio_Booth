const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel")
const bcrypt = require('bcrypt');

const { blockUser, unblockUser } = require('../helpers/userService');

//hash password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}


const loadLogin = async (req, res) => {
    try {
        const message = req.flash('message')
        res.render('./admin/login', { title: 'Admin Login', message: message });

    } catch (error) {
        console.log(error.message)
    }
}

//verify login
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password

        const adminData = await Admin.findOne({ email: email })
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password)
            if (passwordMatch) {


                if (adminData.is_admin === 1) {

                    req.session.admin_id = adminData._id;
                    res.redirect("/admin/dashboard");

                } else {

                   
                    req.flash('message', 'You are not authorized to access the admin panel');
                    res.redirect("/admin");

                }
            } else {

               
                req.flash('message', 'Email and password are incorrect');
                res.redirect("/admin");
            }
        } else {

           
            req.flash('message', 'Email and password are incorrect');
            res.redirect("/admin");
        }

    } catch (error) {
        console.log(error.message)
    }
};


//load dashboard
const loadDashboard = async (req, res) => {
    try {

        // Fetch orders data based on filter
        let { filterBy } = req.query; // filter option from request query params

         // Set a default value for filterBy if it's undefined
         if (!filterBy) {
            filterBy = 'daily'; // Default
        }

        
        let dateFormat = '%Y-%m-%d'; // Default date format for daily aggregation

        // Set filter options based on selected filterBy value
        if (filterBy === 'monthly') {
            dateFormat = '%Y-%m'; // Update date format for monthly aggregation
        } else if (filterBy === 'yearly') {
            dateFormat = '%Y'; // Update date format for yearly aggregation
        }
      // Aggregate sales data based on selected time interval
      const chartData = await Order.aggregate([
        {
            $match: {
                createdAt: { $exists: true } 
            }
        },
        {
            $project: {
                date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                totalAmount: 1
            }
        },
        {
            $group: {
                _id: '$date',
                totalAmount: { $sum: '$totalAmount' }
            }
        },
        { $sort: { _id: 1 } } 
    ]);
    
     

        res.render('./admin/dashboard', { title: 'Admin Dashboard', chartData ,currentFilter: filterBy});

    } catch (error) {
        console.log(error.message)
    }
}


// loading user management
const loadCustomers = async (req, res) => {
    try {

        var search = '';
        if (req.query.search) {
            search = req.query.search;
        }
        const usersData = await User.find({
            is_user: 1,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        });

        res.render('./admin/customers', { title: 'Customers', users: usersData });

    } catch (error) {
        console.log(error.message)
    }
}



// edit user from admin dashboard
const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await User.findById({ _id: id });
        if (userData) {
            res.render('./admin/edit-user', { title: "Edit user", user: userData })
        } else {
            res.redirect("/admin/customers")
        }
    } catch (error) {
        console.log(error.message)
    }
}





// update user after edit details
const updateUser = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email } })
        console.log(userData)

        res.redirect("/admin/customers")

    } catch (error) {
        console.log(error.message)
    }
}



//delete user
const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id })
        res.redirect("/admin/customers")
    } catch (error) {
        console.log(error.message)
    }
}



//block user

const blockingUser = async (req, res) => {
    const userId = req.query.id;
    try {
        const blockedUser = await blockUser(userId);
        
        res.redirect("/admin/customers")
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// Controller for unblocking a user
const unblockingUser = async (req, res) => {
    const userId = req.query.id;
    try {
        const unblockedUser = await unblockUser(userId);
        
        res.redirect("/admin/customers")
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};







// Admin logout controller function
const logout = (req, res) => {
    if (req.session.admin_id) {
        delete req.session.admin_id; 
    }
    res.redirect('/admin');
};


module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    loadCustomers,
    editUserLoad,
    updateUser,
    deleteUser,
    blockingUser,
    unblockingUser,

    logout

}