// salesReport.js in helpers folder
const fs = require('fs');
const path = require('path');
const Order = require("../models/orderModel")
const PDFDocument = require('pdfkit'); // library for PDF generation
const ExcelJS = require('exceljs'); // library for Excel generation


// the folder path where you want to save the reports
const reportsFolderPath = path.join(__dirname, '../reports'); // 'reports' is the folder name
// Ensure the 'reports' folder exists, if not, create it
if (!fs.existsSync(reportsFolderPath)) {
    fs.mkdirSync(reportsFolderPath, { recursive: true });
}

// Function to fetch orders based on date range
async function fetchOrders(startDate, endDate) {
    try {
        return await Order.find({
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        }).populate('items.product').populate('user');
    } catch (error) {
        throw new Error('Error fetching orders: ' + error.message);
    }
}


// Function to generate PDF report
function generatePDFReport(orders, filename, folderPath) {
    const doc = new PDFDocument();

    const stream = fs.createWriteStream(path.join(folderPath, filename + '.pdf'));

    doc.pipe(stream);
    // Initial Y position for the first box
    let yPos = 60;
    // Heading for the page
    doc.fontSize(18).font('Helvetica-Bold').text('Sales Report', { align: 'center' });

    let ordersPerPage = 2; // Number of orders to display per page
    let ordersCount = 0; // Counter to keep track of orders displayed

    orders.forEach((order, index) => {
        if (index > 0 && ordersCount % ordersPerPage === 0) {
            // Add new page for every two orders after the first page
            doc.addPage();
            yPos = 60; // Reset Y position for new page
            // Add heading for the new page
            doc.fontSize(18).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
        }

        // Draw the box for each order
        doc.rect(50, yPos + 30, 500, 230).fillAndStroke('#f0f0f0', '#000'); // Box for order details

        // Order details text
        doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(`Order ID: ${order.orderId}`, 60, yPos + 40);
        doc.font('Helvetica').text(`User: ${order.user.name}`, 60, yPos + 60);
        doc.font('Helvetica-Bold').text('Items:', 60, yPos + 80);

        // Iterate over order items
        order.items.forEach((item, itemIndex) => {
            const itemYPos = yPos + 100 + itemIndex * 20;
            doc.font('Helvetica').text(`- Product: ${item.product.name}, Quantity: ${item.quantity}, Price: ${item.price}, Total Price: ${item.totalPrice}`, 60, itemYPos);
        });

        // Additional order details within the box
        doc.fontSize(12).text(`Total Amount: ${order.totalAmount}`, 60, yPos + 180);
        doc.text(`Payment Method: ${order.paymentMethod}`, 60, yPos + 200);
        doc.text(`Status: ${order.status}`, 60, yPos + 220);
        doc.text(`Created At: ${order.createdAt}`, 60, yPos + 240);

        yPos += 300; // Adjust spacing between boxes for the next order
        ordersCount++; // Increment orders count
    });

    doc.end();
}




// Function to generate Excel report
function generateExcelReport(orders, filename, folderPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    const columns = ['Order ID', 'User', 'Total Amount', 'Payment Method', 'Status', 'Created At'];

    worksheet.columns = columns.map(column => ({ header: column, key: column }));

    orders.forEach(order => {
        worksheet.addRow({
            'Order ID': order.orderId,
            'User': order.user.name,
            'Total Amount': order.totalAmount,
            'Payment Method': order.paymentMethod,
            'Status': order.status,
            'Created At': order.createdAt
        });

        // Add items separately if needed
        order.items.forEach(item => {
            worksheet.addRow({
                'Order ID': order.orderId,
                'Product': item.product.name,
                'Quantity': item.quantity,
                'Price': item.price,
                'Total Price': item.totalPrice
            });
        });
    });

    // workbook.xlsx.writeFile(filename);
    // workbook.xlsx.writeFile(path.join(folderPath, filename));
    workbook.xlsx.writeFile(path.join(folderPath, filename + '.xlsx'));
}


// Function to generate sales report based on filter
async function generateSalesReport(filter, startDate, endDate, filename) {
    try {
        const orders = await fetchOrders(startDate, endDate);
        if (orders.length === 0) {
            throw new Error('No orders found for the specified date range.');
        }

        switch (filter) {
            case 'Daily':
                generatePDFReport(orders, filename, reportsFolderPath);
                generateExcelReport(orders, filename, reportsFolderPath);
                break;

            case 'Weekly':
                generatePDFReport(orders, filename, reportsFolderPath);
                generateExcelReport(orders, filename, reportsFolderPath);
                break;
            case 'Monthly':
                generatePDFReport(orders, filename, reportsFolderPath);
                generateExcelReport(orders, filename, reportsFolderPath);
                break;

            case 'Custom':
                generatePDFReport(orders, filename, reportsFolderPath);
                generateExcelReport(orders, filename, reportsFolderPath);
                break;

            default:
                throw new Error('Invalid filter');
        }
    } catch (error) {
        throw new Error('Error generating sales report: ' + error.message);
    }
}






module.exports = {
    
    generateSalesReport,
    

};


