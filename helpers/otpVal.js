const oneMinuteExpiry = async (otpTime) => {
    try {
        
        const currentTime = new Date();
        const differenceValue = (currentTime.getTime() - otpTime.getTime()) / (1000 * 60);
        
        return differenceValue >= 1; // Check if 1 minute has passed
    } catch (error) {
        console.log(error);
        return true; // Consider it expired in case of error
    }
};


const threeMinuteExpiry = async (otpTime) => {
    try {
    
        const currentTime = new Date();
        const differenceValue = (currentTime.getTime() - otpTime.getTime()) / (1000 * 60);
        
        return differenceValue >= 3; // Check if 3 minutes have passed
    } catch (error) {
        console.log(error);
        return true; // Consider it expired in case of error
    }
};

module.exports = {
    oneMinuteExpiry,
    threeMinuteExpiry
};
