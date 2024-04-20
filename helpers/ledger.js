

// ledger.js in helpers folder
const fs = require('fs');
const path = require('path');
const Order = require("../models/orderModel")
const PDFDocument = require('pdfkit'); // library for PDF generation
const ExcelJS = require('exceljs'); // library for Excel generation



// the folder path where you want to save the reports
const reportsFolderPath = path.join(__dirname, '../ledger'); // 'reports' is the folder name
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

const generatePDFLedger = (orders, filename, folderPath) => {
    const doc = new PDFDocument({ size: 'letter', layout: 'landscape' }); // Set layout to landscape
    const filePath = path.join(folderPath, `${filename}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    let xPos = 100; // Initial X position for content
    let yPos = 100; // Initial Y position for content

    // Add header with title
    doc.fontSize(18).font('Helvetica-Bold').text('Ledger Book', { align: 'center' });

    let currentBalance = 0;

    orders.forEach((order) => {
        const { totalAmount, createdAt } = order;
        const formattedDate = new Date(createdAt).toLocaleDateString();

        // Date and description
        doc.font('Helvetica').text(`Date: ${formattedDate}`, xPos, yPos);
        doc.font('Helvetica').text(`Order ${order.orderId}`, xPos + 150, yPos);

        // Debit and Credit
        doc.font('Helvetica').text(`Debit: ${totalAmount}`, xPos + 350, yPos);
        doc.font('Helvetica').text(`Credit:`, xPos + 450, yPos);

        // Balance
        currentBalance += totalAmount;
        doc.font('Helvetica').text(`Balance: ${currentBalance}`, xPos + 500, yPos);

        yPos += 30; // Adjust Y position for next entry

        // Check if reaching end of page and start new page if needed
        if (yPos > doc.page.height - 50) {
            doc.addPage({ size: 'letter', layout: 'landscape' });
            yPos = 50; // Reset Y position for new page
        }
    });

    // Finalize the PDF document
    doc.end();

    // Return the file path where the PDF is saved
    return filePath;
};



function generateExcelLedger(orders, filename, folderPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ledger Book');
    const columns = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];

    worksheet.columns = columns.map(column => ({ header: column, key: column }));

    let currentBalance = 0;

    orders.forEach(order => {
        const { totalAmount, createdAt } = order;
        const formattedDate = new Date(createdAt).toLocaleDateString();

        worksheet.addRow({
            'Date': formattedDate,
            'Description': `Order ${order.orderId}`,
            'Debit': totalAmount,
            'Credit': '',
            'Balance': currentBalance += totalAmount
        });
    });

    workbook.xlsx.writeFile(path.join(folderPath, filename + '.xlsx'));
}


async function generateSalesLedger(startDate, endDate, filename) {
    try {
        const orders = await fetchOrders(startDate, endDate);
        if (orders.length === 0) {
            throw new Error('No orders found for the specified date range.');
        }

        generatePDFLedger(orders, filename, reportsFolderPath);
        generateExcelLedger(orders, filename, reportsFolderPath);

        return orders; // Optionally return orders for further processing or display
    } catch (error) {
        throw new Error('Error generating sales ledger: ' + error.message);
    }
}


module.exports={
    generateSalesLedger
}

