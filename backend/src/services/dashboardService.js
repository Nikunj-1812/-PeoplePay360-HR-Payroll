const { sql } = require('../db');

async function getDashboardData(filters = {}) {
  const period = (filters.period && filters.period !== 'All') ? filters.period : null;
  const department = (filters.department && filters.department !== 'All') ? filters.department : null;
  const employeeType = (filters.employeeType && filters.employeeType !== 'All') ? filters.employeeType : null;
  const empId = filters.employee_id ? parseInt(filters.employee_id, 10) : null;

  // Execute all independent queries concurrently via Promise.all
  const [
    [netPaidResult],
    [leaveResult],
    [attendanceResult],
    deptSalaryChart,
    monthlyTrendsChart,
    [payrunStatusResult],
    [missingBank],
    [missingCheckouts],
    [pendingLeave],
    [zeroWageContracts],
    [expiringContracts],
    timeOffOverview,
    departmentOverview
  ] = await Promise.all([
    // 1. KPI: Total Net Salary Paid, Payslips Generated, Average Salary
    sql`
      SELECT 
        COALESCE(SUM(p.net_amount), 0)::numeric as total_net_paid,
        COUNT(DISTINCT p.id)::int as total_payslips,
        COALESCE(AVG(p.net_amount), 0)::numeric as avg_salary
      FROM payslips p
      JOIN payruns pr ON p.payrun_id = pr.id
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE pr.status = 'Paid'
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${period}::text IS NULL OR pr.name ILIKE ${'%' + (period || '') + '%'})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
    `,
    // 2. KPI: Approved Time Off (Days)
    sql`
      SELECT COALESCE(SUM(r.duration), 0)::numeric as approved_days
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE r.status = 'Approved'
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
        AND (${period}::text IS NULL OR TO_CHAR(r.start_date, 'FMMonth YYYY') ILIKE ${'%' + (period || '') + '%'})
    `,
    // 3. KPI: Attendance Health & Breakdown
    sql`
      SELECT 
        COUNT(*)::int as total_records,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END)::int as present_count,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END)::int as late_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END)::int as absent_count,
        COUNT(CASE WHEN a.status = 'Overtime' THEN 1 END)::int as overtime_count,
        COUNT(CASE WHEN a.status = 'Missing Checkout' THEN 1 END)::int as missing_checkout_count
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
        AND (${period}::text IS NULL OR TO_CHAR(a.date, 'FMMonth YYYY') ILIKE ${'%' + (period || '') + '%'})
    `,
    // 4. Chart: Salary Cost by Department
    sql`
      SELECT 
        d.name as department,
        COALESCE(SUM(p.net_amount), 0)::numeric as total_cost,
        COUNT(DISTINCT e.id)::int as headcount
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      LEFT JOIN payslips p ON p.employee_id = e.id
      LEFT JOIN payruns pr ON p.payrun_id = pr.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
        AND (${period}::text IS NULL OR pr.name ILIKE ${'%' + (period || '') + '%'})
      GROUP BY d.id, d.name
      ORDER BY total_cost DESC
    `,
    // 5. Chart: Monthly Net Salary Trends
    sql`
      SELECT 
        pr.name as period,
        COALESCE(pr.total_net, 0)::numeric as net_salary,
        COALESCE(pr.total_gross, 0)::numeric as gross_salary
      FROM payruns pr
      WHERE (${period}::text IS NULL OR pr.name ILIKE ${'%' + (period || '') + '%'})
      ORDER BY pr.id ASC
      LIMIT 6
    `,
    // 6. Payrun Status Breakdown (including Failed status)
    sql`
      SELECT 
        COUNT(CASE WHEN status = 'Paid' THEN 1 END)::int as paid_count,
        COUNT(CASE WHEN status = 'Validated' THEN 1 END)::int as validated_count,
        COUNT(CASE WHEN status = 'Computed' THEN 1 END)::int as computed_count,
        COUNT(CASE WHEN status = 'Draft' THEN 1 END)::int as draft_count,
        COUNT(CASE WHEN status = 'Failed' THEN 1 END)::int as failed_count,
        COUNT(*)::int as total_payruns
      FROM payruns pr
      WHERE (${period}::text IS NULL OR pr.name ILIKE ${'%' + (period || '') + '%'})
    `,
    // 7a. Missing Bank
    sql`
      SELECT COUNT(DISTINCT e.id)::int as count 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE (e.bank_name IS NULL OR e.account_number IS NULL)
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
    `,
    // 7b. Missing Checkouts
    sql`
      SELECT COUNT(DISTINCT a.id)::int as count 
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE a.status = 'Missing Checkout'
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
        AND (${period}::text IS NULL OR TO_CHAR(a.date, 'FMMonth YYYY') ILIKE ${'%' + (period || '') + '%'})
    `,
    // 7c. Pending Leave Requests
    sql`
      SELECT COUNT(DISTINCT r.id)::int as count 
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
      WHERE r.status = 'Pending'
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
        AND (${period}::text IS NULL OR TO_CHAR(r.start_date, 'FMMonth YYYY') ILIKE ${'%' + (period || '') + '%'})
    `,
    // 7d. Zero Wage Contracts
    sql`
      SELECT COUNT(DISTINCT c.id)::int as count 
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE (c.wage <= 0 OR c.wage IS NULL)
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
    `,
    // 7e. Expiring Contracts
    sql`
      SELECT COUNT(DISTINCT c.id)::int as count 
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE c.status = 'Active' AND c.end_date <= CURRENT_DATE + INTERVAL '30 days'
        AND (${empId}::int IS NULL OR e.id = ${empId})
        AND (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
    `,
    // 8. Time Off Overview by Type
    sql`
      SELECT 
        t.name as type_name,
        COALESCE(SUM(r.duration) FILTER (WHERE r.status = 'Approved'), 0)::numeric as approved_days,
        COALESCE(COUNT(r.id) FILTER (WHERE r.status = 'Pending'), 0)::int as pending_count,
        COALESCE(SUM(a.remaining_days), 0)::numeric as remaining_balance
      FROM time_off_types t
      LEFT JOIN time_off_requests r ON r.time_off_type_id = t.id
        AND (${empId}::int IS NULL OR r.employee_id = ${empId})
        AND (${period}::text IS NULL OR TO_CHAR(r.start_date, 'FMMonth YYYY') ILIKE ${'%' + (period || '') + '%'})
      LEFT JOIN time_off_allocations a ON a.time_off_type_id = t.id
        AND (${empId}::int IS NULL OR a.employee_id = ${empId})
      GROUP BY t.id, t.name
      ORDER BY t.id ASC
    `,
    // 9. Department Overview Table
    sql`
      SELECT 
        d.name as department_name,
        COUNT(DISTINCT e.id)::int as headcount,
        COALESCE(SUM(c.wage), 0)::numeric as monthly_salary
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'Active'
        AND (${empId}::int IS NULL OR e.id = ${empId})
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
        AND (${employeeType}::text IS NULL OR c.employment_terms ILIKE ${'%' + (employeeType || '') + '%'})
      WHERE (${department}::text IS NULL OR d.name ILIKE ${'%' + (department || '') + '%'})
      GROUP BY d.id, d.name
      ORDER BY headcount DESC
    `
  ]);

  const totalAtt = attendanceResult.total_records || 1;
  const attendanceHealth = Math.round((attendanceResult.present_count / totalAtt) * 100);

  return {
    kpis: {
      totalNetSalaryPaid: parseFloat(netPaidResult.total_net_paid) || 0,
      payslipsGenerated: parseInt(netPaidResult.total_payslips, 10) || 0,
      averageSalary: parseFloat(netPaidResult.avg_salary) || 0,
      approvedTimeOffDays: parseFloat(leaveResult.approved_days) || 0,
      attendanceHealthPercentage: isNaN(attendanceHealth) ? 100 : attendanceHealth
    },
    charts: {
      salaryCostByDepartment: deptSalaryChart.map(r => ({ department: r.department, totalCost: parseFloat(r.total_cost) || 0, headcount: r.headcount })),
      monthlySalaryTrends: monthlyTrendsChart.map(r => ({ period: r.period, netSalary: parseFloat(r.net_salary) || 0, grossSalary: parseFloat(r.gross_salary) || 0 }))
    },
    payrunStatus: {
      paid: payrunStatusResult.paid_count || 0,
      validated: payrunStatusResult.validated_count || 0,
      computed: payrunStatusResult.computed_count || 0,
      draft: payrunStatusResult.draft_count || 0,
      failed: payrunStatusResult.failed_count || 0,
      total: payrunStatusResult.total_payruns || 0
    },
    alerts: {
      employeesMissingBankDetails: missingBank.count || 0,
      missingCheckouts: missingCheckouts.count || 0,
      pendingLeaveRequests: pendingLeave.count || 0,
      zeroWageContracts: zeroWageContracts.count || 0,
      expiringContracts: expiringContracts.count || 0
    },
    attendanceBreakdown: {
      present: attendanceResult.present_count || 0,
      late: attendanceResult.late_count || 0,
      absent: attendanceResult.absent_count || 0,
      overtime: attendanceResult.overtime_count || 0,
      missingCheckout: attendanceResult.missing_checkout_count || 0,
      total: attendanceResult.total_records || 0
    },
    timeOffOverview: timeOffOverview.map(r => ({
      type: r.type_name,
      approvedDays: parseFloat(r.approved_days) || 0,
      pendingCount: parseInt(r.pending_count, 10) || 0,
      remainingBalance: parseFloat(r.remaining_balance) || 0
    })),
    departmentOverview: departmentOverview.map(r => ({
      department: r.department_name,
      headcount: r.headcount,
      monthlySalary: parseFloat(r.monthly_salary) || 0
    }))
  };
}

module.exports = { getDashboardData };
