const { sql } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

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
      position: user.job_position
    }
  };
}

// Get authenticated user by ID
async function getCurrentUser(userId) {
  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, u.employee_id, e.first_name, e.last_name, e.job_position, e.department_id
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.id = ${userId}
  `;
  if (users.length === 0) throw new Error('User not found.');
  return users[0];
}

// Get all users for admin management
async function getAllUsers() {
  return await sql`
    SELECT u.id, u.name, u.email, u.role, u.employee_id, e.emp_id, e.first_name, e.last_name, e.job_position
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    ORDER BY u.id ASC
  `;
}

// Admin: Create new user
async function createUser(data) {
  const { name, email, password, role, employee_id } = data;
  const cleanEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password || 'PeoplePay@123', 10);

  const [user] = await sql`
    INSERT INTO users (name, email, password_hash, role, employee_id)
    VALUES (${name}, ${cleanEmail}, ${passwordHash}, ${role || 'employee'}, ${employee_id || null})
    RETURNING id, name, email, role, employee_id, created_at
  `;
  return user;
}

// Admin: Update user details & role
async function updateUser(id, data) {
  const { name, email, role, employee_id } = data;
  const cleanEmail = String(email).trim().toLowerCase();

  const [user] = await sql`
    UPDATE users SET
      name = ${name},
      email = ${cleanEmail},
      role = ${role},
      employee_id = ${employee_id || null}
    WHERE id = ${id}
    RETURNING id, name, email, role, employee_id
  `;
  return user;
}

// Admin: Reset user password
async function resetUserPassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}`;
  return { success: true };
}

// Admin: Delete user
async function deleteUser(id) {
  const [deleted] = await sql`DELETE FROM users WHERE id = ${id} RETURNING id, email, role`;
  return deleted;
}

module.exports = {
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser
};
