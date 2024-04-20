// reportController.js

const generateSalesReport = require('../helpers/salesReport')
const { generateSalesLedger } = require('../helpers/ledger')
const Order = require("../models/orderModel")
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const moment = require('moment');
const { startOfMonth, endOfMonth } = require('date-fns');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { pipeline } = require('stream');
const fs = require('fs');
path = require('path');


const renderSalesReportForm = async (req, res) => {
    try {

        res.render('./admin/createReport', { title: 'Create Ledger' });

    } catch {
        console.log(error.message)

    }
}



const generateReport = async (req, res) => {
    const { filter, startDate, endDate, filename } = req.body;


    try {
        await generateSalesReport(filter, startDate, endDate, filename);

        req.flash('message', 'Sales report generated successfully.');
        res.redirect('/admin/reports')
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send('Error generating sales report.');
    }
}




// Function to fetch and analyze order data
async function analyzeOrderData(filter) {

    try {
        const pipeline = [
            { $match: filter },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' } },
            { $lookup: { from: 'coupons', localField: 'coupon', foreignField: '_id', as: 'couponDetails' } },


            {
                $project: {
                    orderId: '$orderId',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    paymentMethod: '$paymentMethod',
                    userName: { $arrayElemAt: ['$userDetails.name', 0] },
                    productName: '$productDetails.name',
                    productQuantity: '$items.quantity',
                    coupon: { $arrayElemAt: ['$couponDetails.code', 0] },
                    totalPrice: '$items.totalPrice',
                    status: '$status'
                }

            }
        ];

        const reportData = await Order.aggregate(pipeline);
        return reportData;
    } catch (error) {
        throw new Error('Error analyzing order data: ' + error.message);
    }
}


// function to preprocess report data for grouping
function preprocessReportData(reportData) {
    const groupedOrders = {};

    reportData.forEach((order) => {
        const orderId = order.orderId;

        if (!groupedOrders[orderId]) {
            groupedOrders[orderId] = {
                orderId: orderId,
                date: order.date,
                paymentMethod: order.paymentMethod,
                userName: order.userName || 'N/A or Deleted',
                products: [],
                totalPrice: 0,
                status: order.status,
                coupon: order.coupon || 'Not Applied'
            };
        }

        // Add product details to the products array of the grouped order
        groupedOrders[orderId].products.push({
            name: order.productName,
            quantity: order.productQuantity
        });

        // Update total price of the grouped order
        groupedOrders[orderId].totalPrice += order.totalPrice;
    });

    return Object.values(groupedOrders);
}


const viewReports = async (req, res) => {
    try {
        const { filterBy, startDate, endDate } = req.query;

        
        const filter = {};
        if (filterBy === '1 Day') {
            filter.createdAt = {
                $gte: moment().startOf('day').toDate(),
                $lte: moment().endOf('day').toDate(),
            };
        } else if (filterBy === '1 Week') {
            filter.createdAt = {
                $gte: moment().subtract(1, 'weeks').startOf('day').toDate(),
                $lte: moment().endOf('day').toDate()
            };
        } else if (filterBy === '1 Month') {
            filter.createdAt = { $gte: startOfMonth(new Date()), $lte: endOfMonth(new Date()) };
        } else if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const reportData = await analyzeOrderData(filter);



        // Preprocess reportData for grouped rendering
        const groupedOrders = preprocessReportData(reportData);

        const overallSales = {
            totalAmount: reportData.reduce((acc, curr) => acc + curr.totalPrice, 0),
            
            orderCount: groupedOrders.length,
            totalDiscount: reportData.reduce((acc, curr) => (acc + curr.discountAmount || 0), 0)
        };
        const message = req.flash('message');
        res.render('./admin/report', {
            title: 'Sales Report',
            
            groupedOrders: groupedOrders,
            overallSales: overallSales,
            filterBy: filterBy || '',
            startDate: startDate || '',
            endDate: endDate || '',
            message: message
        });
    } catch (error) {
        console.log('Error in viewReports:', error.message);
        res.status(500).send('Internal Server Error');
    }
}



