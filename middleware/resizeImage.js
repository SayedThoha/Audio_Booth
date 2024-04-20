
// middleware/resizeImage.js

const sharp = require('sharp');
const path = require('path');

const resizeImages = (req, res, next) => {
    try {
        // Check if req.files is present and not empty
        if (!req.files || req.files.length === 0) {
            return next();
        }
        
        // Array to store promises for each image processing operation
        const promises = req.files.map((file, index) => {
            return new Promise((resolve, reject) => {
                // Define destination path for processed image
                const destinationPath = path.join('./public/uploads/products/resized', file.filename);

                // Adjust dimensions based on image type
                let resizeOptions;
                if (req.body.imageType === 'thumbnail') {
                    resizeOptions = { width: 200, height: 200, fit: 'cover' }; // Adjust dimensions for product thumbnails
                } else if (req.body.imageType === 'detail') {
                    resizeOptions = { width: 800, height: 800, fit: 'cover' }; // Adjust dimensions for product detail images
                } else if (req.body.imageType === 'banner') {
                    resizeOptions = { width: 1920, height: 400, fit: 'cover' }; // Adjust dimensions for category/brand banners
                }

                // Process image with Sharp
                sharp(file.path)
                    .resize(resizeOptions)
                    .toFile(destinationPath, (err, info) => {
                        if (err) {
                            console.error(`Error processing image "${file.originalname}":`, err);
                            reject(err);
                        } else {
                            // Update the file path with the path of the processed image
                            req.files[index].path = destinationPath;
                            resolve();
                        }
                    });
            });
        });

        // Wait for all image processing operations to complete
        Promise.all(promises)
            .then(() => {
                // All images processed successfully
                next();
            })
            .catch((err) => {
                // Error occurred during image processing
                console.error('Error processing images:', err);
                res.status(500).send('Error processing images');
            });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = resizeImages;
