// generateInvoice.js
// Run with: node generateInvoice.js

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Create invoices directory
const invoicesDir = path.join(__dirname, 'invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

// Mock data for RESTPOINT Funeral
const invoiceData = {
  invoice_number: 'RF-2026-001',
  deceased_name: 'Mumo Musyoki',
  nok: 'Muthoni Mumo',
  admission_number: 'ADM-2026-001',
  id_number: '23456789',
  dod: '02 Sep 2026',
  date_of_admission: '01 Sep 2026',
  address: 'Nairobi, Kenya',
  phone: '+254 712 345 678',
  total_amount: 45500,
  subtotal: 45500,
  amount_paid: 20000,
  tax_amount: 0,
  tax_rate: 0,
  mortuary_name: 'RESTPOINT Funeral Home',
  mortuary_phone: '+254 700 123 456',
  stamp_hash: 'RF-INV-01-09-2026',
  signature_url: '',
  created_at: new Date().toISOString(),
  items: [
    {
      service: 'Basic Mortuary Services',
      description: 'Standard mortuary care and body preservation',
      qty: 1,
      unit_price: 15000,
      amount: 15000
    },
    {
      service: 'Coffin - Standard Wood',
      description: 'Mahogany wood coffin with brass fittings',
      qty: 1,
      unit_price: 12000,
      amount: 12000
    },
    {
      service: 'Embalming Services',
      description: 'Professional embalming and body preparation',
      qty: 1,
      unit_price: 8500,
      amount: 8500
    },
    {
      service: 'Vehicle Dispatch',
      description: 'Hearse transportation from mortuary to church',
      qty: 1,
      unit_price: 5000,
      amount: 5000
    },
    {
      service: 'Mortuary Storage',
      description: 'Daily storage and maintenance (3 days)',
      qty: 3,
      unit_price: 1500,
      amount: 4500
    },
    {
      service: 'Death Certificate Processing',
      description: 'Processing and filing of death certificate',
      qty: 1,
      unit_price: 2500,
      amount: 2500
    }
  ],
  payment_options: {
    mpesa: {
      business_number: '123456',
      account_number: 'RF-2026-001'
    },
    bank_transfer: {
      bank_name: 'Equity Bank',
      account_name: 'RESTPOINT Funeral Home',
      account_number: '1234567890',
      branch: 'Nairobi'
    },
    cash_cheque: 'Accepted at our office',
    installment_plan: true
  }
};

// Generate the PDF
async function generateInvoicePDFBuffer(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const tenantName = 'RESTPOINT Funeral Home';
      const tenantAddress = 'Nairobi, Kenya';
      const tenantPhone = '+254 700 123 456';
      const tenantEmail = 'info@restpoint.co.ke';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoice_number}`,
          Author: tenantName,
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // ============================================
      // HEADER SECTION
      // ============================================
      const headerTop = 30;

      // Top decorative line
      doc.rect(50, headerTop - 5, 495, 2).fill('#1a5276');

      // LOGO PLACEHOLDER - Clean text-based logo
      doc.rect(50, headerTop + 5, 80, 40).fill('#1a5276');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('RESTPOINT', 55, headerTop + 15);
      doc.fontSize(8).font('Helvetica').fillColor('#ffffff').text('FUNERAL HOME', 55, headerTop + 32);

      // Company name
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a5276').text('RESTPOINT FUNERAL HOME', 150, headerTop + 10);
      doc.fontSize(8).font('Helvetica').fillColor('#4a5568')
        .text(tenantAddress, 150, headerTop + 35)
        .text(`Tel: ${tenantPhone} | Email: ${tenantEmail}`, 150, headerTop + 48);

      // Invoice title
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a5276')
        .text('INVOICE', 480, headerTop + 10, { align: 'right' });

      const detailsTop = headerTop + 80;

      // Decorative divider
      doc.rect(50, detailsTop - 5, 495, 1).fill('#e2e8f0');

      // ============================================
      // INVOICE & CLIENT INFORMATION
      // ============================================
      const leftCol = 50;
      const rightCol = 300;

      // Invoice Details Box
      doc.rect(leftCol, detailsTop, 230, 80).fill('#f7fafc').stroke('#e2e8f0');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a5276').text('INVOICE DETAILS', leftCol + 12, detailsTop + 10);
      doc.font('Helvetica').fillColor('#2d3748')
        .text(`Invoice Number: ${invoice.invoice_number}`, leftCol + 12, detailsTop + 28)
        .text(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, leftCol + 12, detailsTop + 44)
        .text(`Status: ${invoice.amount_paid >= invoice.total_amount ? 'PAID' : 'PARTIAL'}`, leftCol + 12, detailsTop + 60);

      // Client Information Box
      doc.rect(rightCol, detailsTop, 245, 80).fill('#f7fafc').stroke('#e2e8f0');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a5276').text('CLIENT INFORMATION', rightCol + 12, detailsTop + 10);
      doc.font('Helvetica').fillColor('#2d3748')
        .text(`Deceased: ${invoice.deceased_name}`, rightCol + 12, detailsTop + 28)
        .text(`Admission #: ${invoice.admission_number}`, rightCol + 12, detailsTop + 44)
        .text(`Next of Kin: ${invoice.nok}`, rightCol + 12, detailsTop + 60);

      // ============================================
      // ITEMS TABLE
      // ============================================
      const tableTop = detailsTop + 100;
      const tableX = 50;
      const tableWidth = 495;
      const rowHeight = 25;

      // Table Header
      doc.rect(tableX, tableTop, tableWidth, 24).fill('#1a5276');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
        .text('SERVICE DESCRIPTION', tableX + 10, tableTop + 7, { width: 230 })
        .text('QTY', tableX + 250, tableTop + 7, { width: 40, align: 'center' })
        .text('UNIT PRICE (KES)', tableX + 300, tableTop + 7, { width: 90, align: 'right' })
        .text('AMOUNT (KES)', tableX + 400, tableTop + 7, { width: 85, align: 'right' });

      let currentY = tableTop + 24;
      const items = invoice.items || [];

      // Table Rows
      items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f7fafc';
        doc.rect(tableX, currentY, tableWidth, rowHeight).fill(rowColor);
        doc.rect(tableX, currentY, tableWidth, rowHeight).stroke('#e2e8f0');

        const unitPrice = parseFloat(String(item.unit_price || item.amount || 0));
        const quantity = parseFloat(String(item.qty || item.quantity || 1));
        const amount = quantity * unitPrice;

        doc.fontSize(7).font('Helvetica').fillColor('#2d3748')
          .text(item.service || item.description || 'Service', tableX + 10, currentY + 6, { width: 230 })
          .text(quantity.toString(), tableX + 250, currentY + 6, { width: 40, align: 'center' })
          .text(unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }), tableX + 300, currentY + 6, { width: 90, align: 'right' })
          .text(amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), tableX + 400, currentY + 6, { width: 85, align: 'right' });

        currentY += rowHeight;
      });

      // ============================================
      // SUMMARY SECTION
      // ============================================
      const summaryTop = currentY + 15;
      const summaryX = 350;
      const summaryWidth = 195;

      // Summary Box
      doc.rect(summaryX, summaryTop, summaryWidth, 110).fill('#f7fafc').stroke('#e2e8f0');

      const totalAmount = parseFloat(String(invoice.total_amount || 0));
      const amountPaid = parseFloat(String(invoice.amount_paid || 0));
      const balance = totalAmount - amountPaid;

      let yPos = summaryTop + 10;
      doc.fontSize(8).font('Helvetica').fillColor('#4a5568')
        .text('Subtotal:', summaryX + 12, yPos, { width: 80 })
        .text(`KES ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + 100, yPos, { width: 85, align: 'right' });

      yPos += 18;
      doc.fontSize(8).font('Helvetica').fillColor('#4a5568')
        .text('Tax (0%):', summaryX + 12, yPos, { width: 80 })
        .text('KES 0.00', summaryX + 100, yPos, { width: 85, align: 'right' });

      yPos += 18;
      doc.rect(summaryX + 10, yPos, 175, 1).fill('#e2e8f0');

      yPos += 10;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a5276')
        .text('Total:', summaryX + 12, yPos, { width: 80 })
        .text(`KES ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + 100, yPos, { width: 85, align: 'right' });

      yPos += 22;
      doc.fontSize(7).font('Helvetica').fillColor('#4a5568')
        .text(`Paid: KES ${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + 12, yPos)
        .text(`Balance Due: KES ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, summaryX + 12, yPos + 14);

      // Payment Status Badge
      let statusText = balance <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
      let statusColor = balance <= 0 ? '#48bb78' : amountPaid > 0 ? '#ed8936' : '#fc8181';
      let statusBg = balance <= 0 ? '#f0fff4' : amountPaid > 0 ? '#fffbeb' : '#fff5f5';

      doc.rect(summaryX + 120, summaryTop + 10, 65, 16).fill(statusBg);
      doc.strokeColor(statusColor).lineWidth(1).rect(summaryX + 120, summaryTop + 10, 65, 16).stroke();
      doc.fontSize(6).font('Helvetica-Bold').fillColor(statusColor)
        .text(statusText, summaryX + 125, summaryTop + 14, { width: 55, align: 'center' });

      // ============================================
      // PAYMENT OPTIONS
      // ============================================
      const paymentTop = Math.max(summaryTop + 130, currentY + 30);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a5276').text('PAYMENT OPTIONS', 50, paymentTop);

      let payY = paymentTop + 18;
      doc.fontSize(7).font('Helvetica').fillColor('#4a5568');

      if (invoice.payment_options?.mpesa) {
        doc.text(`MPESA Paybill: ${invoice.payment_options.mpesa.business_number} | Account: ${invoice.payment_options.mpesa.account_number}`, 50, payY);
        payY += 14;
      }

      if (invoice.payment_options?.bank_transfer) {
        const bank = invoice.payment_options.bank_transfer;
        doc.text(`Bank Transfer: ${bank.bank_name} | A/C: ${bank.account_number} (${bank.account_name}) | Branch: ${bank.branch}`, 50, payY);
        payY += 14;
      }

      if (invoice.payment_options?.installment_plan) {
        doc.text('Installment Plans Available - Contact us for flexible arrangements', 50, payY);
        payY += 14;
      }

      doc.text('Cash/Cheque: Accepted at our office', 50, payY);

      // ============================================
      // FOOTER WITH TERMS
      // ============================================
      const footerTop = Math.max(paymentTop + 100, 720);

      // Decorative line
      doc.rect(50, footerTop, 495, 1).fill('#1a5276');

      // Verification info
      doc.fontSize(6).font('Helvetica').fillColor('#718096')
        .text(`Verification Code: ${invoice.stamp_hash}`, 50, footerTop + 10)
        .text(`Generated: ${new Date().toLocaleString('en-GB')}`, 50, footerTop + 20);

      // Terms
      doc.fontSize(6).font('Helvetica').fillColor('#4a5568')
        .text('This invoice is computer generated and does not require a physical signature.', 50, footerTop + 40, { align: 'center', width: 495 })
        .text('All payments should be made to RESTPOINT Funeral Home bank account as indicated above.', 50, footerTop + 50, { align: 'center', width: 495 })
        .text('Please retain this invoice for your records. For inquiries, contact us at +254 700 123 456.', 50, footerTop + 60, { align: 'center', width: 495 });

      // Signature line
      doc.strokeColor('#4a5568').lineWidth(0.5).moveTo(400, footerTop + 50).lineTo(480, footerTop + 50).stroke();
      doc.fontSize(6).fillColor('#718096')
        .text('Authorized Signature', 400, footerTop + 55)
        .fontSize(6).text('RESTPOINT Funeral Home', 400, footerTop + 65);

      // Bottom decorative line
      doc.rect(50, footerTop + 85, 495, 2).fill('#1a5276');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Main function