// Helper function to build filter based on selected criteria
function buildFilter(filterBy, startDate, endDate) {
    const filter = {};

    if (filterBy === '1 Day') {
        filter.createdAt = {
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
        };
    } else if (filterBy === '1 Week') {
        filter.createdAt = {
            $gte: moment().subtract(1, 'weeks').startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
        };
    } else if (filterBy === '1 Month') {
        filter.createdAt = { $gte: startOfMonth(new Date()), $lte: endOfMonth(new Date()) };
    } else if (startDate && endDate) {
        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    return filter;
}



// Function to generate PDF stream
function generatePDF(groupedOrders,filterBy) {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const outputStream = fs.createWriteStream('sales_report.pdf');
    doc.pipe(outputStream);

    let yPosition = 50;
    const lineHeight = 20;

    // Generate the sales report title including filter criteria
    let reportTitle = 'Audio Booth Sales Report';
    if (filterBy) {
        reportTitle += ` - ${filterBy}`;
    }
console.log(reportTitle)
    doc.fontSize(22).text(reportTitle, { align: 'center', underline: true });
    yPosition += 55;

    const headers = [
        'Order ID',
        'Date',
        'Payment',
        'User',
        'Products',
        'Coupon',       
        'Total',
        'Status'
    ];
    
    const columnWidth = 98;
    const startX = 50;

    doc.fontSize(14).font('Helvetica-Bold');
    headers.forEach((header, index) => {
        doc.text(header, startX + index * columnWidth, yPosition, { bold: true, width: columnWidth, align: 'left' });
    });
    yPosition += lineHeight;

    doc.fontSize(8).font('Helvetica');
    groupedOrders.forEach(order => {
        const productDetails = order.products.map(product => `${product.name} (Qty: ${product.quantity})`).join('\n');
        const numLines = productDetails.split('\n').length;

        const rowData = [
            order.orderId,
            order.date,
            order.paymentMethod,
            order.userName || 'Not available',
            productDetails,
            order.coupon || 'Not Added',
            `${order.totalPrice.toFixed(2)}`,
            order.status
        ];

        const rowHeight = lineHeight * Math.max(1, numLines);
        rowData.forEach((data, index) => {
            doc.text(data, startX + index * columnWidth, yPosition, { width: columnWidth, align: 'left' });
        });
        yPosition += rowHeight;
    });

    const totalPriceSum = groupedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const orderCount = groupedOrders.length;

    doc.font('Helvetica-Bold');
    doc.fontSize(12).text(`Total Price of Selected Orders: ${totalPriceSum.toFixed(2)}`, 50, yPosition + lineHeight, { bold: true });
    doc.fontSize(12).text(`Order Count: ${orderCount}`, 50, yPosition + lineHeight * 2, { bold: true });

    doc.end();

    return outputStream;
}

//  export pdf
const exportPdf = async (req, res) => {
    try {
        const { filterBy, startDate, endDate } = req.query;
        const filter = buildFilter(filterBy, startDate, endDate);
        const reportData = await analyzeOrderData(filter);
        // Process report data to group orders
        const groupedOrders = preprocessReportData(reportData);

        // Generate PDF content
        const outputStream = generatePDF(groupedOrders,filterBy );
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

        // Stream the generated PDF to the response
        outputStream.on('finish', () => {
            res.download('sales_report.pdf', 'sales_report.pdf', (err) => {
                if (err) {
                    console.error('Error exporting PDF:', err.message);
                    res.status(500).send('Failed to export PDF');
                } else {
                    // Optionally, you can delete the generated PDF file after download
                    fs.unlinkSync('sales_report.pdf');
                }
            });
        });
    } catch (error) {
        console.error('Error exporting PDF:', error.message);
        res.status(500).send('Internal Server Error');
    }
};



// Function to generate Excel workbook buffer
async function generateExcel(groupedOrders, filepath) {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sales Report');

        // Define columns
        sheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 15 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Products', key: 'products', width: 30 },

            { header: 'Coupon', key: 'coupon', width: 20 },
            { header: 'Total Price', key: 'totalPrice', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Populate data rows
        groupedOrders.forEach(order => {
            const productDetails = order.products.map(product => `${product.name}-(Qty: ${product.quantity})`).join('\n');
            sheet.addRow({
                orderId: order.orderId,
                date: order.date,
                paymentMethod: order.paymentMethod,
                userName: order.userName || 'Not Available',
                products: productDetails,

                coupon: order.coupon || 'Not added',
                totalPrice: order.totalPrice,
                status: order.status
            });
        });

        // Apply numeric formatting to 'totalPrice' column
        const totalPriceColumn = sheet.getColumn('totalPrice');
        totalPriceColumn.numFmt = '₹#,##0.00'; // Format as currency


        await workbook.xlsx.writeFile(filepath);
    } catch (error) {
        throw new Error(`Error generating Excel: ${error.message}`);
    }

}


const exportExcel = async (req, res) => {
    const excelFilename = 'sales_report.xlsx';
    const excelFilePath = path.resolve(__dirname, excelFilename);


    try {
        const { filterBy, startDate, endDate } = req.query;

        const filter = buildFilter(filterBy, startDate, endDate);
        const reportData = await analyzeOrderData(filter);

        // Process report data to group orders
        const groupedOrders = preprocessReportData(reportData);
        // Generate Excel file

        await generateExcel(groupedOrders, excelFilePath);


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(excelFilename)}"`);

        const fileStream = fs.createReadStream(excelFilePath);
        fileStream.pipe(res);

        // Delete the generated Excel file after streaming
        fileStream.on('close', () => {
            fs.unlinkSync(excelFilePath); // Delete the file after streaming completes
        });
    } catch (error) {
        console.error('Error exporting Excel:', error.message);
        res.status(500).send('Internal Server Error');
    }
};







