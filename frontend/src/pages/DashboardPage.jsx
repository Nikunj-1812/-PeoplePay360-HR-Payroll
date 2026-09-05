import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { subscribeCache } from '../api/cache';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line 
} from 'recharts';
import { 
  Wallet, Users, FileCheck, CalendarCheck, Activity, AlertTriangle, Filter, 
  Building2, CheckCircle2, Clock, Info, ShieldAlert, Layers 
} from 'lucide-react';

import { CenteredSpinner } from '../components/ui/Loading';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States matching HRMS OXP Design
  const [period, setPeriod] = useState('All');
  const [department, setDepartment] = useState('All');
  const [employeeType, setEmployeeType] = useState('All');
  const [company, setCompany] = useState('Odoo Pvt Ltd');

  useEffect(() => {
    async function fetchDashboard(isBackground = false) {
      try {
        if (!isBackground) setLoading(true);
        const res = await api.getFetch('/dashboard', { 
          params: { period, department, employeeType, company } 
        });
        setData(res.data);
      } catch (err) {
        if (!isBackground) setError(err.message);
      } finally {
        if (!isBackground) setLoading(false);
      }
    }

    fetchDashboard();

    const unsubscribe = subscribeCache(() => {
      fetchDashboard(true);
    });

    return () => unsubscribe();
  }, [period, department, employeeType, company]);

  if (loading) {
    return <CenteredSpinner height="400px" />;
  }
  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Error loading dashboard: {error}</div>;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const payrunStatus = data?.payrunStatus || { paid: 0, validated: 0, computed: 0, draft: 0, total: 1 };
  const alerts = data?.alerts || {};
  const attendanceBreakdown = data?.attendanceBreakdown || { present: 0, late: 0, absent: 0, overtime: 0 };
  const timeOffOverview = data?.timeOffOverview || [];
  const departmentOverview = data?.departmentOverview || [];

  // Attendance bar chart data
  const attChartData = [
    { name: 'Present', count: attendanceBreakdown.present, fill: '#10B981' },
    { name: 'Late', count: attendanceBreakdown.late, fill: '#F59E0B' },
    { name: 'Absent', count: attendanceBreakdown.absent, fill: '#EF4444' },
    { name: 'Overtime', count: attendanceBreakdown.overtime, fill: '#4A7FA7' }
  ];

  // Payrun status bar total percentage calculation
  const totalPr = payrunStatus.total || 1;
  const paidPct = Math.round((payrunStatus.paid / totalPr) * 100);
  const valPct = Math.round((payrunStatus.validated / totalPr) * 100);
  const compPct = Math.round((payrunStatus.computed / totalPr) * 100);
  const draftPct = Math.max(0, 100 - (paidPct + valPct + compPct));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>Payroll Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time executive operational overview, salary trends, payrun status & leave metrics</p>
        </div>

        {/* Filters Row Matching HRMS OXP Design */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Filter size={14} color="var(--secondary-blue)" />
            <span style={{ fontWeight: '600' }}>Period:</span>
            <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: '130px', padding: '4px 8px' }}>
              <option value="All">All Periods</option>
              <option value="August 2026">August 2026</option>
              <option value="September 2026">September 2026</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: '600' }}>Department:</span>
            <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '140px', padding: '4px 8px' }}>
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ fontWeight: '600' }}>Employee Type:</span>
            <select className="form-select" value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} style={{ width: '120px', padding: '4px 8px' }}>
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Building2 size={14} color="var(--secondary-blue)" />
            <span style={{ fontWeight: '600' }}>Company:</span>
            <select className="form-select" value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '140px', padding: '4px 8px' }}>
              <option value="Odoo Pvt Ltd">Odoo Pvt Ltd</option>
              <option value="PeoplePay Global">PeoplePay Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (5 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TOTAL NET SALARY PAID</span>
            <Wallet size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            ₹ {kpis.totalNetSalaryPaid?.toLocaleString('en-IN') || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#10B981' }}>✓ Verified Payruns</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>PAYSLIPS GENERATED</span>
            <FileCheck size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            {kpis.payslipsGenerated || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across active payruns</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AVG NET SALARY / EMP</span>
            <Users size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            ₹ {Math.round(kpis.averageSalary || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Month / current period</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>APPROVED TIME OFF DAYS</span>
            <CalendarCheck size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            {kpis.approvedTimeOffDays || 0} Days
          </div>
          <span style={{ fontSize: '11px', color: '#10B981' }}>Across selected period</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ATTENDANCE HEALTH</span>
            <Activity size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            {kpis.attendanceHealthPercentage || 100}%
          </div>
          <span style={{ fontSize: '11px', color: kpis.attendanceHealthPercentage < 90 ? 'var(--warning)' : '#10B981' }}>
            {kpis.attendanceHealthPercentage < 90 ? '⚠ Exceptions present' : '✓ Normal operations'}
          </span>
        </div>
      </div>

      {/* Row 2: Charts & Payrun Status / Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Chart 1: Salary Cost by Department */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-main)' }}>
            Salary Cost by Department
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={charts.salaryCostByDepartment || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="department" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} />
                <Bar dataKey="totalCost" fill="#4A7FA7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Net vs Gross Salary Trends */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-main)' }}>
            Monthly Net Salary Trends
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={charts.monthlySalaryTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} />
                <Line type="monotone" dataKey="grossSalary" stroke="#1A3D63" strokeWidth={2} name="Gross Salary" />
                <Line type="monotone" dataKey="netSalary" stroke="#10B981" strokeWidth={2} name="Net Salary" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payrun Status & Payroll Alerts */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
            Payrun Status & Payroll Alerts
          </h3>
          
          {/* Multi-Segment Status Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: '600' }}>Payrun Batches</span>
              <span style={{ color: 'var(--text-muted)' }}>{payrunStatus.total} total batches</span>
            </div>
            <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--border-color)' }}>
              <div style={{ width: `${paidPct}%`, backgroundColor: '#10B981' }} title={`Paid: ${payrunStatus.paid}`} />
              <div style={{ width: `${valPct}%`, backgroundColor: '#4A7FA7' }} title={`Validated: ${payrunStatus.validated}`} />
              <div style={{ width: `${compPct}%`, backgroundColor: '#F59E0B' }} title={`Computed: ${payrunStatus.computed}`} />
              <div style={{ width: `${draftPct}%`, backgroundColor: '#EF4444' }} title={`Draft: ${payrunStatus.draft}`} />
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginTop: '6px', color: 'var(--text-muted)' }}>
              <span><strong style={{ color: '#10B981' }}>●</strong> Paid ({payrunStatus.paid})</span>
              <span><strong style={{ color: '#4A7FA7' }}>●</strong> Validated ({payrunStatus.validated})</span>
              <span><strong style={{ color: '#F59E0B' }}>●</strong> Computed ({payrunStatus.computed})</span>
              <span><strong style={{ color: '#EF4444' }}>●</strong> Draft ({payrunStatus.draft})</span>
            </div>
          </div>

          {/* Current Payroll Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <span style={{ fontWeight: '700', fontSize: '11px', color: 'var(--text-muted)' }}>CURRENT ALERTS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: alerts.employeesMissingBankDetails > 0 ? '#EF4444' : 'var(--text-muted)' }}>
              <AlertTriangle size={14} />
              <span><strong>{alerts.employeesMissingBankDetails || 0}</strong> employees missing bank account</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: alerts.missingCheckouts > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              <Clock size={14} />
              <span><strong>{alerts.missingCheckouts || 0}</strong> attendance records missing checkout</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: alerts.pendingLeaveRequests > 0 ? '#4A7FA7' : 'var(--text-muted)' }}>
              <CalendarCheck size={14} />
              <span><strong>{alerts.pendingLeaveRequests || 0}</strong> pending leave approval requests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: alerts.expiringContracts > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              <FileCheck size={14} />
              <span><strong>{alerts.expiringContracts || 0}</strong> contracts expiring within 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Attendance, Time Off, Department Overviews & Models Guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Attendance Overview */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Attendance Overview</h3>
            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              {kpis.attendanceHealthPercentage || 100}% Average
            </span>
          </div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={attChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Off Overview */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>Time Off Overview</h3>
          <table className="table" style={{ fontSize: '12px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Type</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Approved</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Pending</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {timeOffOverview.length > 0 ? (
                timeOffOverview.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', padding: '6px 8px' }}>{t.type}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px', color: '#10B981' }}>{t.approvedDays}d</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px', color: '#F59E0B' }}>{t.pendingCount}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px' }}>{t.remainingBalance}d</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)' }}>No time off records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Department Overview */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>Department Overview</h3>
          <table className="table" style={{ fontSize: '12px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Department</th>
                <th style={{ textAlign: 'center', padding: '6px 8px' }}>Headcount</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Monthly Salary</th>
              </tr>
            </thead>
            <tbody>
              {departmentOverview.length > 0 ? (
                departmentOverview.map((d, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', padding: '6px 8px' }}>{d.department}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{d.headcount}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600' }}>₹ {d.monthlySalary.toLocaleString('en-IN')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)' }}>No department data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Models to Aggregate Guide Card (From HRMS OXP Design) */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: 'rgba(179, 207, 229, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={16} color="var(--primary-text)" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Models to Aggregate</h3>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Core HRMS data dependencies driving dashboard metrics:</p>
          <ul style={{ fontSize: '11px', color: 'var(--text-main)', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Employees + Departments:</strong> Headcount, org structure & monthly payruns</li>
            <li><strong>Contracts:</strong> Wage, salary rules, sequence & period applicability</li>
            <li><strong>Payruns + Payslips:</strong> 2-Step wizard, draft, computed, validated, paid</li>
            <li><strong>Attendance:</strong> Present, late, missing check-out & overtime metrics</li>
            <li><strong>Time Off:</strong> Allocations, requests & approved leave deductions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
