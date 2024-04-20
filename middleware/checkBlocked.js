
const User=require("../models/userModel")

// Middleware to check if user is blocked


const checkBlocked = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);
            if (userData.is_blocked) {
                
                delete req.session.user_id;
                    res.redirect('/');
                
            } else {
                next(); 
            }
        } else {
            next(); 
        }
    } catch (error) {
        console.log("Error checking if user is blocked:", error.message);
        next(error); // Pass error to error handling middleware
    }
};


module.exports={
    checkBlocked
}