async function generateInvoice() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       RESTPOINT FUNERAL HOME - INVOICE GENERATOR        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log(`📋 Invoice #: ${invoiceData.invoice_number}`);
    console.log(`👤 Deceased: ${invoiceData.deceased_name}`);
    console.log(`💰 Total Amount: KES ${invoiceData.total_amount.toLocaleString()}`);
    console.log(`💳 Amount Paid: KES ${invoiceData.amount_paid.toLocaleString()}`);
    console.log(`📌 Balance: KES ${(invoiceData.total_amount - invoiceData.amount_paid).toLocaleString()}`);
    console.log('────────────────────────────────────────────────────────────\n');

    const pdfBuffer = await generateInvoicePDFBuffer(invoiceData);

    const fileName = `${invoiceData.invoice_number}_${invoiceData.deceased_name.replace(/\s/g, '_')}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    console.log('✅ PDF GENERATED SUCCESSFULLY!\n');
    console.log(`📄 File: ${filePath}`);
    console.log(`📊 Total Items: ${invoiceData.items.length}`);
    console.log('────────────────────────────────────────────────────────────');
    console.log('✨ Invoice generated successfully!\n');

  } catch (error) {
    console.error('❌ Error generating invoice:', error.message);
    console.error(error.stack);
  }
}

// Run the script
generateInvoice();