const adminController = require("../controllers/adminController")
const categoryController= require("../controllers/categoryController")
const productController= require("../controllers/productController")
const imageController=require("../controllers/imageController")
const orderController=require('../controllers/orderController')
const couponController=require('../controllers/couponController')
const offerController=require('../controllers/offerController')
const reportController=require('../controllers/reportController')
const auth = require("../middleware/adminAuth")
var express = require('express');
const session = require('express-session')
const { v4: uuidv4 } = require('uuid');
const { report } = require(".")
var router = express.Router();


router.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  }));




router.get('/',auth.islogout, adminController.loadLogin)
router.post('/',adminController.verifyLogin)

router.get('/dashboard',auth.islogin,adminController.loadDashboard)

router.get('/customers',auth.islogin, adminController.loadCustomers)
router.get('/edit-user',adminController.editUserLoad)
router.post('/edit-user', adminController.updateUser)
router.get('/delete-user', adminController.deleteUser)
router.get('/block-user', adminController.blockingUser)
router.get('/unblock-user', adminController.unblockingUser)


// category
router.get('/category',auth.islogin,categoryController.loadCategory)
router.get('/category/new',categoryController.createCategoryForm)

// Route to handle the form submission and create a new category
router.post('/category/new', categoryController.createCategory);

// Route to display the form for editing a category
router.get('/category/edit/:id', categoryController.editCategoryForm);

// Route to handle the form submission and update a category
router.post('/category/edit/:id', categoryController.updateCategory);

// Route to soft delete a category
router.post('/category/soft-delete/:id', categoryController.softDeleteCategory);

// Route to remove soft deletion from a category
router.post('/category/cancel-soft-delete/:id', categoryController.removeSoftDeleteCategory);

router.post('/category/delete/:id', categoryController.deleteCategory);


//products

router.get('/products',auth.islogin,productController.loadProducts)

router.get('/products/new',auth.islogin,productController.renderAddProductForm)
router.post('/products/new',productController.addProduct)
router.get('/products/edit/:id',productController.renderEditProductForm)
router.post('/products/edit/:id',productController.editProduct)
router.post('/products/softdelete/:id', productController.softDeleteProduct);
router.post('/products/remove-softdelete/:id', productController.removeSoftDeleteProduct);
router.post('/products/delete/:id', productController.deleteProduct);

// Route to render the form for editing product picture
router.get('/products/edit-picture/:id',auth.islogin,imageController.renderEditPictureForm);
// Route to handle adding a new picture to a product
router.post('/products/edit-picture/add-image/:id',imageController.addProductImage);
// Route to handle removing an existing picture from a product
router.post('/products/edit-picture/remove-image/:index/:id', imageController.removeProductImage);


//order management
router.get('/orders',auth.islogin,orderController.loadOrders)
router.post('/orders/update/:id',orderController.changeOrderStatus)
router.post('/orders/cancel/:id',orderController.AdmincancelOrder)
router.post('/orders/approve-return/:id',orderController.approveReturn)


//coupon management
router.get('/coupons',auth.islogin,couponController.renderCoupon)
router.get('/coupons/create',auth.islogin,couponController.renderCouponForm)
router.post('/coupons/create',couponController.createCoupon)
router.post('/coupons/delete/:id',couponController.deleteCoupon)

//offer management
router.get('/offer',auth.islogin,offerController.loadOffers)
router.get('/offer/apply-offer-to-category',auth.islogin,offerController.categoryOfferForm)

router.post('/offer/apply-offer-to-category',offerController.applyOfferToCategory)
router.post('/offer/delete/:id',offerController.deleteOffer)
router.get('/offer/edit/:id',auth.islogin,offerController.renderEditOfferForm)
router.post('/offer/edit/update/:id',offerController.updateOffer)
//referal offer
router.get('/referral-offer',auth.islogin,offerController.loadReferralOffers)
router.get('/referral-offer/create',auth.islogin,offerController.referralOfferForm)
router.post('/referral-offer/create',offerController.applyReferralOffer)
router.post('/referral-offer/delete/:id',offerController.deleteReferralOffer)

// ledger
router.get('/generate-ledger-form',auth.islogin,reportController.renderSalesReportForm)

router.post('/generate-ledger',reportController.generateLedger)


router.get('/reports',auth.islogin,reportController.viewReports)


// exporting sales report to PDF
router.get('/reports/export/pdf',auth.islogin,reportController.exportPdf)

// exporting sales report to Excel
router.get('/reports/export/excel',auth.islogin,reportController.exportExcel)

// top selling
router.get('/top-selling',auth.islogin,reportController.loadTopSelling)



router.get('/logout',auth.islogin, adminController.logout)


router.get('*', function (req, res) {
    res.redirect('/admin')
  });

module.exports = router;





  