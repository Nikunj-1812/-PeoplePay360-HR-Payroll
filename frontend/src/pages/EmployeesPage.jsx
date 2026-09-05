import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/dateUtils';
import { Search, Plus, LayoutGrid, List, User, Mail, Phone, Building2, Briefcase, FileText, Clock, WalletCards, Receipt, History, Award, Trash2, Edit2, ShieldCheck } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function EmployeesPage({ onNavigateTab }) {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empHistory, setEmpHistory] = useState(null);
  const [modalTab, setModalTab] = useState('overview'); // 'overview' | 'history'
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null, emp_id: '', first_name: '', last_name: '', email: '', phone: '',
    job_position: 'Employee', role: 'employee', department_id: '1', bank_name: '', account_number: '', ifsc_code: ''
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getFetch('/employees', { params: { search } });
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (emp, e) => {
    if (e) e.stopPropagation();
    setFormData({
      id: emp.id,
      emp_id: emp.emp_id || '',
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      job_position: emp.job_position || 'Employee',
      role: emp.role || 'employee',
      department_id: emp.department_id ? String(emp.department_id) : '1',
      bank_name: emp.bank_name || '',
      account_number: emp.account_number || '',
      ifsc_code: emp.ifsc_code || ''
    });
    setShowFormModal(true);
  };

  const handleDeleteEmployee = (emp, e) => {
    if (e) e.stopPropagation();
    setDeleteConfig({
      isOpen: true,
      title: 'Delete Employee Record',
      message: `Are you sure you want to delete employee "${emp.first_name} ${emp.last_name}" (${emp.emp_id})? This will delete associated contracts, user account, and records.`,
      confirmText: 'Delete Employee',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/employees/${emp.id}`);
          api.invalidate(['employees', 'users', 'dashboard']);
          toast.info(`Employee "${emp.first_name} ${emp.last_name}" deleted.`);
          if (selectedEmp?.id === emp.id) setSelectedEmp(null);
          fetchEmployees();
        } catch (err) {
          toast.error(err.message || 'Failed to delete employee.');
        } finally {
          setDeleteConfig(null);
        }
      },
      onCancel: () => setDeleteConfig(null)
    });
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const handleOpenDetail = async (id) => {
    try {
      setModalTab('overview');
      const [detailRes, histRes] = await Promise.all([
        api.getFetch(`/employees/${id}`),
        api.getFetch(`/employees/${id}/history`)
      ]);
      setSelectedEmp(detailRes.data);
      setEmpHistory(histRes.data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch employee detail.');
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/employees/${formData.id}`, formData);
        toast.success('Employee profile and User role updated live.');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee created and User account synced live.');
      }
      api.invalidate(['employees', 'users', 'dashboard']);
      setShowFormModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to save employee.');
    }
  };

  // Sync Job Position & System Role
  const handlePositionChange = (pos) => {
    let newRole = formData.role;
    const lowerPos = pos.toLowerCase();
    if (lowerPos === 'admin') newRole = 'admin';
    else if (lowerPos === 'hr payroll manager') newRole = 'hr_payroll_manager';
    else if (lowerPos === 'hr payroll user') newRole = 'hr_payroll_user';
    else if (lowerPos === 'hr manager') newRole = 'hr_manager';
    else if (lowerPos === 'employee') newRole = 'employee';
    setFormData({ ...formData, job_position: pos, role: newRole });
  };

  const handleRoleChange = (r) => {
    const roleTitles = {
      'admin': 'Admin',
      'hr_payroll_manager': 'HR Payroll Manager',
      'hr_payroll_user': 'HR Payroll User',
      'hr_manager': 'HR Manager',
      'employee': 'Employee'
    };
    const matchingTitle = roleTitles[r] || formData.job_position;
    setFormData({ ...formData, role: r, job_position: matchingTitle });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Employees Hub</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Central HR master records & operational link center</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, padding: '6px 12px' }}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, padding: '6px 12px' }}
            >
              <List size={16} /> List
            </button>
          </div>

          <button
            onClick={() => {
              setFormData({
                id: null,
                emp_id: `EMP00${employees.length + 1}`,
                first_name: '', last_name: '', email: '', phone: '',
                job_position: 'Employee', role: 'employee', department_id: '1', bank_name: '', account_number: '', ifsc_code: ''
              });
              setShowFormModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by name, ID, position, email..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employee master data...</div>
      ) : viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {employees.map(emp => (
            <div key={emp.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }} onClick={() => handleOpenDetail(emp.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary)',
                  color: 'var(--primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
                }}>
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{emp.first_name} {emp.last_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.emp_id} • {emp.job_position}</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} color="var(--secondary-blue)" /> {emp.department_name || 'General'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="var(--secondary-blue)" /> {emp.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--secondary-blue)" /> Role: <span className="badge badge-primary" style={{ fontSize: '10px' }}>{(emp.role || 'employee').replace(/_/g, ' ').toUpperCase()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>{emp.status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={(e) => handleEditEmployee(emp, e)}
                    className="btn btn-secondary"
                    title="Edit Employee & Role"
                    style={{ padding: '4px 6px' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteEmployee(emp, e)} 
                    className="btn btn-secondary" 
                    title="Delete Employee" 
                    style={{ padding: '4px 6px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Job Position</th>
                <th>System Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: '600' }}>{emp.emp_id}</td>
                  <td>{emp.first_name} {emp.last_name}</td>
                  <td>{emp.department_name || 'General'}</td>
                  <td>{emp.job_position}</td>
                  <td>
                    <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                      {(emp.role || 'employee').replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{emp.email}</td>
                  <td><span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>{emp.status}</span></td>
                  <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => handleOpenDetail(emp.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      Hub
                    </button>
                    <button
                      onClick={(e) => handleEditEmployee(emp, e)}
                      className="btn btn-secondary"
                      title="Edit Employee & Role"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteEmployee(emp, e)} 
                      className="btn btn-secondary" 
                      title="Delete Employee"
                      style={{ padding: '4px 8px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Operational Hub Modal */}
      {selectedEmp && (
        <div className="modal-overlay" onClick={() => setSelectedEmp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)',
                  color: 'var(--primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px'
                }}>
                  {selectedEmp.first_name[0]}{selectedEmp.last_name[0]}
                </div>
                <div>
                  <h3 className="modal-title">{selectedEmp.first_name} {selectedEmp.last_name}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedEmp.emp_id} • {selectedEmp.job_position} • Role: <strong style={{ color: 'var(--secondary-navy)' }}>{(selectedEmp.role || 'employee').replace(/_/g, ' ').toUpperCase()}</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="btn btn-secondary">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Modal Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalTab('overview')}
                  className={`btn ${modalTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <User size={14} /> Overview & Smart Links
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('history')}
                  className={`btn ${modalTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <History size={14} /> Employment History
                </button>
              </div>

              {modalTab === 'overview' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div><strong>Department:</strong> {selectedEmp.department_name || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedEmp.phone || 'N/A'}</div>
                    <div><strong>Schedule:</strong> {selectedEmp.schedule_name || 'Standard 40h'}</div>
                    <div><strong>Bank Account:</strong> {selectedEmp.account_number ? `${selectedEmp.bank_name} (${selectedEmp.account_number})` : '⚠ Missing Bank Info'}</div>
                  </div>

                  {/* SMART LINKS SECTION */}
                  <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>
                      EMPLOYEE OPERATIONAL HUB (SMART LINKS)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      <button
                        onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('contracts'); }}
                        className="btn btn-secondary" style={{ flexDirection: 'column', padding: '10px' }}
                      >
                        <FileText size={18} color="var(--secondary-blue)" />
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{selectedEmp.smart_links?.contracts || 0} Contracts</span>
                      </button>

                      <button
                        onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('attendance'); }}
                        className="btn btn-secondary" style={{ flexDirection: 'column', padding: '10px' }}
                      >
                        <Clock size={18} color="var(--secondary-blue)" />
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{selectedEmp.smart_links?.attendance || 0} Attendance</span>
                      </button>

                      <button
                        onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('time-off'); }}
                        className="btn btn-secondary" style={{ flexDirection: 'column', padding: '10px' }}
                      >
                        <WalletCards size={18} color="var(--secondary-blue)" />
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{selectedEmp.smart_links?.time_off_requests || 0} Leave Requests</span>
                      </button>

                      <button
                        onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('payroll'); }}
                        className="btn btn-secondary" style={{ flexDirection: 'column', padding: '10px' }}
                      >
                        <Receipt size={18} color="var(--secondary-blue)" />
                        <span style={{ fontSize: '12px', fontWeight: '700' }}>{selectedEmp.smart_links?.payslips || 0} Payslips</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {/* Current & Past Contracts */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--secondary-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={15} /> Contract & Position History
                    </h4>
                    {empHistory?.contracts?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {empHistory.contracts.map((c, i) => (
                          <div key={c.id || i} style={{ padding: '10px', backgroundColor: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{c.contract_ref || `Contract #${c.id}`}</span>
                              <span className={`badge ${c.status === 'Active' ? 'badge-active' : 'badge-warning'}`}>{c.status}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: 'var(--text-muted)' }}>
                              <div><strong>Wage:</strong> ₹{c.wage?.toLocaleString()} / mo</div>
                              <div><strong>Structure:</strong> {c.salary_structure_name || 'Standard'}</div>
                              <div><strong>Start Date:</strong> {formatDate(c.start_date)}</div>
                              <div><strong>End Date:</strong> {c.end_date ? formatDate(c.end_date) : 'Ongoing (Permanent)'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No contract history found.</div>
                    )}
                  </div>

                  {/* Past Payslips / Compensation History */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--secondary-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Receipt size={15} /> Past Payslips & Compensation Records
                    </h4>
                    {empHistory?.payslips?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {empHistory.payslips.map((p, i) => (
                          <div key={p.id || i} style={{ padding: '8px 10px', backgroundColor: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '600' }}>{p.payrun_name || `Period ${formatDate(p.period_start)} - ${formatDate(p.period_end)}`}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross: ₹{p.gross_salary?.toLocaleString()} • Deductions: ₹{p.total_deductions?.toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '700', color: '#10B981' }}>Net: ₹{p.net_salary?.toLocaleString()}</div>
                              <span className="badge badge-active" style={{ fontSize: '10px' }}>{p.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No past payslip records.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Edit Employee & System Role' : 'Add New Employee'}</h3>
              <button onClick={() => setShowFormModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleSaveEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input type="text" required className="form-input" value={formData.emp_id} onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Position (Dropdown)</label>
                  <select
                    className="form-select"
                    value={formData.job_position}
                    onChange={(e) => handlePositionChange(e.target.value)}
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="HR Payroll User">HR Payroll User</option>
                    <option value="HR Payroll Manager">HR Payroll Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                    <option value="Operations Executive">Operations Executive</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Assigned System Role (5-Tier RBAC)</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    style={{ fontWeight: '600', color: 'var(--secondary-navy)' }}
                  >
                    <option value="employee">1. Employee (Staff Portal Access Only)</option>
                    <option value="hr_manager">2. HR Manager (Employees, Attendance, Time Off, Schedules)</option>
                    <option value="hr_payroll_user">3. HR Payroll User (HR + Payruns & Payslips Standard)</option>
                    <option value="hr_payroll_manager">4. HR Payroll Manager (HR + Payroll + Salary Structures & Rules)</option>
                    <option value="admin">5. Admin (Full System Access & User Administration)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" required className="form-input" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" required className="form-input" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Login Username)</label>
                  <input type="email" required className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" className="form-input" placeholder="e.g. HDFC Bank" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" className="form-input" placeholder="e.g. 50100..." value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Employee & Sync Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog {...deleteConfig} />
    </div>
  );
}
