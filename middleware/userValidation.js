const { body, validationResult } = require('express-validator');

// validation for user sign up

const signupValidation = [
    body('name')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long')
        .custom(value => !/\s/.test(value))
        .withMessage('Name cannot contain blank spaces'),

    body('email').isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail(),

  
    body('password')
        .trim() // Remove leading and trailing whitespaces
        .custom(value => !/\s/.test(value))
        .withMessage('Password cannot contain blank spaces')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 characters'),

    body('password1').custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
];



const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./user/sign', { title: 'Sign Up',message: errors.array() });
    }
    next();
};




module.exports={
    signupValidation,
    validate,

}
