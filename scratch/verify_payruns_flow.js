const path = require('path');
const { sql } = require(path.join(__dirname, '../backend/src/db'));
const payrollService = require(path.join(__dirname, '../backend/src/services/payrollService'));

async function testPayrunsFlow() {
  console.log('--- STARTING PAYRUNS & PAYROLL ENGINE INTEGRATION TEST ---');

  try {
    // 1. Fetch eligible employees
    console.log('1. Fetching eligible employees for Sept 2026 payroll...');
    const eligible = await payrollService.getEligibleEmployees(1, '2026-09-01', '2026-09-30');
    console.log(`✓ Found ${eligible.length} eligible employees.`);
    if (eligible.length === 0) throw new Error('FAILED: No eligible employees found.');

    const empWithContracts = eligible.filter(e => e.contract_id);
    console.log(`✓ Employees with active contracts: ${empWithContracts.length}`);
    const empIds = empWithContracts.slice(0, 5).map(e => e.id);
    const testName = `Test Batch ${Date.now()}`;

    // 2. Create Payrun (Step 2 completion)
    console.log(`2. Creating Payrun batch "${testName}" with ${empIds.length} employees...`);
    const payrun = await payrollService.createPayrun({
      name: testName,
      salary_structure_id: 1,
      period_start: '2026-09-01',
      period_end: '2026-09-30',
      employee_ids: empIds
    });
    console.log('✓ Created Payrun:', { id: payrun.id, name: payrun.name, status: payrun.status, payslip_count: payrun.payslip_count });
    if (payrun.status !== 'Draft') throw new Error('FAILED: Payrun initial status should be Draft.');

    // 3. Compute Payrun (Runs ordered salary rules engine)
    console.log(`3. Computing Payrun ${payrun.id}...`);
    const computed = await payrollService.computePayrun(payrun.id);
    console.log('✓ Computed Payrun:', { id: computed.id, status: computed.status, total_gross: computed.total_gross, total_net: computed.total_net });
    if (computed.status !== 'Computed') throw new Error('FAILED: Payrun status should be Computed.');

    // 4. Fetch Payrun Detail
    console.log(`4. Fetching Payrun detail for ID ${payrun.id}...`);
    const detail = await payrollService.getPayrunById(payrun.id);
    console.log(`✓ Fetched Payrun detail. Payslips count: ${detail.payslips.length}`);

    const firstSlip = detail.payslips[0];
    console.log('✓ First generated payslip:', {
      id: firstSlip.id,
      employee_name: firstSlip.employee_name,
      gross_amount: firstSlip.gross_amount,
      deduction_amount: firstSlip.deduction_amount,
      net_amount: firstSlip.net_amount,
      status: firstSlip.status
    });

    // 5. Fetch Payslip itemized lines
    console.log(`5. Fetching itemized lines for Payslip ${firstSlip.id}...`);
    const lines = await sql`SELECT * FROM payslip_lines WHERE payslip_id = ${firstSlip.id} ORDER BY sequence ASC`;
    console.log(`✓ Fetched ${lines.length} itemized salary computation lines:`);
    lines.forEach(l => {
      console.log(`   - [Seq ${l.sequence}] ${l.rule_name} (${l.rule_code}): ₹ ${l.amount} [${l.category}]`);
    });

    if (lines.length === 0) throw new Error('FAILED: Payslip itemized lines are empty.');

    // Clean up test payrun
    console.log('6. Cleaning up test payrun record...');
    await sql`DELETE FROM payruns WHERE id = ${payrun.id}`;
    console.log('✓ Cleanup completed.');

    console.log('--- ALL PAYRUNS & PAYROLL ENGINE TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ PAYRUNS TEST FAILED:', err);
    process.exit(1);
  }
}

testPayrunsFlow();
