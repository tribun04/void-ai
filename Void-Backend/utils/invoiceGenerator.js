const PDFDocument = require('pdfkit');

function generateInvoice(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- Invoice Header ---
            doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 50, 50);
            doc.fontSize(10).font('Helvetica').text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 80);
            doc.moveDown(2);

            // --- Company & Client Details ---
            doc.fontSize(12).font('Helvetica-Bold').text('Billed To:', 50, 130);
            doc.font('Helvetica').text(data.fullName, 50, 150);
            doc.text(data.companyName, 50, 170);
            doc.text(data.email, 50, 190);
            doc.moveDown(3);

            // --- Invoice Table Header ---
            const tableTop = 250;
            doc.font('Helvetica-Bold');
            doc.fontSize(10)
                .text('Item Description', 50, tableTop)
                .text('Price', 400, tableTop, { width: 100, align: 'right' });
            doc.rect(50, tableTop + 15, 500, 0.5).stroke();
            doc.font('Helvetica');
            
            let position = tableTop + 30;

            // --- Plan Item ---
            const planText = `Subscription: ${data.plan.name}`;
            const planPrice = data.plan.price || 0;
            doc.fontSize(10)
                .text(planText, 50, position)
                .text(`€${planPrice.toFixed(2)}`, 400, position, { width: 100, align: 'right' });
            position += 25;

            // --- Add-on Items ---
            data.addons.forEach(addon => {
                doc.fontSize(10)
                    .text(`Add-on: ${addon.name}`, 50, position)
                    .text(`€${addon.price.toFixed(2)}`, 400, position, { width: 100, align: 'right' });
                position += 20;
            });

            // --- Total ---
            position = Math.max(position, 350);
            doc.rect(50, position, 500, 0.5).stroke();
            doc.font('Helvetica-Bold').fontSize(12)
               .text('Total Amount Due:', 50, position + 15)
               .text(`€${data.totalPrice.toFixed(2)}`, 400, position + 15, { width: 100, align: 'right' });
            doc.font('Helvetica');

            // --- Payment Instructions ---
            const instructionsY = position + 60;
            doc.fontSize(12).font('Helvetica-Bold').text('Payment Instructions', 50, instructionsY);
            doc.fontSize(10).font('Helvetica')
                .text('Please make the payment to the bank account below. Your account will be activated upon confirmation of payment.', 50, instructionsY + 20, { width: 500 })
                .text('Bank Name: YOUR BANK NAME HERE', 50, instructionsY + 45)
                .text('IBAN: YOUR-IBAN-NUMBER-HERE', 50, instructionsY + 60)
                .text('BIC/SWIFT: YOUR-BIC-CODE-HERE', 50, instructionsY + 75)
                .text(`Reference: INVOICE-${data.companyName.replace(/\s+/g, '-')}`, 50, instructionsY + 90);
            
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generateInvoice };