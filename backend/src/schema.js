const { sql } = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  console.log('[DB] Initializing database schema...');

  // 1. Departments
  await sql`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 2. Working Schedules
  await sql`
    CREATE TABLE IF NOT EXISTS working_schedules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      schedule_type VARCHAR(50) DEFAULT 'Full Time',
      monday_start VARCHAR(10) DEFAULT '09:00',
      monday_end VARCHAR(10) DEFAULT '18:00',
      monday_break VARCHAR(10) DEFAULT '01:00',
      tuesday_start VARCHAR(10) DEFAULT '09:00',
      tuesday_end VARCHAR(10) DEFAULT '18:00',
      tuesday_break VARCHAR(10) DEFAULT '01:00',
      wednesday_start VARCHAR(10) DEFAULT '09:00',
      wednesday_end VARCHAR(10) DEFAULT '18:00',
      wednesday_break VARCHAR(10) DEFAULT '01:00',
      thursday_start VARCHAR(10) DEFAULT '09:00',
      thursday_end VARCHAR(10) DEFAULT '18:00',
      thursday_break VARCHAR(10) DEFAULT '01:00',
      friday_start VARCHAR(10) DEFAULT '09:00',
      friday_end VARCHAR(10) DEFAULT '18:00',
      friday_break VARCHAR(10) DEFAULT '01:00',
      saturday_start VARCHAR(10) DEFAULT '',
      saturday_end VARCHAR(10) DEFAULT '',
      saturday_break VARCHAR(10) DEFAULT '',
      sunday_start VARCHAR(10) DEFAULT '',
      sunday_end VARCHAR(10) DEFAULT '',
      sunday_break VARCHAR(10) DEFAULT '',
      weekly_hours NUMERIC(5,2) DEFAULT 40,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 3. Employees
  await sql`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      emp_id VARCHAR(50) NOT NULL UNIQUE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      schedule_id INTEGER REFERENCES working_schedules(id) ON DELETE SET NULL,
      job_position VARCHAR(120) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      bank_name VARCHAR(120),
      account_number VARCHAR(80),
      ifsc_code VARCHAR(50),
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 4. Users (Auth)
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'employee',
      employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL`;

  // 5. Salary Structures
  await sql`
    CREATE TABLE IF NOT EXISTS salary_structures (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 6. Contracts
  await sql`
    CREATE TABLE IF NOT EXISTS contracts (
      id SERIAL PRIMARY KEY,
      contract_number VARCHAR(100) NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE,
      wage NUMERIC(12,2) NOT NULL,
      salary_structure_id INTEGER REFERENCES salary_structures(id) ON DELETE SET NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      position VARCHAR(120),
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      employment_terms TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 7. Attendance
  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      check_in TIMESTAMPTZ,
      check_out TIMESTAMPTZ,
      worked_hours NUMERIC(5,2) DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'Present',
      exception_note TEXT,
      corrected_by VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(employee_id, date)
    )
  `;

  // 8. Time Off Types
  await sql`
    CREATE TABLE IF NOT EXISTS time_off_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      unit VARCHAR(20) DEFAULT 'days',
      requires_allocation BOOLEAN DEFAULT TRUE,
      approval_workflow VARCHAR(50) DEFAULT 'Manager',
      payroll_integration BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 9. Time Off Allocations
  await sql`
    CREATE TABLE IF NOT EXISTS time_off_allocations (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      time_off_type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
      allocated_days NUMERIC(5,2) NOT NULL,
      taken_days NUMERIC(5,2) DEFAULT 0,
      remaining_days NUMERIC(5,2) NOT NULL,
      validity_start DATE NOT NULL,
      validity_end DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'Approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 10. Time Off Requests
  await sql`
    CREATE TABLE IF NOT EXISTS time_off_requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      time_off_type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      duration NUMERIC(5,2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      reason TEXT,
      approved_by VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 11. Salary Rules
  await sql`
    CREATE TABLE IF NOT EXISTS salary_rules (
      id SERIAL PRIMARY KEY,
      salary_structure_id INTEGER NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL,
      sequence INTEGER NOT NULL DEFAULT 10,
      computation_type VARCHAR(50) NOT NULL DEFAULT 'fixed',
      amount NUMERIC(12,2) DEFAULT 0,
      percentage NUMERIC(5,2) DEFAULT 0,
      percentage_based_on VARCHAR(50),
      formula_expression TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 12. Payruns
  await sql`
    CREATE TABLE IF NOT EXISTS payruns (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      salary_structure_id INTEGER NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      total_net NUMERIC(14,2) DEFAULT 0,
      total_gross NUMERIC(14,2) DEFAULT 0,
      payslip_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 13. Payslips
  await sql`
    CREATE TABLE IF NOT EXISTS payslips (
      id SERIAL PRIMARY KEY,
      payrun_id INTEGER NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      worked_days NUMERIC(5,2) DEFAULT 30,
      gross_amount NUMERIC(12,2) DEFAULT 0,
      deduction_amount NUMERIC(12,2) DEFAULT 0,
      net_amount NUMERIC(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Draft',
      pdf_url TEXT,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 14. Payslip Lines
  await sql`
    CREATE TABLE IF NOT EXISTS payslip_lines (
      id SERIAL PRIMARY KEY,
      payslip_id INTEGER NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
      salary_rule_id INTEGER REFERENCES salary_rules(id) ON DELETE SET NULL,
      rule_code VARCHAR(50) NOT NULL,
      rule_name VARCHAR(120) NOT NULL,
      category VARCHAR(50) NOT NULL,
      sequence INTEGER NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 15. Notifications
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      link_tab VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log('[DB] Core tables created/updated. Seeding initial data...');
  await seedData();
  await ensureDemoUsers();
  console.log('[DB] Seeding completed.');
  const [firstUser] = await sql`SELECT * FROM users LIMIT 1`;
  return firstUser;
}

async function ensureDemoUsers() {
  const emp1 = await sql`SELECT id FROM employees ORDER BY id ASC LIMIT 1`;
  const empId1 = emp1.length > 0 ? emp1[0].id : null;
  const emp2 = await sql`SELECT id FROM employees ORDER BY id ASC OFFSET 1 LIMIT 1`;
  const empId2 = emp2.length > 0 ? emp2[0].id : empId1;
  const emp3 = await sql`SELECT id FROM employees ORDER BY id ASC OFFSET 2 LIMIT 1`;
  const empId3 = emp3.length > 0 ? emp3[0].id : empId1;

  const demoDefs = [
    { name: 'Admin User', email: 'admin@peoplepay360.com', pass: 'Admin@123', role: 'admin', empId: empId1 },
    { name: 'HR Manager', email: 'hrmanager@peoplepay360.com', pass: 'HRManager@123', role: 'hr_manager', empId: empId2 },
    { name: 'HR Payroll User', email: 'payrolluser@peoplepay360.com', pass: 'PayrollUser@123', role: 'hr_payroll_user', empId: empId3 },
    { name: 'HR Payroll Manager', email: 'payrollmanager@peoplepay360.com', pass: 'PayrollManager@123', role: 'hr_payroll_manager', empId: empId3 },
    { name: 'Employee User', email: 'employee@peoplepay360.com', pass: 'Employee@123', role: 'employee', empId: empId1 }
  ];

  for (const def of demoDefs) {
    const cleanEmail = def.email.trim().toLowerCase();
    const hash = await bcrypt.hash(def.pass, 10);
    const existing = await sql`SELECT id FROM users WHERE LOWER(TRIM(email)) = ${cleanEmail}`;

    if (existing.length > 0) {
      await sql`
        UPDATE users 
        SET name = ${def.name}, email = ${cleanEmail}, password_hash = ${hash}, role = ${def.role}, employee_id = ${def.empId}
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO users (name, email, password_hash, role, employee_id)
        VALUES (${def.name}, ${cleanEmail}, ${hash}, ${def.role}, ${def.empId})
      `;
    }
  }
}

async function seedData() {
  console.log('[DB] Running seedData check...');

  // 1. Departments
  let engId, hrId, finId, mktId;
  const existingDepts = await sql`SELECT id, code FROM departments`;
  if (existingDepts.length === 0) {
    const depts = await sql`
      INSERT INTO departments (name, code)
      VALUES 
        ('Engineering', 'ENG'),
        ('Human Resources', 'HR'),
        ('Finance', 'FIN'),
        ('Marketing & Sales', 'MKT')
      RETURNING id, code
    `;
    engId = depts.find(d => d.code === 'ENG').id;
    hrId = depts.find(d => d.code === 'HR').id;
    finId = depts.find(d => d.code === 'FIN').id;
    mktId = depts.find(d => d.code === 'MKT').id;
  } else {
    engId = existingDepts.find(d => d.code === 'ENG')?.id || existingDepts[0].id;
    hrId = existingDepts.find(d => d.code === 'HR')?.id || existingDepts[0].id;
    finId = existingDepts.find(d => d.code === 'FIN')?.id || existingDepts[0].id;
    mktId = existingDepts.find(d => d.code === 'MKT')?.id || existingDepts[0].id;
  }

  // 2. Working Schedule
  const existingSched = await sql`SELECT id FROM working_schedules LIMIT 1`;
  let scheduleId;
  if (existingSched.length === 0) {
    const [sched] = await sql`
      INSERT INTO working_schedules (name, schedule_type, weekly_hours)
      VALUES ('Standard 40h Weekly Pattern', 'Full Time', 40.0)
      RETURNING id
    `;
    scheduleId = sched.id;
  } else {
    scheduleId = existingSched[0].id;
  }

  // 3. Employees
  const existingEmps = await sql`SELECT id, emp_id, first_name, last_name, email FROM employees`;
  let empRecords = existingEmps;
  if (existingEmps.length === 0) {
    empRecords = await sql`
      INSERT INTO employees 
        (emp_id, first_name, last_name, email, phone, department_id, schedule_id, job_position, status, bank_name, account_number, ifsc_code)
      VALUES
        ('EMP001', 'Aarav', 'Sharma', 'aarav.sharma@peoplepay360.com', '+91 9876543210', ${engId}, ${scheduleId}, 'Senior Software Engineer', 'Active', 'HDFC Bank', '50100234567891', 'HDFC0001234'),
        ('EMP002', 'Priya', 'Patel', 'priya.patel@peoplepay360.com', '+91 9876543211', ${hrId}, ${scheduleId}, 'HR Lead', 'Active', 'ICICI Bank', '000401567892', 'ICIC0000004'),
        ('EMP003', 'Rohan', 'Verma', 'rohan.verma@peoplepay360.com', '+91 9876543212', ${finId}, ${scheduleId}, 'Payroll Specialist', 'Active', 'State Bank of India', '30987654321', 'SBIN0000123'),
        ('EMP004', 'Ananya', 'Iyer', 'ananya.iyer@peoplepay360.com', '+91 9876543213', ${mktId}, ${scheduleId}, 'Marketing Manager', 'Active', 'Axis Bank', '915010045678901', 'UTIB0000250'),
        ('EMP005', 'Vikram', 'Singh', 'vikram.singh@peoplepay360.com', '+91 9876543214', ${engId}, ${scheduleId}, 'DevOps Engineer', 'Active', 'HDFC Bank', '50100987654321', 'HDFC0001234')
      ON CONFLICT (emp_id) DO NOTHING
      RETURNING id, emp_id, first_name, last_name, email
    `;
    if (!empRecords || empRecords.length === 0) {
      empRecords = await sql`SELECT id, emp_id, first_name, last_name, email FROM employees`;
    }
  }

  const emp1 = empRecords.find(e => e.emp_id === 'EMP001') || empRecords[0];
  const emp2 = empRecords.find(e => e.emp_id === 'EMP002') || empRecords[0];
  const emp3 = empRecords.find(e => e.emp_id === 'EMP003') || empRecords[0];
  const emp4 = empRecords.find(e => e.emp_id === 'EMP004') || empRecords[0];
  const emp5 = empRecords.find(e => e.emp_id === 'EMP005') || empRecords[0];

  // 4. Salary Structures & Rules
  let salStructId;
  const existingStructs = await sql`SELECT id FROM salary_structures LIMIT 1`;
  if (existingStructs.length === 0) {
    const [salStruct] = await sql`
      INSERT INTO salary_structures (name, description, is_active)
      VALUES ('Standard Regular Salary', 'Default salary structure for permanent employees in India', true)
      RETURNING id
    `;
    salStructId = salStruct.id;

    await sql`
      INSERT INTO salary_rules (salary_structure_id, name, code, category, sequence, computation_type, amount, percentage, percentage_based_on)
      VALUES
        (${salStructId}, 'Basic Salary', 'BASIC', 'basic', 10, 'percentage', 0, 50.00, 'WAGE'),
        (${salStructId}, 'House Rent Allowance (HRA)', 'HRA', 'allowance', 20, 'percentage', 0, 40.00, 'BASIC'),
        (${salStructId}, 'Special Allowance', 'SPECIAL_ALLOW', 'allowance', 30, 'percentage', 0, 10.00, 'WAGE'),
        (${salStructId}, 'Gross Salary', 'GROSS', 'gross', 40, 'formula', 0, 0, 'BASIC + HRA + SPECIAL_ALLOW'),
        (${salStructId}, 'Provident Fund (PF)', 'PF', 'deduction', 50, 'percentage', 0, 12.00, 'BASIC'),
        (${salStructId}, 'Professional Tax (PT)', 'PT', 'deduction', 60, 'fixed', 200, 0, ''),
        (${salStructId}, 'Net Salary', 'NET', 'net', 100, 'formula', 0, 0, 'GROSS - PF - PT')
    `;
  } else {
    salStructId = existingStructs[0].id;
  }

  // 5. Contracts
  const existingContracts = await sql`SELECT id FROM contracts LIMIT 1`;
  if (existingContracts.length === 0) {
    await sql`
      INSERT INTO contracts (contract_number, employee_id, start_date, end_date, wage, salary_structure_id, department_id, position, status, employment_terms)
      VALUES
        ('CNT-2026-001', ${emp1.id}, '2026-01-01', '2027-12-31', 95000.00, ${salStructId}, ${engId}, 'Senior Software Engineer', 'Active', 'Full Time Permanent'),
        ('CNT-2026-002', ${emp2.id}, '2026-01-01', '2027-12-31', 85000.00, ${salStructId}, ${hrId}, 'HR Lead', 'Active', 'Full Time Permanent'),
        ('CNT-2026-003', ${emp3.id}, '2026-01-01', '2027-12-31', 78000.00, ${salStructId}, ${finId}, 'Payroll Specialist', 'Active', 'Full Time Permanent'),
        ('CNT-2026-004', ${emp4.id}, '2026-01-01', '2027-12-31', 80000.00, ${salStructId}, ${mktId}, 'Marketing Manager', 'Active', 'Full Time Permanent'),
        ('CNT-2026-005', ${emp5.id}, '2026-01-01', '2027-12-31', 90000.00, ${salStructId}, ${engId}, 'DevOps Engineer', 'Active', 'Full Time Permanent'),
        ('CNT-2025-001', ${emp1.id}, '2025-01-01', '2025-12-31', 75000.00, ${salStructId}, ${engId}, 'Software Engineer', 'Expired', 'Full Time Permanent - Past Year')
      ON CONFLICT (contract_number) DO NOTHING
    `;
  }

  // 6. Time Off Types
  const existingTypes = await sql`SELECT id, name FROM time_off_types`;
  let plId, slId;
  if (existingTypes.length === 0) {
    const leaveTypes = await sql`
      INSERT INTO time_off_types (name, unit, requires_allocation, approval_workflow, payroll_integration)
      VALUES
        ('Paid Leave / Privilege Leave', 'days', true, 'Manager', true),
        ('Sick Leave', 'days', true, 'Manager', true),
        ('Casual Leave', 'days', true, 'Manager', true),
        ('Unpaid Leave', 'days', false, 'Manager', true)
      RETURNING id, name
    `;
    plId = leaveTypes[0].id;
    slId = leaveTypes[1].id;
  } else {
    plId = existingTypes[0].id;
    slId = existingTypes[1] ? existingTypes[1].id : existingTypes[0].id;
  }

  // 7. Time Off Allocations
  const existingAllocations = await sql`SELECT id FROM time_off_allocations LIMIT 1`;
  if (existingAllocations.length === 0) {
    for (const emp of empRecords) {
      await sql`
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_days, taken_days, remaining_days, validity_start, validity_end, status)
        VALUES
          (${emp.id}, ${plId}, 15.0, 2.0, 13.0, '2026-01-01', '2026-12-31', 'Approved'),
          (${emp.id}, ${slId}, 10.0, 1.0, 9.0, '2026-01-01', '2026-12-31', 'Approved')
      `;
    }
  }

  // 8. Time Off Requests
  const existingRequests = await sql`SELECT id FROM time_off_requests LIMIT 1`;
  if (existingRequests.length === 0) {
    await sql`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, reason, approved_by)
      VALUES
        (${emp1.id}, ${plId}, '2026-08-10', '2026-08-12', 2.0, 'Approved', 'Family function', 'Priya Patel'),
        (${emp4.id}, ${slId}, '2026-08-25', '2026-08-25', 1.0, 'Approved', 'Fever & medical rest', 'Priya Patel'),
        (${emp5.id}, ${plId}, '2026-09-15', '2026-09-18', 3.0, 'Pending', 'Vacation travel', NULL)
    `;
  }

  // 9. Attendance Records
  const existingAtt = await sql`SELECT id FROM attendance LIMIT 1`;
  if (existingAtt.length === 0) {
    const dates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'];
    for (const dateStr of dates) {
      for (const emp of empRecords) {
        if (emp.emp_id === 'EMP005' && dateStr === '2026-09-04') {
          await sql`
            INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, status, exception_note)
            VALUES (${emp.id}, ${dateStr}, ${dateStr + 'T09:05:00Z'}, NULL, 0, 'Missing Checkout', 'Forgot to check out')
            ON CONFLICT (employee_id, date) DO NOTHING
          `;
        } else {
          await sql`
            INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, status)
            VALUES (${emp.id}, ${dateStr}, ${dateStr + 'T09:00:00Z'}, ${dateStr + 'T18:00:00Z'}, 8.0, 'Present')
            ON CONFLICT (employee_id, date) DO NOTHING
          `;
        }
      }
    }
  }

  // 10. Initial Past Payrun (August 2026)
  const existingPayruns = await sql`SELECT id FROM payruns LIMIT 1`;
  if (existingPayruns.length === 0) {
    const [pastPayrun] = await sql`
      INSERT INTO payruns (name, salary_structure_id, period_start, period_end, status, total_net, total_gross, payslip_count)
      VALUES ('August 2026 Payroll', ${salStructId}, '2026-08-01', '2026-08-31', 'Paid', 335000.00, 428000.00, 5)
      RETURNING id
    `;

    for (const emp of empRecords) {
      const wage = emp.emp_id === 'EMP001' ? 95000 : emp.emp_id === 'EMP005' ? 90000 : 80000;
      const basic = wage * 0.5;
      const hra = basic * 0.4;
      const special = wage * 0.1;
      const gross = basic + hra + special;
      const pf = basic * 0.12;
      const pt = 200;
      const deductions = pf + pt;
      const net = gross - deductions;

      const [slip] = await sql`
        INSERT INTO payslips (payrun_id, employee_id, period_start, period_end, worked_days, gross_amount, deduction_amount, net_amount, status)
        VALUES (${pastPayrun.id}, ${emp.id}, '2026-08-01', '2026-08-31', 30, ${gross}, ${deductions}, ${net}, 'Sent')
        RETURNING id
      `;

      await sql`
        INSERT INTO payslip_lines (payslip_id, rule_code, rule_name, category, sequence, amount)
        VALUES
          (${slip.id}, 'BASIC', 'Basic Salary', 'basic', 10, ${basic}),
          (${slip.id}, 'HRA', 'House Rent Allowance (HRA)', 'allowance', 20, ${hra}),
          (${slip.id}, 'SPECIAL_ALLOW', 'Special Allowance', 'allowance', 30, ${special}),
          (${slip.id}, 'GROSS', 'Gross Salary', 'gross', 40, ${gross}),
          (${slip.id}, 'PF', 'Provident Fund (PF)', 'deduction', 50, ${pf}),
          (${slip.id}, 'PT', 'Professional Tax (PT)', 'deduction', 60, ${pt}),
          (${slip.id}, 'NET', 'Net Salary', 'net', 100, ${net})
      `;
    }
  }
}

module.exports = { initializeDatabase };
