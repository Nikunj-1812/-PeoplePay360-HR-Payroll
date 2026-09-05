import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatDate, formatTime } from '../utils/dateUtils';
import { CenteredSpinner } from '../components/ui/Loading';
import { 
  FileSpreadsheet, Users, FileText, Clock, WalletCards, 
  Receipt, Download, Search, RefreshCw, Filter, Eye, ChevronRight 
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function ReportsPage() {
  const { user } = useAuth();
  const isHrManager = user?.role === 'hr_manager';
  const [activeReport, setActiveReport] = useState('employees');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const toast = useToast();

  const allReportTabs = [
    { id: 'employees', label: 'Employees Report', icon: Users, endpoint: '/reports/employees' },
    { id: 'contracts', label: 'Contracts Report', icon: FileText, endpoint: '/reports/contracts' },
    { id: 'attendance', label: 'Attendance Report', icon: Clock, endpoint: '/reports/attendance' },
    { id: 'time-off', label: 'Time-Off Report', icon: WalletCards, endpoint: '/reports/time-off' },
    { id: 'payroll', label: 'Payroll Batches Report', icon: Receipt, endpoint: '/reports/payroll' },
    { id: 'payslips', label: 'Payslip History Report', icon: FileSpreadsheet, endpoint: '/reports/payslips' }
  ];

  const reportTabs = allReportTabs.filter(t => !isHrManager || !['payroll', 'payslips'].includes(t.id));

  const fetchReportData = async () => {
    setLoading(true);
    const currentTab = reportTabs.find(t => t.id === activeReport) || reportTabs[0];
    if (!currentTab) return;

    try {
      const res = await api.getFetch(currentTab.endpoint);
      setData(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load report data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReport]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${val !== null && val !== undefined ? String(val).replace(/"/g, '""') : ''}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PeoplePay360_${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully');
  };

  const filteredData = data.filter(item => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return Object.values(item).some(val => val && String(val).toLowerCase().includes(s));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>
            Operational Reports & Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Comprehensive backend-audited HR, Contract, Attendance, Time-off and Payroll reports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchReportData} 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={handleExportCSV} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#B3CFE5', color: '#0A1931' }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '8px',
        overflowX: 'auto'
      }}>
        {reportTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveReport(tab.id); setSearch(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? '#B3CFE5' : 'transparent',
                color: isActive ? '#0A1931' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease'
              }}
            >
              <Icon size={16} color={isActive ? '#0A1931' : 'var(--text-muted)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search report records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
          />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredData.length}</strong> records
        </div>
      </div>

      {/* Report Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <CenteredSpinner />
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No records found for the selected report criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  {activeReport === 'employees' && (
                    <>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Joining Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </>
                  )}
                  {activeReport === 'contracts' && (
                    <>
                      <th>Contract #</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Wage (₹)</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </>
                  )}
                  {activeReport === 'attendance' && (
                    <>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Schedule</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Worked Hrs</th>
                      <th>Status</th>
                      <th>Action</th>
                    </>
                  )}
                  {activeReport === 'time-off' && (
                    <>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Approved By</th>
                      <th>Action</th>
                    </>
                  )}
                  {activeReport === 'payroll' && (
                    <>
                      <th>Payrun Name</th>
                      <th>Period</th>
                      <th>Employees</th>
                      <th>Total Gross (₹)</th>
                      <th>Total Net (₹)</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </>
                  )}
                  {activeReport === 'payslips' && (
                    <>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Payrun</th>
                      <th>Period</th>
                      <th>Gross (₹)</th>
                      <th>Deductions (₹)</th>
                      <th>Net (₹)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={`rpt-row-${row.id || idx}-${idx}`}>
                    {activeReport === 'employees' && (
                      <>
                        <td style={{ fontWeight: '600' }}>{row.emp_id}</td>
                        <td>{row.employee_name}</td>
                        <td>{row.email}</td>
                        <td>{row.department_name || '-'}</td>
                        <td>{row.job_position}</td>
                        <td>{formatDate(row.joining_date)}</td>
                        <td><span className={`badge badge-${row.status === 'Active' ? 'success' : 'neutral'}`}>{row.status}</span></td>
                        <td><button onClick={() => setSelectedRecord(row)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View</button></td>
                      </>
                    )}
                    {activeReport === 'contracts' && (
                      <>
                        <td style={{ fontWeight: '600' }}>{row.contract_number}</td>
                        <td>{row.employee_name} ({row.emp_id})</td>
                        <td>{row.department_name || '-'}</td>
                        <td>{row.position || '-'}</td>
                        <td style={{ fontWeight: '600' }}>₹{Number(row.wage || 0).toLocaleString()}</td>
                        <td>{formatDate(row.start_date)}</td>
                        <td>{formatDate(row.end_date)}</td>
                        <td><span className={`badge badge-${row.status === 'Active' ? 'success' : 'neutral'}`}>{row.status}</span></td>
                        <td><button onClick={() => setSelectedRecord(row)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View</button></td>
                      </>
                    )}
                    {activeReport === 'attendance' && (
                      <>
                        <td style={{ fontWeight: '600' }}>{formatDate(row.date)}</td>
                        <td>{row.employee_name} ({row.emp_id})</td>
                        <td>{row.department_name || '-'}</td>
                        <td>{row.schedule_name || 'Standard 40h'}</td>
                        <td>{formatTime(row.check_in)}</td>
                        <td>{formatTime(row.check_out)}</td>
                        <td style={{ fontWeight: '600' }}>{row.worked_hours}h</td>
                        <td><span className={`badge badge-${row.status === 'Present' ? 'success' : row.status === 'Late' ? 'warning' : 'danger'}`}>{row.status}</span></td>
                        <td><button onClick={() => setSelectedRecord(row)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View</button></td>
                      </>
                    )}
                    {activeReport === 'time-off' && (
                      <>
                        <td>{row.employee_name} ({row.emp_id})</td>
                        <td>{row.department_name || '-'}</td>
                        <td>{row.time_off_type}</td>
                        <td>{formatDate(row.start_date)}</td>
                        <td>{formatDate(row.end_date)}</td>
                        <td style={{ fontWeight: '600' }}>{row.duration} {row.unit}</td>
                        <td><span className={`badge badge-${row.status === 'Approved' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger'}`}>{row.status}</span></td>
                        <td>{row.approved_by || '-'}</td>
                        <td><button onClick={() => setSelectedRecord(row)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View</button></td>
                      </>
                    )}
                    {activeReport === 'payroll' && (
                      <>
                        <td style={{ fontWeight: '600' }}>{row.payrun_name}</td>
                        <td>{formatDate(row.period_start)} to {formatDate(row.period_end)}</td>
                        <td>{row.employee_count}</td>
                        <td>₹{Number(row.total_gross || 0).toLocaleString()}</td>
                        <td style={{ fontWeight: '600', color: '#10B981' }}>₹{Number(row.total_net || 0).toLocaleString()}</td>
                        <td><span className={`badge badge-${row.status === 'Paid' ? 'success' : row.status === 'Computed' ? 'info' : 'neutral'}`}>{row.status}</span></td>
                        <td>{formatDate(row.created_at)}</td>
                        <td><button onClick={() => setSelectedRecord(row)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View</button></td>
                      </>
                    )}
                    {activeReport === 'payslips' && (
                      <>
                        <td>{row.employee_name} ({row.emp_id})</td>
                        <td>{row.department_name || '-'}</td>
                        <td>{row.payrun_name}</td>
                        <td>{formatDate(row.period_start)} to {formatDate(row.period_end)}</td>
                        <td>₹{Number(row.gross_amount || 0).toLocaleString()}</td>
                        <td>₹{Number(row.deduction_amount || 0).toLocaleString()}</td>
                        <td style={{ fontWeight: '600', color: '#10B981' }}>₹{Number(row.net_amount || 0).toLocaleString()}</td>
                        <td><span className={`badge badge-${row.payslip_status === 'Sent' ? 'success' : 'info'}`}>{row.payslip_status}</span></td>
                        <td><button onClick={() => setSelectedRecord(row)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View</button></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                Report Record Detail
              </h3>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                Close
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              {Object.entries(selectedRecord).map(([key, val]) => (
                <div key={key} style={{ padding: '8px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: '600', fontSize: '11px' }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ color: 'var(--text-main)', marginTop: '2px', fontWeight: '500' }}>
                    {key.includes('time') || key.includes('check_in') || key.includes('check_out')
                      ? formatTime(val)
                      : key.includes('date') || key.includes('created_at') || key.includes('period')
                      ? formatDate(val)
                      : typeof val === 'object' && val !== null
                      ? JSON.stringify(val)
                      : String(val ?? '-')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