// top selling
const loadTopSelling = async (req, res) => {
    try {

        // Aggregate orders to calculate total quantity sold per product
        const topProducts = await Order.aggregate([
            { $unwind: '$items' }, // Flatten the items array
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 } // Get top 10 selling products
        ]);

        // Populate product details for top selling products
        const populatedProducts = await Product.populate(topProducts, { path: '_id', select: 'name' });

        // Aggregate orders to calculate total quantity sold per category
        const topCategories = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 } // Get top 10 selling categories
        ]);

        // Populate category details for top selling categories
        const populatedCategories = await Category.populate(topCategories, { path: '_id', select: 'name' });

        // Aggregate orders to calculate total quantity sold per brand
        const topBrands = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.brand',
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 } // Get top 10 selling brands
        ]);



        res.render('./admin/topSelling', {
            title: 'Top Selling',
            topProducts: populatedProducts,
            topCategories: populatedCategories,
            topBrands: topBrands
        });

    } catch {
        console.log(error.message)

    }
}


const generateLedger = async (req, res) => {
    const { startDate, endDate, filename } = req.body;

    try {
        // Validate startDate and endDate as necessary
        if (!startDate || !endDate || !filename) {
            throw new Error('Start date, end date, and filename are required.');
        }

        // Convert startDate and endDate strings to Date objects if needed
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Generate ledger report between the selected dates
        await generateSalesLedger(start, end, filename);

        req.flash('message', 'Ledger book generated successfully.');
        res.redirect('/admin/reports'); // Redirect to ledger page or appropriate route
    } catch (error) {
        console.error('Error generating ledger book:', error);
        res.status(500).send('Error generating ledger book.');
    }
}




module.exports = {
    generateReport,
    renderSalesReportForm,
    viewReports,
    loadTopSelling,
    exportPdf,
    exportExcel,
    generateLedger
}

