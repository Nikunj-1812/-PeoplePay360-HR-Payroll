const { sql } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const crypto = require('crypto');
const { validatePassword, generateSecureTemporaryPassword } = require('../utils/passwordPolicy');
const emailService = require('./emailService');

// Authenticate user with email and password
async function login(email, password) {
  if (!email || !password) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const users = await sql`
    SELECT u.*, e.first_name, e.last_name, e.department_id, e.job_position
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE LOWER(TRIM(u.email)) = ${normalizedEmail}
  `;

  if (users.length === 0) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const user = users[0];
  if (!user.password_hash) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, employee_id: user.employee_id, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
      position: user.job_position,
      must_change_password: !!user.must_change_password
    }
  };
}

// Get authenticated user by ID
async function getCurrentUser(userId) {
  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, u.employee_id, u.must_change_password, e.first_name, e.last_name, e.job_position, e.department_id
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.id = ${userId}
  `;
  if (users.length === 0) throw new Error('User not found.');
  return {
    ...users[0],
    must_change_password: !!users[0].must_change_password
  };
}

// Get all users for admin management
async function getAllUsers() {
  return await sql`
    SELECT u.id, u.name, u.email, u.role, u.employee_id, u.must_change_password, e.emp_id, e.first_name, e.last_name, e.job_position
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    ORDER BY u.id ASC
  `;
}

// Admin: Create new user
async function createUser(data) {
  const { name, email, password, role, employee_id } = data;
  const cleanEmail = String(email).trim().toLowerCase();
  const rawPassword = password || (typeof generateSecureTemporaryPassword === 'function' ? generateSecureTemporaryPassword() : 'PeoplePay@123');
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  let targetEmpId = employee_id ? parseInt(employee_id, 10) : null;

  // Check email uniqueness across users
  const existingUser = await sql`SELECT id FROM users WHERE LOWER(TRIM(email)) = ${cleanEmail}`;
  if (existingUser.length > 0) {
    const err = new Error(`A user account with email "${cleanEmail}" already exists.`);
    err.status = 400;
    throw err;
  }

  // Link users created from an existing employee email automatically.
  if (!targetEmpId) {
    const [matchingEmployee] = await sql`
      SELECT id FROM employees
      WHERE LOWER(TRIM(email)) = ${cleanEmail}
      LIMIT 1
    `;
    targetEmpId = matchingEmployee?.id || null;
  }

  // Generate 24h reset token for setup link
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const [user] = await sql`
    INSERT INTO users (name, email, password_hash, role, employee_id, must_change_password, reset_token_hash, reset_token_expires_at)
    VALUES (${name}, ${cleanEmail}, ${passwordHash}, ${role || 'employee'}, ${targetEmpId}, FALSE, ${tokenHash}, ${expiresAt})
    RETURNING id, name, email, role, employee_id, created_at
  `;

  if (targetEmpId) {
    const roleTitleMap = {
      'admin': 'Admin',
      'hr_payroll_manager': 'HR Payroll Manager',
      'hr_payroll_user': 'HR Payroll User',
      'hr_manager': 'HR Manager',
      'employee': 'Employee'
    };
    const newPosition = roleTitleMap[role] || 'Employee';
    await sql`
      UPDATE employees SET
        email = ${cleanEmail},
        job_position = ${newPosition}
      WHERE id = ${targetEmpId}
    `;
  }

  // Send onboarding email with temporary password & reset token
  let emailSent = false;
  let emailError = null;
  try {
    const emailRes = await emailService.sendOnboardingEmail({
      employeeName: name,
      employeeEmail: cleanEmail,
      temporaryPassword: rawPassword,
      resetToken: rawToken
    });
    emailSent = !!emailRes.emailSent;
    if (!emailSent && emailRes.error) emailError = emailRes.error;
  } catch (err) {
    console.error(`[createUser] Failed to send onboarding email to ${cleanEmail}:`, err.message);
    emailError = err.message;
  }

  return {
    ...user,
    temporaryPassword: rawPassword,
    resetToken: rawToken,
    emailSent,
    emailError
  };
}

// Admin: Resend user onboarding credentials via email
async function resendUserCredentials(id) {
  const users = await sql`SELECT id, name, email, role, employee_id FROM users WHERE id = ${id}`;
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const user = users[0];
  const newTempPassword = typeof generateSecureTemporaryPassword === 'function' ? generateSecureTemporaryPassword() : 'PeoplePay@123';
  const passwordHash = await bcrypt.hash(newTempPassword, 10);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await sql`
    UPDATE users SET
      password_hash = ${passwordHash},
      reset_token_hash = ${tokenHash},
      reset_token_expires_at = ${expiresAt},
      reset_token_used_at = NULL
    WHERE id = ${user.id}
  `;

  const emailRes = await emailService.sendOnboardingEmail({
    employeeName: user.name,
    employeeEmail: user.email,
    temporaryPassword: newTempPassword,
    resetToken: rawToken
  });

  return {
    success: true,
    email: user.email,
    emailSent: !!emailRes.emailSent,
    temporaryPassword: newTempPassword,
    message: emailRes.emailSent
      ? `Onboarding credentials email sent to ${user.email}.`
      : `Credentials reset, but onboarding email failed to deliver: ${emailRes.error || 'SMTP Error'}`
  };
}

// Admin: Update user details & role
async function updateUser(id, data) {
  const { name, email, role, employee_id } = data;
  const cleanEmail = String(email).trim().toLowerCase();
  const targetEmpId = employee_id ? parseInt(employee_id, 10) : null;

  const [user] = await sql`
    UPDATE users SET
      name = ${name},
      email = ${cleanEmail},
      role = ${role},
      employee_id = ${targetEmpId}
    WHERE id = ${parseInt(id, 10)}
    RETURNING id, name, email, role, employee_id
  `;

  if (targetEmpId) {
    const roleTitleMap = {
      'admin': 'Admin',
      'hr_payroll_manager': 'HR Payroll Manager',
      'hr_payroll_user': 'HR Payroll User',
      'hr_manager': 'HR Manager',
      'employee': 'Employee'
    };
    const newPosition = roleTitleMap[role] || 'Employee';
    await sql`
      UPDATE employees SET
        email = ${cleanEmail},
        job_position = ${newPosition}
      WHERE id = ${targetEmpId}
    `;
  }

  return user;
}

// Admin: Reset user password
async function resetUserPassword(id, newPassword) {
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    const err = new Error(`Password policy violation: ${validation.message}`);
    err.status = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await sql`
    UPDATE users 
    SET password_hash = ${passwordHash}, must_change_password = FALSE 
    WHERE id = ${id}
  `;
  return { success: true };
}

// Admin: Delete user
async function deleteUser(id) {
  const [deleted] = await sql`DELETE FROM users WHERE id = ${id} RETURNING id, email, role`;
  return deleted;
}

// Request Password Reset Link (Forgot Password)
async function requestPasswordReset(email) {
  if (!email || !String(email).includes('@')) {
    const err = new Error('A valid email address is required.');
    err.status = 400;
    throw err;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const users = await sql`SELECT id, name, email FROM users WHERE LOWER(TRIM(email)) = ${cleanEmail}`;

  if (users.length === 0) {
    return { success: true, message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  const user = users[0];
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await sql`
    UPDATE users SET
      reset_token_hash = ${tokenHash},
      reset_token_expires_at = ${expiresAt},
      reset_token_used_at = NULL
    WHERE id = ${user.id}
  `;

  await emailService.sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetToken: rawToken
  });

  const baseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  return {
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.',
    resetLink,
    token: rawToken
  };
}

// Verify Reset Token
async function verifyResetToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return { success: false, valid: false, message: 'This password setup link is invalid or has expired.' };
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const users = await sql`
    SELECT id, name, email, reset_token_expires_at, reset_token_used_at 
    FROM users 
    WHERE reset_token_hash = ${tokenHash}
  `;

  if (users.length === 0) {
    return { success: false, valid: false, message: 'This password setup link is invalid or has expired.' };
  }

  const user = users[0];
  if (user.reset_token_used_at) {
    return { success: false, valid: false, message: 'This password setup link has already been used.' };
  }

  if (user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) {
    return { success: false, valid: false, message: 'This password setup link has expired. Please request a new invitation.' };
  }

  return {
    success: true,
    valid: true,
    email: user.email,
    user: { id: user.id, name: user.name, email: user.email }
  };
}

// Reset Password using Token
async function resetPassword(arg1, arg2, arg3) {
  let token, newPassword, confirmPassword;
  if (typeof arg1 === 'object' && arg1 !== null) {
    token = arg1.token;
    newPassword = arg1.newPassword;
    confirmPassword = arg1.confirmPassword !== undefined ? arg1.confirmPassword : arg1.newPassword;
  } else {
    token = arg1;
    newPassword = arg2;
    confirmPassword = arg3 !== undefined ? arg3 : arg2;
  }

  if (!token) {
    const err = new Error('This password setup link is invalid or has expired.');
    err.status = 400;
    throw err;
  }

  if (!newPassword || newPassword !== confirmPassword) {
    const err = new Error('Passwords do not match.');
    err.status = 400;
    throw err;
  }

  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    const err = new Error(`Password policy violation: ${validation.message}`);
    err.status = 400;
    throw err;
  }

  const verification = await verifyResetToken(token);
  if (!verification.valid) {
    const err = new Error(verification.message);
    err.status = 400;
    throw err;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  const [updated] = await sql`
    UPDATE users SET
      password_hash = ${newPasswordHash},
      must_change_password = FALSE,
      reset_token_used_at = NOW()
    WHERE reset_token_hash = ${tokenHash}
      AND reset_token_used_at IS NULL
    RETURNING id, email
  `;

  if (!updated) {
    const err = new Error('This password setup link is invalid or has expired.');
    err.status = 400;
    throw err;
  }

  return { success: true, message: 'Password updated successfully. You can now log in with your new password.' };
}

// Authenticated User Forced / Voluntary Password Change
async function changePassword(userId, arg2, arg3, arg4) {
  let currentPassword, newPassword, confirmPassword;
  if (typeof arg2 === 'object' && arg2 !== null) {
    currentPassword = arg2.currentPassword;
    newPassword = arg2.newPassword;
    confirmPassword = arg2.confirmPassword || arg2.newPassword;
  } else {
    currentPassword = arg2;
    newPassword = arg3;
    confirmPassword = arg4 || arg3;
  }

  const cleanId = parseInt(userId, 10);
  if (!cleanId || isNaN(cleanId)) {
    const err = new Error('Invalid user context.');
    err.status = 401;
    throw err;
  }

  if (!newPassword || newPassword !== confirmPassword) {
    const err = new Error('New passwords do not match.');
    err.status = 400;
    throw err;
  }

  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    const err = new Error(`Password policy violation: ${validation.message}`);
    err.status = 400;
    throw err;
  }

  const users = await sql`SELECT id, password_hash FROM users WHERE id = ${cleanId}`;
  if (users.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const user = users[0];
  if (user.password_hash && currentPassword) {
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const err = new Error('Current password is incorrect.');
      err.status = 400;
      throw err;
    }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await sql`
    UPDATE users SET
      password_hash = ${newPasswordHash},
      must_change_password = FALSE
    WHERE id = ${cleanId}
  `;

  return { success: true, message: 'Password changed successfully.' };
}

module.exports = {
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
  resendUserCredentials,
  updateUser,
  resetUserPassword,
  deleteUser,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword
};
