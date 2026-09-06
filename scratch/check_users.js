const { sql } = require('../backend/src/db');

async function checkUsers() {
  console.log('--- USERS TABLE ---');
  const users = await sql`SELECT id, name, email, role, employee_id FROM users ORDER BY id ASC`;
  console.log('Users in DB:', users);

  console.log('--- EMPLOYEES TABLE ---');
  const employees = await sql`SELECT id, emp_id, first_name, last_name, email FROM employees ORDER BY id ASC LIMIT 10`;
  console.log('Employees in DB:', employees);
}

checkUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Check error:', err);
    process.exit(1);
  });
