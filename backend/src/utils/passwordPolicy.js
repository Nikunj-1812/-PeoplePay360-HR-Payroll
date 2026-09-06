const crypto = require('crypto');

// Centralized Password Policy Regex
// Minimum 12 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required and must be a string.'
    };
  }

  const errors = [];
  if (password.length < 12) {
    errors.push('Must be at least 12 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter (a-z).');
  }
  if (!/\d/.test(password)) {
    errors.push('Must contain at least one number (0-9).');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Must contain at least one special character (@$!%*?&).');
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.join(' ')
  };
}

// Generate a cryptographically secure random temporary password that satisfies all policy rules
function generateSecureTemporaryPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@$!%*?&';
  const allChars = uppers + lowers + digits + symbols;

  let pwd = [
    uppers[crypto.randomInt(0, uppers.length)],
    lowers[crypto.randomInt(0, lowers.length)],
    digits[crypto.randomInt(0, digits.length)],
    symbols[crypto.randomInt(0, symbols.length)]
  ];

  while (pwd.length < 14) {
    pwd.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Shuffle array using Fisher-Yates with crypto.randomInt
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  const result = pwd.join('');
  const val = validatePassword(result);
  if (!val.isValid) {
    return generateSecureTemporaryPassword();
  }
  return result;
}

module.exports = {
  PASSWORD_REGEX,
  validatePassword,
  generateSecureTemporaryPassword
};
