const { sql } = require('../db');

async function getDashboardData(filters = {}) {
  // 1. KPI: Total Net Salary Paid & Payslips Generated
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

  // 3. KPI: Attendance Health (% Present)
  const [attendanceResult] = await sql`
    SELECT 
      COUNT(*)::int as total_records,
      COUNT(CASE WHEN status = 'Present' THEN 1 END)::int as present_count,
      COUNT(CASE WHEN status = 'Missing Checkout' THEN 1 END)::int as missing_checkout_count,
      COUNT(CASE WHEN status = 'Late' THEN 1 END)::int as late_count
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

  // 6. Operational Alerts
  const [missingBank] = await sql`
    SELECT COUNT(*)::int as count FROM employees WHERE bank_name IS NULL OR account_number IS NULL
  `;
  const [missingCheckouts] = await sql`
    SELECT COUNT(*)::int as count FROM attendance WHERE status = 'Missing Checkout'
  `;
  const [pendingLeave] = await sql`
    SELECT COUNT(*)::int as count FROM time_off_requests WHERE status = 'Pending'
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
    alerts: {
      employeesMissingBankDetails: missingBank.count,
      missingCheckouts: missingCheckouts.count,
      pendingLeaveRequests: pendingLeave.count
    }
  };
}

module.exports = { getDashboardData };
