const { sql } = require('../db');

// Employee master report
async function getEmployeeReport(filters = {}) {
  const deptId = filters.department_id ? parseInt(filters.department_id, 10) : null;
  const status = filters.status || null;

  return await sql`
    SELECT 
      e.id,
      e.emp_id,
      e.first_name || ' ' || e.last_name as employee_name,
      e.email,
      e.phone,
      d.name as department_name,
      e.job_position,
      m.first_name || ' ' || m.last_name as manager_name,
      e.status,
      e.created_at as joining_date,
      c.contract_number as current_contract,
      c.wage as current_wage,
      ss.name as salary_structure_name,
      ws.name as schedule_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN employees m ON e.manager_id = m.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    LEFT JOIN LATERAL (
      SELECT contract_number, wage, salary_structure_id
      FROM contracts
      WHERE employee_id = e.id AND status = 'Active'
      ORDER BY start_date DESC
      LIMIT 1
    ) c ON true
    LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
    WHERE (${deptId}::int IS NULL OR e.department_id = ${deptId})
      AND (${status}::text IS NULL OR e.status = ${status})
    ORDER BY e.id DESC
  `;
}

// Contract report
async function getContractReport(filters = {}) {
  const deptId = filters.department_id ? parseInt(filters.department_id, 10) : null;
  const status = filters.status || null;

  return await sql`
    SELECT 
      c.id,
      c.contract_number,
      e.emp_id,
      e.first_name || ' ' || e.last_name as employee_name,
      d.name as department_name,
      c.position,
      c.start_date,
      c.end_date,
      c.wage,
      c.status,
      c.employment_terms,
      ss.name as salary_structure_name
    FROM contracts c
    JOIN employees e ON c.employee_id = e.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
    WHERE (${deptId}::int IS NULL OR c.department_id = ${deptId})
      AND (${status}::text IS NULL OR c.status = ${status})
    ORDER BY c.start_date DESC
  `;
}

// Attendance summary report
async function getAttendanceReport(filters = {}) {
  const startDate = filters.start_date || null;
  const endDate = filters.end_date || null;
  const empId = filters.employee_id ? parseInt(filters.employee_id, 10) : null;
  const status = filters.status || null;

  return await sql`
    SELECT 
      a.id,
      a.date,
      e.emp_id,
      e.first_name || ' ' || e.last_name as employee_name,
      d.name as department_name,
      ws.name as schedule_name,
      COALESCE(ws.weekly_hours / 5, 8.0) as expected_hours,
      a.check_in,
      a.check_out,
      a.worked_hours,
      a.status,
      a.exception_note,
      a.corrected_by
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN working_schedules ws ON e.schedule_id = ws.id
    WHERE (${empId}::int IS NULL OR a.employee_id = ${empId})
      AND (${startDate}::date IS NULL OR a.date >= ${startDate}::date)
      AND (${endDate}::date IS NULL OR a.date <= ${endDate}::date)
      AND (${status}::text IS NULL OR a.status = ${status})
    ORDER BY a.date DESC, e.id ASC
  `;
}

// Time off report
async function getTimeOffReport(filters = {}) {
  const empId = filters.employee_id ? parseInt(filters.employee_id, 10) : null;
  const status = filters.status || null;

  return await sql`
    SELECT 
      tor.id,
      e.emp_id,
      e.first_name || ' ' || e.last_name as employee_name,
      d.name as department_name,
      tot.name as time_off_type,
      tot.unit,
      tor.start_date,
      tor.end_date,
      tor.duration,
      tor.status,
      tor.reason,
      tor.approved_by,
      tor.created_at as request_date,
      COALESCE(toa.remaining_days, 0) as remaining_balance
    FROM time_off_requests tor
    JOIN employees e ON tor.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    LEFT JOIN LATERAL (
      SELECT remaining_days
      FROM time_off_allocations
      WHERE employee_id = e.id AND time_off_type_id = tot.id
      ORDER BY id DESC
      LIMIT 1
    ) toa ON true
    WHERE (${empId}::int IS NULL OR tor.employee_id = ${empId})
      AND (${status}::text IS NULL OR tor.status = ${status})
    ORDER BY tor.id DESC
  `;
}

// Payroll batch report
async function getPayrollReport(filters = {}) {
  const status = filters.status || null;

  return await sql`
    SELECT 
      pr.id,
      pr.name as payrun_name,
      pr.period_start,
      pr.period_end,
      pr.status,
      pr.payslip_count as employee_count,
      pr.total_gross,
      pr.total_net,
      (pr.total_gross - pr.total_net) as total_deductions,
      ss.name as salary_structure_name,
      pr.created_at
    FROM payruns pr
    JOIN salary_structures ss ON pr.salary_structure_id = ss.id
    WHERE (${status}::text IS NULL OR pr.status = ${status})
    ORDER BY pr.id DESC
  `;
}

// Payslip & Payrun history report
async function getPayslipHistoryReport(filters = {}) {
  const empId = filters.employee_id ? parseInt(filters.employee_id, 10) : null;

  return await sql`
    SELECT 
      p.id,
      e.emp_id,
      e.first_name || ' ' || e.last_name as employee_name,
      d.name as department_name,
      pr.name as payrun_name,
      p.period_start,
      p.period_end,
      p.gross_amount,
      p.deduction_amount,
      p.net_amount,
      p.status as payslip_status,
      pr.status as payrun_status,
      p.sent_at,
      p.created_at
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    JOIN payruns pr ON p.payrun_id = pr.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE (${empId}::int IS NULL OR p.employee_id = ${empId})
    ORDER BY p.id DESC
  `;
}

module.exports = {
  getEmployeeReport,
  getContractReport,
  getAttendanceReport,
  getTimeOffReport,
  getPayrollReport,
  getPayslipHistoryReport
};
