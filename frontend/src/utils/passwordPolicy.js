// Centralized Password Policy Regex for Frontend
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

export function checkPasswordRequirements(password = '') {
  const pwd = String(password);
  return {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecial: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
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
