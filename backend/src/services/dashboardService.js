const { sql } = require('../db');

async function getDashboardData(filters = {}) {
  // 1. KPI: Total Net Salary Paid, Payslips Generated, Average Salary
  const [netPaidResult] = await sql`
    SELECT 
      COALESCE(SUM(total_net), 0)::numeric as total_net_paid,
      COALESCE(SUM(payslip_count), 0)::int as total_payslips,
      COALESCE(AVG(total_net), 0)::numeric as avg_salary
    FROM payruns
    WHERE status = 'Paid'
  `;

  // 2. KPI: Approved Time Off (Days)
  const [leaveResult] = await sql`
    SELECT COALESCE(SUM(duration), 0)::numeric as approved_days
    FROM time_off_requests
    WHERE status = 'Approved'
  `;

  // 3. KPI: Attendance Health & Breakdown
  const [attendanceResult] = await sql`
    SELECT 
      COUNT(*)::int as total_records,
      COUNT(CASE WHEN status = 'Present' THEN 1 END)::int as present_count,
      COUNT(CASE WHEN status = 'Late' THEN 1 END)::int as late_count,
      COUNT(CASE WHEN status = 'Absent' THEN 1 END)::int as absent_count,
      COUNT(CASE WHEN status = 'Overtime' THEN 1 END)::int as overtime_count,
      COUNT(CASE WHEN status = 'Missing Checkout' THEN 1 END)::int as missing_checkout_count
    FROM attendance
  `;
  const totalAtt = attendanceResult.total_records || 1;
  const attendanceHealth = Math.round((attendanceResult.present_count / totalAtt) * 100);

  // 4. Chart: Salary Cost by Department
  const deptSalaryChart = await sql`
    SELECT 
      d.name as department,
      COALESCE(SUM(p.net_amount), 0)::numeric as total_cost,
      COUNT(DISTINCT e.id)::int as headcount
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id
    LEFT JOIN payslips p ON p.employee_id = e.id
    GROUP BY d.id, d.name
    ORDER BY total_cost DESC
  `;

  // 5. Chart: Monthly Net Salary Trends
  const monthlyTrendsChart = await sql`
    SELECT 
      pr.name as period,
      COALESCE(pr.total_net, 0)::numeric as net_salary,
      COALESCE(pr.total_gross, 0)::numeric as gross_salary
    FROM payruns pr
    ORDER BY pr.id ASC
    LIMIT 6
  `;

  // 6. Payrun Status Breakdown
  const [payrunStatusResult] = await sql`
    SELECT 
      COUNT(CASE WHEN status = 'Paid' THEN 1 END)::int as paid_count,
      COUNT(CASE WHEN status = 'Validated' THEN 1 END)::int as validated_count,
      COUNT(CASE WHEN status = 'Computed' THEN 1 END)::int as computed_count,
      COUNT(CASE WHEN status = 'Draft' THEN 1 END)::int as draft_count,
      COUNT(*)::int as total_payruns
    FROM payruns
  `;

  // 7. Operational & Payroll Alerts
  const [missingBank] = await sql`
    SELECT COUNT(*)::int as count FROM employees WHERE bank_name IS NULL OR account_number IS NULL
  `;
  const [missingCheckouts] = await sql`
    SELECT COUNT(*)::int as count FROM attendance WHERE status = 'Missing Checkout'
  `;
  const [pendingLeave] = await sql`
    SELECT COUNT(*)::int as count FROM time_off_requests WHERE status = 'Pending'
  `;
  const [zeroWageContracts] = await sql`
    SELECT COUNT(*)::int as count FROM contracts WHERE wage <= 0 OR wage IS NULL
  `;
  const [expiringContracts] = await sql`
    SELECT COUNT(*)::int as count FROM contracts WHERE status = 'Active' AND end_date <= CURRENT_DATE + INTERVAL '30 days'
  `;

  // 8. Time Off Overview by Type
  const timeOffOverview = await sql`
    SELECT 
      t.name as type_name,
      COALESCE(SUM(r.duration) FILTER (WHERE r.status = 'Approved'), 0)::numeric as approved_days,
      COALESCE(COUNT(r.id) FILTER (WHERE r.status = 'Pending'), 0)::int as pending_count,
      COALESCE(SUM(a.remaining_days), 0)::numeric as remaining_balance
    FROM time_off_types t
    LEFT JOIN time_off_requests r ON r.time_off_type_id = t.id
    LEFT JOIN time_off_allocations a ON a.time_off_type_id = t.id
    GROUP BY t.id, t.name
    ORDER BY t.id ASC
  `;

  // 9. Department Overview Table
  const departmentOverview = await sql`
    SELECT 
      d.name as department_name,
      COUNT(DISTINCT e.id)::int as headcount,
      COALESCE(SUM(c.wage), 0)::numeric as monthly_salary
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'Active'
    LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Active'
    GROUP BY d.id, d.name
    ORDER BY headcount DESC
  `;

  return {
    kpis: {
      totalNetSalaryPaid: parseFloat(netPaidResult.total_net_paid),
      payslipsGenerated: parseInt(netPaidResult.total_payslips, 10),
      averageSalary: parseFloat(netPaidResult.avg_salary),
      approvedTimeOffDays: parseFloat(leaveResult.approved_days),
      attendanceHealthPercentage: attendanceHealth
    },
    charts: {
      salaryCostByDepartment: deptSalaryChart.map(r => ({ department: r.department, totalCost: parseFloat(r.total_cost), headcount: r.headcount })),
      monthlySalaryTrends: monthlyTrendsChart.map(r => ({ period: r.period, netSalary: parseFloat(r.net_salary), grossSalary: parseFloat(r.gross_salary) }))
    },
    payrunStatus: {
      paid: payrunStatusResult.paid_count,
      validated: payrunStatusResult.validated_count,
      computed: payrunStatusResult.computed_count,
      draft: payrunStatusResult.draft_count,
      total: payrunStatusResult.total_payruns
    },
    alerts: {
      employeesMissingBankDetails: missingBank.count,
      missingCheckouts: missingCheckouts.count,
      pendingLeaveRequests: pendingLeave.count,
      zeroWageContracts: zeroWageContracts.count,
      expiringContracts: expiringContracts.count
    },
    attendanceBreakdown: {
      present: attendanceResult.present_count,
      late: attendanceResult.late_count,
      absent: attendanceResult.absent_count,
      overtime: attendanceResult.overtime_count,
      missingCheckout: attendanceResult.missing_checkout_count,
      total: attendanceResult.total_records
    },
    timeOffOverview: timeOffOverview.map(r => ({
      type: r.type_name,
      approvedDays: parseFloat(r.approved_days),
      pendingCount: parseInt(r.pending_count, 10),
      remainingBalance: parseFloat(r.remaining_balance)
    })),
    departmentOverview: departmentOverview.map(r => ({
      department: r.department_name,
      headcount: r.headcount,
      monthlySalary: parseFloat(r.monthly_salary)
    }))
  };
}

module.exports = { getDashboardData };
