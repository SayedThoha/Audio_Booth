// middleware/upload.js
const path=require('path')
const multer = require('multer');

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null,"./public/uploads/products"); // Store files in the 'User' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        console.log(file.mimetype)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
}).array('images', 3); // Allow multiple images, maximum 3

module.exports = upload;

