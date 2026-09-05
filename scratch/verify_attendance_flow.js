const path = require('path');
const { sql } = require(path.join(__dirname, '../backend/src/db'));
const attendanceService = require(path.join(__dirname, '../backend/src/services/attendanceService'));

async function testAttendanceFlow() {
  console.log('--- STARTING ATTENDANCE FLOW INTEGRATION TEST ---');
  
  const testEmpId = 1; // Admin / Aarav Mehta
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  try {
    // Clean up test records for today first
    console.log(`1. Cleaning up existing test records for employee ${testEmpId} on ${todayStr}...`);
    await sql`DELETE FROM attendance WHERE employee_id = ${testEmpId} AND (date = ${todayStr}::date OR check_in::date = ${todayStr}::date)`;
    console.log('✓ Cleanup completed.');

    // Step 1: Clock In
    console.log('2. Executing clockIn...');
    const rec1 = await attendanceService.clockIn(testEmpId);
    console.log('✓ clockIn result:', {
      id: rec1.id,
      employee_id: rec1.employee_id,
      date: rec1.date,
      check_in: rec1.check_in,
      check_out: rec1.check_out,
      worked_hours: rec1.worked_hours,
      status: rec1.status
    });

    if (!rec1.check_in || rec1.check_out !== null) {
      throw new Error('FAILED: Initial clockIn state invalid.');
    }

    // Step 2: Attempt duplicate Clock In
    console.log('3. Testing Duplicate Clock In protection...');
    try {
      await attendanceService.clockIn(testEmpId);
      throw new Error('FAILED: Duplicate clockIn should have thrown an error!');
    } catch (err) {
      if (err.message.includes('already checked in')) {
        console.log('✓ Duplicate clockIn successfully rejected:', err.message);
      } else {
        throw err;
      }
    }

    // Step 3: Fetch attendance list
    console.log('4. Testing getAttendance query...');
    const list = await attendanceService.getAttendance({ employee_id: testEmpId });
    console.log(`✓ Fetched ${list.length} records. Latest record ID: ${list[0]?.id}`);
    if (list[0]?.id !== rec1.id) {
      throw new Error('FAILED: Latest record does not match clockIn record.');
    }

    // Wait 1.5 seconds to simulate worked time
    console.log('5. Waiting 1.5 seconds to simulate session time...');
    await new Promise(res => setTimeout(res, 1500));

    // Step 4: Clock Out
    console.log('6. Executing clockOut...');
    const rec2 = await attendanceService.clockOut(testEmpId);
    console.log('✓ clockOut result:', {
      id: rec2.id,
      employee_id: rec2.employee_id,
      check_in: rec2.check_in,
      check_out: rec2.check_out,
      worked_hours: rec2.worked_hours,
      status: rec2.status
    });

    if (!rec2.check_out || !rec2.worked_hours) {
      throw new Error('FAILED: clockOut failed to record check_out timestamp or worked_hours.');
    }

    // Step 5: Attempt duplicate Clock Out
    console.log('7. Testing Duplicate Clock Out protection...');
    try {
      await attendanceService.clockOut(testEmpId);
      throw new Error('FAILED: Duplicate clockOut should have thrown an error!');
    } catch (err) {
      if (err.message.includes('already checked out')) {
        console.log('✓ Duplicate clockOut successfully rejected:', err.message);
      } else {
        throw err;
      }
    }

    console.log('--- ALL ATTENDANCE FLOW TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ ATTENDANCE TEST FAILED:', err);
    process.exit(1);
  }
}

testAttendanceFlow();
