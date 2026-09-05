import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line 
} from 'recharts';
import { Wallet, Users, FileCheck, CalendarCheck, Activity, AlertTriangle, Filter } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('All');
  const [dept, setDept] = useState('All');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.get('/dashboard', { params: { period, dept } });
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [period, dept]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live dashboard analytics...</div>;
  }
  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Error loading dashboard: {error}</div>;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const alerts = data?.alerts || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>Payroll Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Live executive operational overview & PostgreSQL aggregate data</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Filter size={14} color="var(--secondary-blue)" />
            <span style={{ fontWeight: '600' }}>Period:</span>
            <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: '130px', padding: '4px 8px' }}>
              <option value="All">All Periods</option>
              <option value="August 2026">August 2026</option>
              <option value="September 2026">September 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>TOTAL NET PAID</span>
            <Wallet size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            ₹ {kpis.totalNetSalaryPaid?.toLocaleString('en-IN') || 0}
          </div>
          <span style={{ fontSize: '11px', color: '#10B981' }}>✓ Verified Payruns</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>PAYSLIPS GENERATED</span>
            <FileCheck size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            {kpis.payslipsGenerated || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Across active payruns</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>AVERAGE NET SALARY</span>
            <Users size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            ₹ {Math.round(kpis.averageSalary || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Per employee / month</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>APPROVED TIME OFF</span>
            <CalendarCheck size={18} color="var(--secondary-blue)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
            {kpis.approvedTimeOffDays || 0} Days
          </div>
          <span style={{ fontSize: '11px', color: '#10B981' }}>Consumed allocations</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>ATTENDANCE HEALTH</span>
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

      {/* Operational Alerts Box */}
      <div className="card" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={18} color="var(--warning)" />
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Payroll & HR Operational Alerts</h3>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
          <div><strong>{alerts.employeesMissingBankDetails || 0}</strong> employees missing bank details</div>
          <div><strong>{alerts.missingCheckouts || 0}</strong> attendance records missing check-out</div>
          <div><strong>{alerts.pendingLeaveRequests || 0}</strong> pending leave approval requests</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Salary Cost by Department */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>
            Salary Expenditure by Department (INR)
          </h3>
          <div style={{ width: '100%', height: 260 }}>
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

        {/* Monthly Salary Trends */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>
            Monthly Net vs Gross Salary Trends
          </h3>
          <div style={{ width: '100%', height: 260 }}>
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
      </div>
    </div>
  );
}
