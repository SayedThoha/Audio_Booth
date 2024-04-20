


// One minute expiry module
const oneMinuteExpiry = async (otpTime) => {
    try {
        

        // Calculate the difference in milliseconds between the OTP timestamp and the current time
        const currentTime = new Date().getTime();
        const differenceInMillis = currentTime - otpTime.getTime();

        // Convert the difference to minutes
        const differenceInMinutes = differenceInMillis / (1000 * 60);

        

        // Check if the difference is greater than or equal to 1 minute
        if (differenceInMinutes >= 1) {
            return true; // OTP has expired
        }

        return false; // OTP has not expired
    } catch (error) {
        console.error('Error in oneMinuteExpiry:', error);
        return false; // Return false in case of an error
    }
};




const threeMinuteExpiry = async (otpTime) => {
    try {

        
        const c_datetime = new Date();
        var differenceValue = (otpTime - c_datetime.getTime()) / 1000;
        differenceValue /= 60;
        
        if (Math.abs(differenceValue) > 3) {
            return true;
        }

        return false;
    }
    catch (error) {
        console.log(error)
    }
}


module.exports = {
    oneMinuteExpiry,
    threeMinuteExpiry

}