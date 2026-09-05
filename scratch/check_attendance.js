const path = require('path');
const { sql } = require(path.join(__dirname, '../backend/src/db'));

async function checkAdminUser() {
  try {
    const admin = await sql`SELECT id, name, email, role, employee_id FROM users WHERE role = 'admin' OR id = 1`;
    console.log('Admin user:', admin);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkAdminUser();
