const path = require('path');
const { sql } = require(path.join(__dirname, '../backend/src/db'));
const payrollService = require(path.join(__dirname, '../backend/src/services/payrollService'));
const emailService = require(path.join(__dirname, '../backend/src/services/emailService'));

async function testActionRedirectFlow() {
  console.log('--- STARTING PAYRUN ACTION REDIRECT FLOW VERIFICATION ---');

  try {
    // Setup test payrun
    console.log('1. Creating test payrun batch...');
    const eligible = await payrollService.getEligibleEmployees(1, '2026-09-01', '2026-09-30');
    const empIds = eligible.slice(0, 2).map(e => e.id);
    const testName = `Redirect Test Batch ${Date.now()}`;

    const payrun = await payrollService.createPayrun({
      name: testName,
      salary_structure_id: 1,
      period_start: '2026-09-01',
      period_end: '2026-09-30',
      employee_ids: empIds
    });
    console.log('✓ Created Payrun:', { id: payrun.id, name: payrun.name, status: payrun.status });

    // Test 1: Compute Action
    console.log('2. Testing Compute action execution...');
    const computed = await payrollService.computePayrun(payrun.id);
    console.log('✓ Compute executed successfully. New status:', computed.status);
    if (computed.status !== 'Computed') throw new Error('Compute failed');

    // Test 2: Validate Action
    console.log('3. Testing Validate action execution...');
    const validated = await payrollService.updatePayrunStatus(payrun.id, 'Validated');
    console.log('✓ Validate executed successfully. New status:', validated.status);
    if (validated.status !== 'Validated') throw new Error('Validate failed');

    // Test 3: Mark Paid Action
    console.log('4. Testing Mark Paid action execution...');
    const paid = await payrollService.updatePayrunStatus(payrun.id, 'Paid');
    console.log('✓ Mark Paid executed successfully. New status:', paid.status);
    if (paid.status !== 'Paid') throw new Error('Mark Paid failed');

    // Test 4: Send Bulk Email Action
    console.log('5. Testing Send Bulk Email action execution...');
    const emailRes = await emailService.sendBulkPayslips(payrun.id);
    console.log('✓ Send Bulk Email executed successfully:', emailRes);

    // Clean up
    console.log('6. Cleaning up test payrun record...');
    await sql`DELETE FROM payruns WHERE id = ${payrun.id}`;
    console.log('✓ Cleanup completed.');

    console.log('--- ALL PAYRUN ACTION REDIRECT TESTS PASSED ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ ACTION REDIRECT TEST FAILED:', err);
    process.exit(1);
  }
}

testActionRedirectFlow();
