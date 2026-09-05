const PDFDocument = require('pdfkit');
const { sql } = require('../db');

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

      // Branding Header
      doc.fillColor('#0A1931').rect(0, 0, 595.28, 80).fill('#0A1931');
      doc.fillColor('#B3CFE5').fontSize(22).font('Helvetica-Bold').text('PeoplePay360', 40, 25);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text('HR & PAYROLL OPERATIONS PLATFORM', 40, 50);
      doc.fillColor('#B3CFE5').fontSize(14).font('Helvetica-Bold').text('PAYSLIP STATEMENT', 400, 32, { align: 'right' });

      doc.moveDown(3);

      // Metadata Card
      doc.fillColor('#1A3D63').fontSize(14).font('Helvetica-Bold').text(`Employee Payslip: ${slip.first_name} ${slip.last_name}`, 40, 100);
      doc.strokeColor('#B3CFE5').lineWidth(1).moveTo(40, 120).lineTo(555, 120).stroke();

      doc.fontSize(10).fillColor('#0A1931').font('Helvetica-Bold');
      doc.text('Employee ID:', 40, 130);
      doc.font('Helvetica').text(slip.emp_id, 130, 130);
      doc.font('Helvetica-Bold').text('Department:', 300, 130);
      doc.font('Helvetica').text(slip.department_name || 'N/A', 400, 130);

      doc.font('Helvetica-Bold').text('Designation:', 40, 150);
      doc.font('Helvetica').text(slip.job_position || 'N/A', 130, 150);
      doc.font('Helvetica-Bold').text('Pay Period:', 300, 150);
      doc.font('Helvetica').text(`${slip.period_start} to ${slip.period_end}`, 400, 150);

      doc.font('Helvetica-Bold').text('Bank Name:', 40, 170);
      doc.font('Helvetica').text(slip.bank_name || 'N/A', 130, 170);
      doc.font('Helvetica-Bold').text('Account No:', 300, 170);
      doc.font('Helvetica').text(slip.account_number || 'N/A', 400, 170);

      doc.strokeColor('#E5E4E7').lineWidth(1).moveTo(40, 195).lineTo(555, 195).stroke();

      // Salary Breakdown Table Header
      let y = 210;
      doc.fillColor('#F6FAFD').rect(40, y, 515, 25).fill('#F6FAFD');
      doc.fillColor('#0A1931').fontSize(10).font('Helvetica-Bold');
      doc.text('Code', 50, y + 7);
      doc.text('Salary Component', 130, y + 7);
      doc.text('Category', 330, y + 7);
      doc.text('Amount (INR)', 450, y + 7, { align: 'right' });

      y += 30;

      // Table Rows
      for (const line of lines) {
        doc.font('Helvetica').fontSize(9).fillColor('#0A1931');
        doc.text(line.rule_code, 50, y);
        doc.text(line.rule_name, 130, y);
        doc.text(line.category.toUpperCase(), 330, y);
        doc.text(`₹ ${parseFloat(line.amount).toLocaleString('en-IN')}`, 450, y, { align: 'right' });
        y += 20;
      }

      doc.strokeColor('#1A3D63').lineWidth(1).moveTo(40, y + 10).lineTo(555, y + 10).stroke();

      y += 25;

      // Summary Box
      doc.fillColor('#F6FAFD').rect(300, y, 255, 90).fill('#F6FAFD');
      doc.strokeColor('#B3CFE5').rect(300, y, 255, 90).stroke();

      doc.fillColor('#0A1931').fontSize(10).font('Helvetica-Bold');
      doc.text('Gross Earnings:', 310, y + 12);
      doc.text(`₹ ${parseFloat(slip.gross_amount).toLocaleString('en-IN')}`, 450, y + 12, { align: 'right' });

      doc.text('Total Deductions:', 310, y + 32);
      doc.text(`- ₹ ${parseFloat(slip.deduction_amount).toLocaleString('en-IN')}`, 450, y + 32, { align: 'right' });

      doc.fillColor('#1A3D63').fontSize(12).font('Helvetica-Bold');
      doc.text('NET PAYABLE:', 310, y + 60);
      doc.text(`₹ ${parseFloat(slip.net_amount).toLocaleString('en-IN')}`, 450, y + 60, { align: 'right' });

      // Footer
      doc.fontSize(8).fillColor('#6B6375').font('Helvetica');
      doc.text(`This is a computer-generated payslip reference: PAYSLIP-${slip.id} issued by PeoplePay360 on ${new Date().toLocaleDateString()}`, 40, 750, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePayslipPDF };
