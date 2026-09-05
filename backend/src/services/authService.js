const { sql } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

async function login(email, password) {
  if (!email || !password) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const cleanEmail = email.trim().toLowerCase();

  const users = await sql`
    SELECT u.*, e.first_name, e.last_name, e.department_id, e.job_position
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE LOWER(TRIM(u.email)) = ${cleanEmail}
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

async function getAllUsers() {
  return await sql`
    SELECT u.id, u.name, u.email, u.role, u.employee_id, e.emp_id
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    ORDER BY u.id ASC
  `;
}

module.exports = { login, getCurrentUser, getAllUsers };
