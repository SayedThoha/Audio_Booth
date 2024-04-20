// blocking users
const User = require("../models/userModel")



const blockUser = async (userId) => {
    try {
        const user = await User.findByIdAndUpdate(userId, { is_blocked: true });
        if (!user) {
            throw new Error('User not found');
        }
        console.log(`User ${user.name} has been blocked`);
        return user;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};



const unblockUser = async (userId) => {
    try {
        const user = await User.findByIdAndUpdate(userId, { is_blocked: false });
        if (!user) {
            throw new Error('User not found');
        }
        console.log(`User ${user.name} has been unblocked`);
        return user;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

module.exports = {
    blockUser,
    unblockUser
};
