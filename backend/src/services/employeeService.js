const { sql } = require('../db');

// List employees with search, department and status filters
async function getEmployees(filters = {}) {
  const searchPattern = filters.search ? `%${filters.search.toLowerCase()}%` : null;

  return await sql`
    SELECT 
      e.*,
      d.name as department_name,
      ws.name as schedule_name,
      (SELECT COUNT(*)::int FROM contracts c WHERE c.employee_id = e.id) as contract_count,
      (SELECT COUNT(*)::int FROM payslips p WHERE p.employee_id = e.id) as payslip_count
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
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

// Get employee by ID with relation counts and current contract
async function getEmployeeById(id) {
  const emps = await sql`
    SELECT 
      e.*,
      d.name as department_name,
      ws.name as schedule_name,
      m.first_name || ' ' || m.last_name as manager_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    LEFT JOIN employees m ON e.manager_id = m.id
    WHERE e.id = ${id}
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

// Create new employee
async function createEmployee(data) {
  const { emp_id, first_name, last_name, email, phone, department_id, manager_id, schedule_id, job_position, bank_name, account_number, ifsc_code } = data;

  const [newEmp] = await sql`
    INSERT INTO employees 
      (emp_id, first_name, last_name, email, phone, department_id, manager_id, schedule_id, job_position, status, bank_name, account_number, ifsc_code)
    VALUES
      (${emp_id}, ${first_name}, ${last_name}, ${email}, ${phone || null}, ${department_id || null}, ${manager_id || null}, ${schedule_id || null}, ${job_position}, 'Active', ${bank_name || null}, ${account_number || null}, ${ifsc_code || null})
    RETURNING *
  `;
  return newEmp;
}

// Update existing employee
async function updateEmployee(id, data) {
  const { first_name, last_name, email, phone, department_id, manager_id, schedule_id, job_position, status, bank_name, account_number, ifsc_code } = data;

  const [updated] = await sql`
    UPDATE employees SET
      first_name = ${first_name},
      last_name = ${last_name},
      email = ${email},
      phone = ${phone},
      department_id = ${department_id || null},
      manager_id = ${manager_id || null},
      schedule_id = ${schedule_id || null},
      job_position = ${job_position},
      status = ${status || 'Active'},
      bank_name = ${bank_name},
      account_number = ${account_number},
      ifsc_code = ${ifsc_code}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

module.exports = {
  getEmployees,
  getEmployeeById,
  getEmployeeHistory,
  createEmployee,
  updateEmployee
};
