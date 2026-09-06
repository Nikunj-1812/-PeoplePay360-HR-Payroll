const { sql } = require('../backend/src/db');
const authService = require('../backend/src/services/authService');
const employeeService = require('../backend/src/services/employeeService');
const { validatePassword } = require('../backend/src/utils/passwordPolicy');

async function testOnboardingWorkflow() {
  console.log('=== STARTING EMPLOYEE ONBOARDING & PASSWORD SETUP END-TO-END TEST ===\n');

  const testEmail = `test_onboarding_${Date.now()}@peoplepay360.com`;
  const empData = {
    emp_id: `EMP_${Date.now().toString().slice(-4)}`,
    first_name: 'Onboard',
    last_name: 'Tester',
    email: testEmail,
    job_position: 'Software Engineer',
    department_id: 1,
    status: 'Active'
  };

  // STEP 1: HR Creates Employee
  console.log('1. Testing Employee Creation & User Provisioning...');
  const createRes = await employeeService.createEmployee(empData);
  console.log('   - Employee ID:', createRes.id);
  console.log('   - Role assigned:', createRes.role);
  console.log('   - Account created:', createRes.accountCreated);
  console.log('   - Email status:', createRes.emailSent ? 'Sent' : 'Mocked/Not sent');

  // STEP 2: Database Check
  console.log('\n2. Verifying User Record in Database...');
  const [dbUser] = await sql`SELECT * FROM users WHERE email = ${testEmail}`;
  if (!dbUser) throw new Error('User record missing in DB!');

  console.log('   - user.id:', dbUser.id);
  console.log('   - must_change_password:', dbUser.must_change_password);
  console.log('   - password_hash starts with bcrypt prefix:', dbUser.password_hash.startsWith('$2'));
  console.log('   - reset_token_hash length:', dbUser.reset_token_hash ? dbUser.reset_token_hash.length : 0);
  console.log('   - reset_token_expires_at:', dbUser.reset_token_expires_at);

  if (!dbUser.must_change_password) throw new Error('must_change_password should be TRUE!');
  if (!dbUser.password_hash.startsWith('$2')) throw new Error('Password hash is not bcrypt!');
  if (!dbUser.reset_token_hash) throw new Error('reset_token_hash missing!');

  // STEP 3: Password Policy Validation Tests
  console.log('\n3. Testing Password Policy Validation Utility...');
  const invalidPasses = ['123', 'short', 'NoSpecial1234', 'lowercase123!', 'UPPERCASE123!'];
  for (const pass of invalidPasses) {
    const val = validatePassword(pass);
    if (val.valid) throw new Error(`Weak password "${pass}" unexpectedly passed policy!`);
  }
  console.log('   - Weak passwords correctly rejected.');

  const strongPass = 'PeoplePay360@2026!';
  const strongVal = validatePassword(strongPass);
  if (!strongVal.valid) throw new Error('Strong password failed policy!');
  console.log('   - Strong password "PeoplePay360@2026!" passed policy check.');

  // STEP 4: Test Resend Invitation
  console.log('\n4. Testing Resend Invitation...');
  const resendRes = await employeeService.resendInvitation(createRes.id);
  console.log('   - Resend message:', resendRes.message);

  const [dbUser2] = await sql`SELECT * FROM users WHERE email = ${testEmail}`;
  const newTokenHash = dbUser2.reset_token_hash;
  console.log('   - New token hash created in DB:', newTokenHash !== dbUser.reset_token_hash);

  // STEP 5: Force Password Change via authService.changePassword
  console.log('\n5. Testing Password Change & First Login Resolution...');
  const changeRes = await authService.changePassword(dbUser.id, '', strongPass);
  console.log('   - Change password result:', changeRes.message);

  const [dbUser3] = await sql`SELECT * FROM users WHERE email = ${testEmail}`;
  console.log('   - updated must_change_password:', dbUser3.must_change_password);
  if (dbUser3.must_change_password !== false) throw new Error('must_change_password should be FALSE after password update!');

  // STEP 6: Clean up test employee
  console.log('\n6. Cleaning up test record...');
  await employeeService.deleteEmployee(createRes.id);
  console.log('   - Test employee cleaned up.');

  console.log('\n=== ALL ONBOARDING & PASSWORD SECURITY TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testOnboardingWorkflow().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
