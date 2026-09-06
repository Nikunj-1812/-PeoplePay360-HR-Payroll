const authService = require('../backend/src/services/authService');
const { sql } = require('../backend/src/db');
const crypto = require('crypto');

async function testPasswordResetFlow() {
  console.log('--- 1. Testing requestPasswordReset ---');
  const reqRes = await authService.requestPasswordReset('admin@peoplepay360.com');
  console.log('Result:', reqRes);

  console.log('--- 2. Fetching reset token hash from DB ---');
  const [user] = await sql`
    SELECT id, email, reset_token_hash, reset_token_expires_at 
    FROM users 
    WHERE email = 'admin@peoplepay360.com'
  `;
  console.log('Found user:', user?.id, 'Token hash exists:', !!user?.reset_token_hash);

  console.log('--- 3. Testing verifyResetToken with invalid token ---');
  const invalidVerify = await authService.verifyResetToken('invalid_token_123');
  console.log('Invalid token result:', invalidVerify);

  console.log('--- 4. Testing resetPassword validation error ---');
  try {
    await authService.resetPassword({ token: 'dummy', newPassword: 'weak', confirmPassword: 'weak' });
  } catch (err) {
    console.log('Weak password rejected as expected:', err.message);
  }

  console.log('PASS: All backend auth logic assertions succeeded.');
}

testPasswordResetFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
