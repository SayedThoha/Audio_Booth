function validateForm() {
    // Reset error messages
    document.getElementById('nameError').innerText = '';
    document.getElementById('emailError').innerText = '';
    document.getElementById('passwordError').innerText = '';
    document.getElementById('confirmPasswordError').innerText = '';
    document.getElementById('mobileNumberError').innerText = '';

    // Get the values from form
    var name = document.getElementById('form3Example1c').value;
    var email = document.getElementById('form3Example3c').value;
    var password = document.getElementById('form3Example4c').value;
    var confirmPassword = document.getElementById('form3Example4cd').value;
    var mobileNumber = document.getElementById('form3Example5c').value;


    // Validate name
    if (name.trim() === '' || /\s/.test(name) || name.replace(/\s/g, '').length < 3 || name.length > 30) {
        document.getElementById('nameError').innerText = 'Name must be between 3 and 30 characters';
        return false;
    }

    // Validate email
    var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email) || email.length > 100) {
        document.getElementById('emailError').innerText = 'Invalid email address';
        return false;
    }

    // Validate password
    if (password.length < 8 || !/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password) || password.length > 20) {
        document.getElementById('passwordError').innerText = 'Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, one number, and one special character';
        return false;
    }

    // Validate confirmPassword
    if (confirmPassword !== password) {
        document.getElementById('confirmPasswordError').innerText = 'Passwords do not match';
        return false;
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(mobileNumber)) {
        document.getElementById('mobileNumberError').innerText = 'Mobile number must be a 10-digit number';
        return false;
    }
    // If all validations pass, you can submit the form
    return true;
}
