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

import { useAuth } from '../context/AuthContext';
import { CenteredSpinner } from '../components/ui/Loading';
import AnimatedNumber from '../utils/AnimatedNumber';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasPayrollAccess = ['hr_payroll_user', 'hr_payroll_manager', 'admin'].includes(user?.role);

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

  const totalBatches = payrunStatus.total > 0 ? payrunStatus.total : 1;
  const paidPct = Math.round(((payrunStatus.paid || 0) / totalBatches) * 100);
  const valPct = Math.round(((payrunStatus.validated || 0) / totalBatches) * 100);
  const compPct = Math.round(((payrunStatus.computed || 0) / totalBatches) * 100);
  const draftPct = Math.round(((payrunStatus.draft || 0) / totalBatches) * 100);

  const attChartData = [
    { name: 'Present', count: attendanceBreakdown.present || 0, fill: '#10B981' },
    { name: 'Late', count: attendanceBreakdown.late || 0, fill: '#F59E0B' },
    { name: 'Absent', count: attendanceBreakdown.absent || 0, fill: '#E11D48' },
    { name: 'Overtime', count: attendanceBreakdown.overtime || 0, fill: '#4A7FA7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            {hasPayrollAccess ? 'Payroll & HR Operations Dashboard' : 'HR Operations Dashboard'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time executive operational overview & workforce health metrics</p>
        </div>
      </div>

      {/* Filters Bar Card matching Project UI */}
      <div className="card card-interactive animate-fade-up" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
          <Filter size={16} color="var(--secondary-blue)" />
          <span>Filter Overview:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Period:</span>
            <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: '140px' }}>
              <option value="All">All Periods</option>
              <option value="January 2026">January 2026</option>
              <option value="February 2026">February 2026</option>
              <option value="March 2026">March 2026</option>
              <option value="April 2026">April 2026</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Department:</span>
            <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: '160px' }}>
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing & Sales</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <Building2 size={15} color="var(--secondary-blue)" />
            <span style={{ fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Company:</span>
            <select className="form-select" value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '150px' }}>
              <option value="Odoo Pvt Ltd">Odoo Pvt Ltd</option>
              <option value="PeoplePay Global">PeoplePay Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Row - Scoped per Role */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {hasPayrollAccess && (
          <>
            <div className="card card-interactive animate-fade-up stagger-1" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TOTAL NET SALARY PAID</span>
                <Wallet size={16} color="var(--secondary-blue)" />
              </div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0' }}>
                <AnimatedNumber value={kpis.totalNetSalaryPaid} prefix="₹ " />
              </div>
              <span style={{ fontSize: '10px', color: '#10B981' }}>✓ Verified Payruns</span>
            </div>

            <div className="card card-interactive animate-fade-up stagger-2" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>PAYSLIPS GENERATED</span>
                <FileCheck size={16} color="var(--secondary-blue)" />
              </div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0' }}>
                <AnimatedNumber value={kpis.payslipsGenerated} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Across active payruns</span>
            </div>

            <div className="card card-interactive animate-fade-up stagger-3" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AVG NET SALARY / EMP</span>
                <Users size={16} color="var(--secondary-blue)" />
              </div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0' }}>
                <AnimatedNumber value={Math.round(kpis.averageSalary || 0)} prefix="₹ " />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Month / current period</span>
            </div>
          </>
        )}

        <div className="card card-interactive animate-fade-up stagger-4" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>APPROVED TIME OFF DAYS</span>
            <CalendarCheck size={16} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0' }}>
            <AnimatedNumber value={kpis.approvedTimeOffDays} suffix=" Days" />
          </div>
          <span style={{ fontSize: '10px', color: '#10B981' }}>Across selected period</span>
        </div>

        <div className="card card-interactive animate-fade-up stagger-5" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ATTENDANCE HEALTH</span>
            <Activity size={16} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-main)', margin: '2px 0' }}>
            <AnimatedNumber value={kpis.attendanceHealthPercentage || 100} suffix="%" />
          </div>
          <span style={{ fontSize: '10px', color: kpis.attendanceHealthPercentage < 90 ? 'var(--warning)' : '#10B981' }}>
            {kpis.attendanceHealthPercentage < 90 ? '⚠ Exceptions present' : '✓ Normal operations'}
          </span>
        </div>
      </div>

      {/* Row 2: Charts & Payrun Status / Alerts - Decreased Height */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Chart 1: Salary Cost by Department */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
            Salary Cost by Department
          </h3>
          <div style={{ width: '100%', height: 155 }}>
            <ResponsiveContainer>
              <BarChart data={charts.salaryCostByDepartment || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="department" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} />
                <Bar dataKey="totalCost" fill="#4A7FA7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Net vs Gross Salary Trends */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>
            Monthly Net Salary Trends
          </h3>
          <div style={{ width: '100%', height: 155 }}>
            <ResponsiveContainer>
              <LineChart data={charts.monthlySalaryTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip formatter={(val) => `₹ ${val.toLocaleString('en-IN')}`} />
                <Line type="monotone" dataKey="grossSalary" stroke="#1A3D63" strokeWidth={2} name="Gross Salary" />
                <Line type="monotone" dataKey="netSalary" stroke="#10B981" strokeWidth={2} name="Net Salary" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payrun Status & Payroll Alerts */}
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Payrun Status & Payroll Alerts
          </h3>
          
          {/* Multi-Segment Status Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600' }}>Payrun Batches</span>
              <span style={{ color: 'var(--text-muted)' }}>{payrunStatus.total} total batches</span>
            </div>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--border-color)' }}>
              <div style={{ width: `${paidPct}%`, backgroundColor: '#10B981' }} title={`Paid: ${payrunStatus.paid}`} />
              <div style={{ width: `${valPct}%`, backgroundColor: '#4A7FA7' }} title={`Validated: ${payrunStatus.validated}`} />
              <div style={{ width: `${compPct}%`, backgroundColor: '#F59E0B' }} title={`Computed: ${payrunStatus.computed}`} />
              <div style={{ width: `${draftPct}%`, backgroundColor: '#E11D48' }} title={`Draft: ${payrunStatus.draft}`} />
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>
              <span><strong style={{ color: '#10B981' }}>●</strong> Paid ({payrunStatus.paid})</span>
              <span><strong style={{ color: '#4A7FA7' }}>●</strong> Validated ({payrunStatus.validated})</span>
              <span><strong style={{ color: '#F59E0B' }}>●</strong> Computed ({payrunStatus.computed})</span>
              <span><strong style={{ color: '#E11D48' }}>●</strong> Draft ({payrunStatus.draft})</span>
            </div>
          </div>

          {/* Current Payroll Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '10px', color: 'var(--text-muted)' }}>CURRENT ALERTS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: alerts.employeesMissingBankDetails > 0 ? '#E11D48' : 'var(--text-muted)' }}>
              <AlertTriangle size={13} />
              <span><strong>{alerts.employeesMissingBankDetails || 0}</strong> employees missing bank account</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: alerts.missingCheckouts > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              <Clock size={13} />
              <span><strong>{alerts.missingCheckouts || 0}</strong> attendance records missing checkout</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: alerts.pendingLeaveRequests > 0 ? '#4A7FA7' : 'var(--text-muted)' }}>
              <CalendarCheck size={13} />
              <span><strong>{alerts.pendingLeaveRequests || 0}</strong> pending leave approval requests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: alerts.expiringContracts > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
              <FileCheck size={13} />
              <span><strong>{alerts.expiringContracts || 0}</strong> contracts expiring within 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Attendance, Time Off, Department Overviews & Models Guide - Fit cleanly with NO horizontal scrollbar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Attendance Overview */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Attendance Overview</h3>
            <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              {kpis.attendanceHealthPercentage || 100}% Average
            </span>
          </div>
          <div style={{ width: '100%', height: 135 }}>
            <ResponsiveContainer>
              <BarChart data={attChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Off Overview (Fits cleanly without horizontal scrollbar) */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', margin: 0 }}>Time Off Overview</h3>
          <table style={{ fontSize: '11px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '6px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '4px 2px', color: 'var(--text-muted)', width: '38%' }}>Type</th>
                <th style={{ textAlign: 'center', padding: '4px 2px', color: 'var(--text-muted)', width: '20%' }}>Appr</th>
                <th style={{ textAlign: 'center', padding: '4px 2px', color: 'var(--text-muted)', width: '20%' }}>Pend</th>
                <th style={{ textAlign: 'right', padding: '4px 2px', color: 'var(--text-muted)', width: '22%' }}>Rem</th>
              </tr>
            </thead>
            <tbody>
              {timeOffOverview.length > 0 ? (
                timeOffOverview.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(179, 207, 229, 0.1)' }}>
                    <td style={{ fontWeight: '600', padding: '5px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.type}>
                      {t.type}
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 2px', color: '#10B981', fontWeight: '600' }}>
                      {t.approvedDays}d
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 2px', color: '#F59E0B', fontWeight: '600' }}>
                      {t.pendingCount}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 2px', fontWeight: '600' }}>
                      {t.remainingBalance}d
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>No time off records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Department Overview (Fits cleanly without horizontal scrollbar) */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', margin: 0 }}>Department Overview</h3>
          <table style={{ fontSize: '11px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: '6px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '4px 2px', color: 'var(--text-muted)', width: '45%' }}>Department</th>
                <th style={{ textAlign: 'center', padding: '4px 2px', color: 'var(--text-muted)', width: '22%' }}>Head</th>
                <th style={{ textAlign: 'right', padding: '4px 2px', color: 'var(--text-muted)', width: '33%' }}>Salary</th>
              </tr>
            </thead>
            <tbody>
              {departmentOverview.length > 0 ? (
                departmentOverview.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(179, 207, 229, 0.1)' }}>
                    <td style={{ fontWeight: '600', padding: '5px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.department}>
                      {d.department}
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 2px' }}>{d.headcount}</td>
                    <td style={{ textAlign: 'right', padding: '5px 2px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      ₹ {d.monthlySalary.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>No department data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Models to Aggregate Guide Card (Matching Card Styling) */}
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--secondary-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Layers size={15} color="var(--secondary-blue)" />
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Models to Aggregate</h3>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>Core HRMS data dependencies driving dashboard metrics:</p>
          <ul style={{ fontSize: '10px', color: 'var(--text-main)', paddingLeft: '14px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <li><strong>Employees + Depts:</strong> Headcount, org structure & payruns</li>
            <li><strong>Contracts:</strong> Wage, salary rules, sequence & applicability</li>
            <li><strong>Payruns + Payslips:</strong> 2-Step wizard, draft, computed, paid</li>
            <li><strong>Attendance:</strong> Present, late, missing check-out & overtime</li>
            <li><strong>Time Off:</strong> Allocations, requests & approved leave</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
