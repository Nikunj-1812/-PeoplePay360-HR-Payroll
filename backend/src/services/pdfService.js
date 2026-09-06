const PDFDocument = require('pdfkit');
const { sql } = require('../db');

function formatPayslipDate(d) {
  if (!d) return 'N/A';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatCurrencyINR(amount) {
  const n = parseFloat(amount) || 0;
  const absFormatted = Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return n < 0 ? `- INR ${absFormatted}` : `INR ${absFormatted}`;
}

async function generatePayslipPDF(payslipId) {
  const payslips = await sql`
    SELECT 
      p.*,
      e.first_name, e.last_name, e.emp_id, e.email, e.job_position, e.bank_name, e.account_number, e.ifsc_code,
      d.name as department_name,
      pr.name as payrun_name
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    JOIN payruns pr ON p.payrun_id = pr.id
    WHERE p.id = ${payslipId}
  `;

  if (payslips.length === 0) throw new Error('Payslip not found');
  const slip = payslips[0];

  const lines = await sql`
    SELECT * FROM payslip_lines
    WHERE payslip_id = ${payslipId}
    ORDER BY sequence ASC
  `;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      const PAGE_WIDTH = 595.28;
      const PAGE_HEIGHT = 841.89;
      const MARGIN = 40;
      const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 515.28

      const renderHeader = () => {
        doc.fillColor('#0A1931').rect(0, 0, PAGE_WIDTH, 80).fill('#0A1931');
        doc.fillColor('#B3CFE5').fontSize(22).font('Helvetica-Bold').text('PeoplePay360', MARGIN, 22);
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica').text('HR & PAYROLL OPERATIONS PLATFORM', MARGIN, 48);
        doc.fillColor('#B3CFE5').fontSize(14).font('Helvetica-Bold').text('PAYSLIP STATEMENT', MARGIN, 32, { width: CONTENT_WIDTH, align: 'right' });
      };

      // Branding Header
      renderHeader();

      // Title Section
      doc.fillColor('#1A3D63').fontSize(13).font('Helvetica-Bold').text(`Employee Payslip: ${slip.first_name} ${slip.last_name}`, MARGIN, 95, { width: CONTENT_WIDTH, lineBreak: false, ellipsis: true });
      doc.strokeColor('#B3CFE5').lineWidth(1).moveTo(MARGIN, 115).lineTo(PAGE_WIDTH - MARGIN, 115).stroke();

      // Employee Information 2-Column Grid
      const COL1_LABEL_X = MARGIN;         // 40
      const COL1_LABEL_W = 80;
      const COL1_VAL_X   = MARGIN + 85;    // 125
      const COL1_VAL_W   = 165;

      const COL2_LABEL_X = MARGIN + 265;   // 305
      const COL2_LABEL_W = 75;
      const COL2_VAL_X   = MARGIN + 345;   // 385
      const COL2_VAL_W   = 170;

      let infoY = 125;
      const rowGap = 18;

      // Row 1: Emp ID & Department
      doc.fontSize(9).fillColor('#0A1931');
      doc.font('Helvetica-Bold').text('Employee ID:', COL1_LABEL_X, infoY, { width: COL1_LABEL_W });
      doc.font('Helvetica').text(slip.emp_id || 'N/A', COL1_VAL_X, infoY, { width: COL1_VAL_W, height: 12, lineBreak: false, ellipsis: true });
      doc.font('Helvetica-Bold').text('Department:', COL2_LABEL_X, infoY, { width: COL2_LABEL_W });
      doc.font('Helvetica').text(slip.department_name || 'N/A', COL2_VAL_X, infoY, { width: COL2_VAL_W, height: 12, lineBreak: false, ellipsis: true });

      // Row 2: Designation & Pay Period
      infoY += rowGap;
      const periodStr = `${formatPayslipDate(slip.period_start)} - ${formatPayslipDate(slip.period_end)}`;
      doc.font('Helvetica-Bold').text('Designation:', COL1_LABEL_X, infoY, { width: COL1_LABEL_W });
      doc.font('Helvetica').text(slip.job_position || 'N/A', COL1_VAL_X, infoY, { width: COL1_VAL_W, height: 12, lineBreak: false, ellipsis: true });
      doc.font('Helvetica-Bold').text('Pay Period:', COL2_LABEL_X, infoY, { width: COL2_LABEL_W });
      doc.font('Helvetica').text(periodStr, COL2_VAL_X, infoY, { width: COL2_VAL_W, height: 12, lineBreak: false, ellipsis: true });

      // Row 3: Bank Name & Account No
      infoY += rowGap;
      doc.font('Helvetica-Bold').text('Bank Name:', COL1_LABEL_X, infoY, { width: COL1_LABEL_W });
      doc.font('Helvetica').text(slip.bank_name || 'N/A', COL1_VAL_X, infoY, { width: COL1_VAL_W, height: 12, lineBreak: false, ellipsis: true });
      doc.font('Helvetica-Bold').text('Account No:', COL2_LABEL_X, infoY, { width: COL2_LABEL_W });
      doc.font('Helvetica').text(slip.account_number || 'N/A', COL2_VAL_X, infoY, { width: COL2_VAL_W, height: 12, lineBreak: false, ellipsis: true });

      infoY += 24;
      doc.strokeColor('#E5E4E7').lineWidth(1).moveTo(MARGIN, infoY).lineTo(PAGE_WIDTH - MARGIN, infoY).stroke();

      // Salary Breakdown Table Header
      let tableY = infoY + 12;
      const TBL_CODE_X = MARGIN + 10;     // 50
      const TBL_CODE_W = 65;
      const TBL_NAME_X = MARGIN + 80;     // 120
      const TBL_NAME_W = 200;
      const TBL_CAT_X  = MARGIN + 285;    // 325
      const TBL_CAT_W  = 90;
      const TBL_AMT_X  = MARGIN + 380;    // 420
      const TBL_AMT_W  = 125;

      const renderTableHeader = (yPos) => {
        doc.fillColor('#F6FAFD').rect(MARGIN, yPos, CONTENT_WIDTH, 24).fill('#F6FAFD');
        doc.fillColor('#0A1931').fontSize(9).font('Helvetica-Bold');
        doc.text('Code', TBL_CODE_X, yPos + 7, { width: TBL_CODE_W });
        doc.text('Salary Component', TBL_NAME_X, yPos + 7, { width: TBL_NAME_W });
        doc.text('Category', TBL_CAT_X, yPos + 7, { width: TBL_CAT_W });
        doc.text('Amount (INR)', TBL_AMT_X, yPos + 7, { width: TBL_AMT_W, align: 'right' });
      };

      renderTableHeader(tableY);
      tableY += 28;

      // Table Rows
      for (const line of lines) {
        doc.font('Helvetica').fontSize(9).fillColor('#0A1931');
        const nameHeight = doc.heightOfString(line.rule_name || '', { width: TBL_NAME_W });
        const rowHeight = Math.max(18, nameHeight + 4);

        if (tableY + rowHeight > 730) {
          doc.addPage();
          tableY = 40;
          renderTableHeader(tableY);
          tableY += 28;
        }

        doc.text(line.rule_code || '', TBL_CODE_X, tableY, { width: TBL_CODE_W, lineBreak: false, ellipsis: true });
        doc.text(line.rule_name || '', TBL_NAME_X, tableY, { width: TBL_NAME_W });
        doc.text(String(line.category || 'GENERAL').toUpperCase(), TBL_CAT_X, tableY, { width: TBL_CAT_W, lineBreak: false, ellipsis: true });
        doc.text(formatCurrencyINR(line.amount), TBL_AMT_X, tableY, { width: TBL_AMT_W, align: 'right' });
        
        tableY += rowHeight;
      }

      tableY += 8;
      doc.strokeColor('#1A3D63').lineWidth(1).moveTo(MARGIN, tableY).lineTo(PAGE_WIDTH - MARGIN, tableY).stroke();

      // Summary Box
      tableY += 15;
      const BOX_W = 250;
      const BOX_X = PAGE_WIDTH - MARGIN - BOX_W; // 305.28
      const BOX_H = 85;

      if (tableY + BOX_H > 750) {
        doc.addPage();
        tableY = 40;
      }

      doc.fillColor('#F6FAFD').rect(BOX_X, tableY, BOX_W, BOX_H).fill('#F6FAFD');
      doc.strokeColor('#B3CFE5').lineWidth(1).rect(BOX_X, tableY, BOX_W, BOX_H).stroke();

      const SUM_LBL_X = BOX_X + 12;
      const SUM_LBL_W = 110;
      const SUM_AMT_X = BOX_X + 125;
      const SUM_AMT_W = 113;

      let sumY = tableY + 10;
      doc.fillColor('#0A1931').fontSize(9).font('Helvetica-Bold');
      doc.text('Gross Earnings:', SUM_LBL_X, sumY, { width: SUM_LBL_W });
      doc.text(formatCurrencyINR(slip.gross_amount), SUM_AMT_X, sumY, { width: SUM_AMT_W, align: 'right' });

      sumY += 20;
      doc.text('Total Deductions:', SUM_LBL_X, sumY, { width: SUM_LBL_W });
      doc.text(`- ${formatCurrencyINR(slip.deduction_amount)}`, SUM_AMT_X, sumY, { width: SUM_AMT_W, align: 'right' });

      sumY += 24;
      doc.fillColor('#1A3D63').fontSize(11).font('Helvetica-Bold');
      doc.text('NET PAYABLE:', SUM_LBL_X, sumY, { width: SUM_LBL_W });
      doc.text(formatCurrencyINR(slip.net_amount), SUM_AMT_X, sumY, { width: SUM_AMT_W, align: 'right' });

      // Footer
      const footerY = 780;
      doc.fontSize(8).fillColor('#6B6375').font('Helvetica');
      doc.text(`This is a computer-generated payslip reference: PAYSLIP-${slip.id} issued by PeoplePay360 on ${formatPayslipDate(new Date())}`, MARGIN, footerY, { width: CONTENT_WIDTH, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePayslipPDF };
