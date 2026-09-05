const { sql } = require('../db');
const bcrypt = require('bcryptjs');

// Map position or string role to standard 5-tier system role
function resolveRole(role, jobPosition) {
  const validRoles = ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'];
  if (role && validRoles.includes(role)) return role;
  
  if (!jobPosition) return 'employee';
  const pos = String(jobPosition).toLowerCase();
  if (pos.includes('admin')) return 'admin';
  if (pos.includes('payroll manager') || pos.includes('payroll admin')) return 'hr_payroll_manager';
  if (pos.includes('payroll')) return 'hr_payroll_user';
  if (pos.includes('hr manager') || pos.includes('hr lead')) return 'hr_manager';
  return 'employee';
}

// List employees with search, department, status filters, and user role
async function getEmployees(filters = {}) {
  const searchPattern = filters.search ? `%${filters.search.toLowerCase()}%` : null;

  return await sql`
    SELECT 
      e.*,
      d.name as department_name,
      ws.name as schedule_name,
      COALESCE(u.role, 'employee') as role,
      u.id as user_id,
      (SELECT COUNT(*)::int FROM contracts c WHERE c.employee_id = e.id) as contract_count,
      (SELECT COUNT(*)::int FROM payslips p WHERE p.employee_id = e.id) as payslip_count
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    LEFT JOIN users u ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
    WHERE (${searchPattern}::text IS NULL OR (
      LOWER(e.first_name || ' ' || e.last_name) LIKE ${searchPattern} OR 
      LOWER(e.email) LIKE ${searchPattern} OR 
      LOWER(e.emp_id) LIKE ${searchPattern} OR 
      LOWER(e.job_position) LIKE ${searchPattern}
    ))
    AND (${filters.department_id ? parseInt(filters.department_id, 10) : null}::int IS NULL OR e.department_id = ${filters.department_id ? parseInt(filters.department_id, 10) : null})
    AND (${filters.status || null}::text IS NULL OR e.status = ${filters.status || null})
    ORDER BY e.id DESC
  `;
}

// Get employee by ID with relation counts, current contract, and user role
async function getEmployeeById(id) {
  const emps = await sql`
    SELECT 
      e.*,
      d.name as department_name,
      ws.name as schedule_name,
      m.first_name || ' ' || m.last_name as manager_name,
      COALESCE(u.role, 'employee') as role,
      u.id as user_id
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN users u ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
    WHERE e.id = ${parseInt(id, 10)}
  `;

  if (emps.length === 0) throw new Error('Employee not found');
  const employee = emps[0];

  const [contracts] = await sql`SELECT count(*)::int as count FROM contracts WHERE employee_id = ${id}`;
  const [attendance] = await sql`SELECT count(*)::int as count FROM attendance WHERE employee_id = ${id}`;
  const [timeOff] = await sql`SELECT count(*)::int as count FROM time_off_requests WHERE employee_id = ${id}`;
  const [payslips] = await sql`SELECT count(*)::int as count FROM payslips WHERE employee_id = ${id}`;
  const [allocations] = await sql`SELECT count(*)::int as count FROM time_off_allocations WHERE employee_id = ${id}`;

  return {
    ...employee,
    smart_links: {
      contracts: contracts.count,
      attendance: attendance.count,
      time_off_requests: timeOff.count,
      payslips: payslips.count,
      allocations: allocations.count
    }
  };
}

// Retrieve complete chronological employment history
async function getEmployeeHistory(id) {
  const employee = await getEmployeeById(id);

  // All historical contracts
  const contracts = await sql`
    SELECT 
      c.*,
      ss.name as salary_structure_name,
      d.name as department_name
    FROM contracts c
    LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.employee_id = ${id}
    ORDER BY c.start_date DESC
  `;

  // Payslip history
  const payslips = await sql`
    SELECT 
      p.*,
      pr.name as payrun_name
    FROM payslips p
    JOIN payruns pr ON p.payrun_id = pr.id
    WHERE p.employee_id = ${id}
    ORDER BY p.period_start DESC
  `;

  // Leave history
  const timeOff = await sql`
    SELECT 
      tor.*,
      tot.name as type_name
    FROM time_off_requests tor
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    WHERE tor.employee_id = ${id}
    ORDER BY tor.start_date DESC
    LIMIT 10
  `;

  return {
    employee,
    contracts,
    payslips,
    timeOff
  };
}

// Create new employee and auto-sync user account
async function createEmployee(data) {
  const { emp_id, first_name, last_name, email, phone, department_id, manager_id, schedule_id, job_position, role, bank_name, account_number, ifsc_code } = data;
  const cleanEmail = String(email).trim().toLowerCase();
  const targetRole = resolveRole(role, job_position);

  const [newEmp] = await sql`
    INSERT INTO employees 
      (emp_id, first_name, last_name, email, phone, department_id, manager_id, schedule_id, job_position, status, bank_name, account_number, ifsc_code)
    VALUES
      (${emp_id}, ${first_name}, ${last_name}, ${cleanEmail}, ${phone || null}, ${department_id ? parseInt(department_id, 10) : null}, ${manager_id ? parseInt(manager_id, 10) : null}, ${schedule_id ? parseInt(schedule_id, 10) : null}, ${job_position || 'Employee'}, 'Active', ${bank_name || null}, ${account_number || null}, ${ifsc_code || null})
    RETURNING *
  `;

  // Sync to Users table (Settings & Users)
  const existingUsers = await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} OR employee_id = ${newEmp.id}`;
  if (existingUsers.length > 0) {
    await sql`
      UPDATE users SET
        name = ${`${first_name} ${last_name}`.trim()},
        email = ${cleanEmail},
        role = ${targetRole},
        employee_id = ${newEmp.id}
      WHERE id = ${existingUsers[0].id}
    `;
  } else {
    const passwordHash = await bcrypt.hash('PeoplePay@123', 10);
    await sql`
      INSERT INTO users (name, email, password_hash, role, employee_id)
      VALUES (${`${first_name} ${last_name}`.trim()}, ${cleanEmail}, ${passwordHash}, ${targetRole}, ${newEmp.id})
    `;
  }

  return { ...newEmp, role: targetRole };
}

// Update existing employee and sync user account & role
async function updateEmployee(id, data) {
  const cleanId = parseInt(id, 10);
  const existing = await getEmployeeById(cleanId);
  const {
    first_name = existing.first_name,
    last_name = existing.last_name,
    email = existing.email,
    phone = existing.phone,
    department_id = existing.department_id,
    manager_id = existing.manager_id,
    schedule_id = existing.schedule_id,
    job_position = existing.job_position,
    role = existing.role,
    status = existing.status || 'Active',
    bank_name = existing.bank_name,
    account_number = existing.account_number,
    ifsc_code = existing.ifsc_code
  } = data;

  const cleanEmail = String(email).trim().toLowerCase();
  const targetRole = resolveRole(role, job_position);

  const [updated] = await sql`
    UPDATE employees SET
      first_name = ${first_name},
      last_name = ${last_name},
      email = ${cleanEmail},
      phone = ${phone || null},
      department_id = ${department_id ? parseInt(department_id, 10) : null},
      manager_id = ${manager_id ? parseInt(manager_id, 10) : null},
      schedule_id = ${schedule_id ? parseInt(schedule_id, 10) : null},
      job_position = ${job_position},
      status = ${status},
      bank_name = ${bank_name || null},
      account_number = ${account_number || null},
      ifsc_code = ${ifsc_code || null}
    WHERE id = ${cleanId}
    RETURNING *
  `;

  // Live Sync to Users table (Settings & Users)
  const users = await sql`SELECT id FROM users WHERE employee_id = ${cleanId} OR LOWER(email) = ${cleanEmail}`;
  if (users.length > 0) {
    await sql`
      UPDATE users SET
        name = ${`${first_name} ${last_name}`.trim()},
        email = ${cleanEmail},
        role = ${targetRole},
        employee_id = ${cleanId}
      WHERE id = ${users[0].id}
    `;
  } else {
    const passwordHash = await bcrypt.hash('PeoplePay@123', 10);
    await sql`
      INSERT INTO users (name, email, password_hash, role, employee_id)
      VALUES (${`${first_name} ${last_name}`.trim()}, ${cleanEmail}, ${passwordHash}, ${targetRole}, ${cleanId})
    `;
  }

  return { ...updated, role: targetRole };
}

// Delete employee record and related dependent data
async function deleteEmployee(id) {
  const cleanId = parseInt(id, 10);
  await sql`DELETE FROM attendance WHERE employee_id = ${cleanId}`;
  await sql`DELETE FROM time_off_requests WHERE employee_id = ${cleanId}`;
  await sql`DELETE FROM time_off_allocations WHERE employee_id = ${cleanId}`;
  await sql`DELETE FROM payslips WHERE employee_id = ${cleanId}`;
  await sql`DELETE FROM contracts WHERE employee_id = ${cleanId}`;
  await sql`DELETE FROM users WHERE employee_id = ${cleanId}`;
  const [deleted] = await sql`DELETE FROM employees WHERE id = ${cleanId} RETURNING *`;
  return deleted;
}

module.exports = {
  getEmployees,
  getEmployeeById,
  getEmployeeHistory,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
