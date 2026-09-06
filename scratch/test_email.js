const { sendPasswordResetEmail } = require('../backend/src/services/emailService');

async function testEmail() {
  console.log('Sending test password reset email...');
  const res = await sendPasswordResetEmail({
    email: 'time65315@gmail.com',
    name: 'Test User',
    resetToken: 'test_token_12345'
  });
  console.log('Email delivery result:', res);
}

testEmail()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Email test error:', err);
    process.exit(1);
  });
