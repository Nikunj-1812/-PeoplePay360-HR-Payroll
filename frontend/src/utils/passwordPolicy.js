// Centralized Password Policy Regex for Frontend
// Minimum 12 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

export function checkPasswordRequirements(password = '') {
  const pwd = String(password);
  return {
    minLength: pwd.length >= 12,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecial: /[@$!%*?&]/.test(pwd)
  };
}

export function isPasswordValid(password = '') {
  const reqs = checkPasswordRequirements(password);
  return reqs.minLength && reqs.hasUpper && reqs.hasLower && reqs.hasNumber && reqs.hasSpecial;
}

export function validatePassword(password = '') {
  const reqs = checkPasswordRequirements(password);
  const valid = reqs.minLength && reqs.hasUpper && reqs.hasLower && reqs.hasNumber && reqs.hasSpecial;
  return { valid, ...reqs };
}
