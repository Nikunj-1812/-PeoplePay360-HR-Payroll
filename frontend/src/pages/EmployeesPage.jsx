import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { subscribeCache } from '../api/cache';
import { useToast } from '../context/ToastContext';
import { Search, Plus, LayoutGrid, List, Mail, Building2, ShieldCheck, Trash2, Edit2, FileText, Receipt, Download, Send } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CenteredSpinner } from '../components/ui/Loading';

import { useAuth } from '../context/AuthContext';

export default function EmployeesPage({ onNavigateTab }) {
  const { user } = useAuth();
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

  const canManageEmployees = ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'].includes(user?.role || '');
  const canDeleteEmployee = ['hr_manager', 'hr_payroll_manager', 'admin'].includes(user?.role || '');

  // Form State
  const [formData, setFormData] = useState({
    id: null, emp_id: '', first_name: '', last_name: '', email: '', phone: '',
    job_position: 'Employee', role: 'employee', department_id: '1', bank_name: '', account_number: '', ifsc_code: ''
  });

  const fetchEmployees = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getFetch('/employees', { params: { search } });
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const unsubscribe = subscribeCache(() => {
      fetchEmployees(true);
    });
    return () => unsubscribe();
  }, [search]);

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

  const handleOpenDetail = (empData) => {
    setModalTab('work');
    const empId = typeof empData === 'object' ? empData.id : empData;

    // 1. Instant 0ms render using passed employee object
    if (typeof empData === 'object' && empData) {
      setSelectedEmp(empData);
    } else {
      const found = employees.find(e => e.id === parseInt(empId, 10));
      if (found) setSelectedEmp(found);
    }

    // 2. Background async enrichment
    Promise.all([
      api.getFetch(`/employees/${empId}`),
      api.getFetch(`/employees/${empId}/history`)
    ]).then(([detailRes, histRes]) => {
      if (detailRes && detailRes.data) {
        setSelectedEmp(prev => ({ ...(prev || {}), ...detailRes.data }));
      }
      if (histRes && histRes.data) {
        setEmpHistory(histRes.data);
      }
    }).catch(err => {
      console.error('Background fetch detail error:', err);
    });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/employees/${formData.id}`, formData);
        toast.success('Employee profile and User role updated live.');
      } else {
        const res = await api.post('/employees', formData);
        if (res && res.data?.emailSent) {
          toast.success(`Employee created & onboarding credentials email sent to ${formData.email}!`);
        } else {
          toast.success('Employee created successfully.');
        }
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

          {canManageEmployees && (
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
          )}
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
        <CenteredSpinner />
      ) : viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {employees.map((emp, idx) => (
            <div key={`emp-kanban-${emp.id || idx}-${idx}`} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }} onClick={() => handleOpenDetail(emp)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', flexShrink: 0, borderRadius: '50%', backgroundColor: 'var(--primary)',
                  color: 'var(--primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', lineHeight: '1', textAlign: 'center'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    {(emp.first_name?.[0] || '').toUpperCase()}{(emp.last_name?.[0] || '').toUpperCase()}
                  </span>
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
                  {canManageEmployees && (
                    <>
                      <button
                        onClick={(e) => handleResendInvitation(emp, e)}
                        className="btn btn-secondary"
                        title="Resend Onboarding Invitation"
                        style={{ padding: '4px 6px', color: 'var(--secondary-blue)' }}
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={(e) => handleEditEmployee(emp, e)}
                        className="btn btn-secondary"
                        title="Edit Employee & Role"
                        style={{ padding: '4px 6px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </>
                  )}
                  {canDeleteEmployee && (
                    <button 
                      onClick={(e) => handleDeleteEmployee(emp, e)} 
                      className="btn btn-secondary" 
                      title="Delete Employee" 
                      style={{ padding: '4px 6px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
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
              {employees.map((emp, idx) => (
                <tr key={`emp-row-${emp.id || idx}-${idx}`}>
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
                    <button onClick={() => handleOpenDetail(emp)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      View Detail
                    </button>
                    {canManageEmployees && (
                      <>
                        <button
                          onClick={(e) => handleResendInvitation(emp, e)}
                          className="btn btn-secondary"
                          title="Resend Onboarding Invitation"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--secondary-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Send size={13} /> Invitation
                        </button>
                        <button
                          onClick={(e) => handleEditEmployee(emp, e)}
                          className="btn btn-secondary"
                          title="Edit Employee & Role"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                      </>
                    )}
                    {canDeleteEmployee && (
                      <button 
                        onClick={(e) => handleDeleteEmployee(emp, e)} 
                        className="btn btn-secondary" 
                        title="Delete Employee"
                        style={{ padding: '4px 8px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Detail Modal - Premium Light Theme Design */}
      {selectedEmp && (
        <div className="modal-overlay" onClick={() => setSelectedEmp(null)} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10, 25, 49, 0.4)' }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '820px',
              width: '92%',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-main)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px rgba(10, 25, 49, 0.12)',
              padding: '28px',
              position: 'relative'
            }}
          >
            {/* TOP BAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              {/* EDIT BUTTON */}
              <button
                onClick={(e) => {
                  handleEditEmployee(selectedEmp, e);
                }}
                className="btn"
                style={{
                  backgroundColor: 'rgba(74, 127, 167, 0.08)',
                  border: '1.5px solid var(--secondary-blue)',
                  color: 'var(--secondary-navy)',
                  borderRadius: '20px',
                  padding: '6px 22px',
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  cursor: 'pointer'
                }}
              >
                EDIT
              </button>

              {/* PILL SMART LINK BUTTONS & CLOSE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('time-off'); }}
                  style={{
                    backgroundColor: 'rgba(179, 207, 229, 0.25)',
                    border: '1px solid rgba(74, 127, 167, 0.3)',
                    color: 'var(--deep-navy)',
                    borderRadius: '20px',
                    padding: '6px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Time Off <span style={{ marginLeft: '4px', fontWeight: '700', color: 'var(--secondary-navy)' }}>{selectedEmp.smart_links?.time_off_requests ?? 3}</span>
                </button>

                <button
                  onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('contracts'); }}
                  style={{
                    backgroundColor: 'rgba(179, 207, 229, 0.25)',
                    border: '1px solid rgba(74, 127, 167, 0.3)',
                    color: 'var(--deep-navy)',
                    borderRadius: '20px',
                    padding: '6px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Contracts <span style={{ marginLeft: '4px', fontWeight: '700', color: 'var(--secondary-navy)' }}>{selectedEmp.smart_links?.contracts ?? 2}</span>
                </button>

                <button
                  onClick={() => { setSelectedEmp(null); if (onNavigateTab) onNavigateTab('attendance'); }}
                  style={{
                    backgroundColor: 'rgba(179, 207, 229, 0.25)',
                    border: '1px solid rgba(74, 127, 167, 0.3)',
                    color: 'var(--deep-navy)',
                    borderRadius: '20px',
                    padding: '6px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Attendance <span style={{ marginLeft: '4px', fontWeight: '700', color: 'var(--secondary-navy)' }}>{selectedEmp.smart_links?.attendance ?? 14}</span>
                </button>

                <button
                  onClick={() => setSelectedEmp(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '20px',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* HEADER PROFILE SECTION */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              {/* AVATAR BOX */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  minWidth: '76px',
                  minHeight: '76px',
                  flexShrink: 0,
                  borderRadius: '20px',
                  backgroundColor: 'var(--primary)',
                  border: '1.5px solid rgba(26, 61, 99, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontSize: '26px',
                  fontWeight: '700',
                  color: 'var(--deep-navy)',
                  boxShadow: '0 4px 12px rgba(179, 207, 229, 0.3)',
                  textAlign: 'center',
                  lineHeight: '1'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', lineHeight: '1', textAlign: 'center' }}>
                  {(selectedEmp.first_name?.[0] || 'A').toUpperCase()}{(selectedEmp.last_name?.[0] || 'M').toUpperCase()}
                </span>
              </div>

              {/* NAME & SUBTITLE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--deep-navy)', margin: 0 }}>
                  {selectedEmp.first_name} {selectedEmp.last_name}
                </h2>
                <div style={{ fontSize: '14px', color: 'var(--secondary-navy)', fontWeight: '500' }}>
                  {selectedEmp.job_position || 'Payroll Specialist'} • {selectedEmp.department_name || 'Finance'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedEmp.email} {selectedEmp.phone ? `| ${selectedEmp.phone}` : ''}
                </div>
              </div>
            </div>

            {/* NAV TABS */}
            <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => setModalTab('work')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'work' ? '3px solid var(--secondary-blue)' : '3px solid transparent',
                  color: modalTab === 'work' ? 'var(--secondary-navy)' : 'var(--text-muted)',
                  paddingBottom: '10px',
                  fontSize: '14px',
                  fontWeight: modalTab === 'work' ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                Work Information
              </button>

              <button
                type="button"
                onClick={() => setModalTab('private')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'private' ? '3px solid var(--secondary-blue)' : '3px solid transparent',
                  color: modalTab === 'private' ? 'var(--secondary-navy)' : 'var(--text-muted)',
                  paddingBottom: '10px',
                  fontSize: '14px',
                  fontWeight: modalTab === 'private' ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                Private Information
              </button>

              <button
                type="button"
                onClick={() => setModalTab('history')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'history' ? '3px solid var(--secondary-blue)' : '3px solid transparent',
                  color: modalTab === 'history' ? 'var(--secondary-navy)' : 'var(--text-muted)',
                  paddingBottom: '10px',
                  fontSize: '14px',
                  fontWeight: modalTab === 'history' ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                Employment History
              </button>
            </div>

            {/* TAB CONTENTS */}
            {modalTab === 'work' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Department</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.department_name || 'Finance'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Manager</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.manager_name || selectedEmp.manager || 'Sara Khan'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Working Schedule</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.schedule_name || '40 Hours / Week'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Company</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.company_name || 'OXP Pvt Ltd'}
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Job Position</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.job_position || 'Payroll Specialist'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Work Location</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.work_location || selectedEmp.location || 'Mumbai'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Status</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.status || 'Active'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Work Email</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'private' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Bank Name</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.bank_name || 'HDFC Bank'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Account Number</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.account_number || '5010049281742'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>IFSC Code</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.ifsc_code || 'HDFC0000123'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>System Role</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {(selectedEmp.role || 'employee').replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Employee Code</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.emp_id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--secondary-navy)', fontSize: '13px', fontWeight: '600', width: '130px' }}>Personal Phone</span>
                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500' }}>
                      {selectedEmp.phone || '+91 98765 43210'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--secondary-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} /> Contract & Position History (Promotions & Increments)
                  </h4>
                  {empHistory?.contracts?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {empHistory.contracts.map((c, i) => (
                        <div key={`emp-hist-contract-${c.id || i}-${i}`} style={{ padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: c.status === 'Active' ? '1px solid rgba(74, 127, 167, 0.4)' : '1px solid var(--border-color)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', color: 'var(--secondary-navy)', fontSize: '13px' }}>{c.contract_number || `Contract #${c.id}`}</span>
                              {c.position && <span style={{ fontWeight: '600', color: 'var(--deep-navy)', backgroundColor: 'rgba(179, 207, 229, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>{c.position}</span>}
                            </div>
                            <span className={`badge ${c.status === 'Active' ? 'badge-active' : 'badge-warning'}`}>{c.status}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--text-muted)' }}>
                            <div><strong>Monthly Wage:</strong> ₹{parseFloat(c.wage || 0).toLocaleString('en-IN')} / mo</div>
                            <div><strong>Structure:</strong> {c.salary_structure_name || 'Standard'}</div>
                            <div><strong>Start Date:</strong> {formatDate(c.start_date)}</div>
                            <div><strong>End Date:</strong> {c.end_date ? formatDate(c.end_date) : <span style={{ color: '#10B981', fontWeight: '600' }}>Ongoing (Current Active)</span>}</div>
                            {c.employment_terms && <div style={{ gridColumn: 'span 2' }}><strong>Terms:</strong> {c.employment_terms}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No contract history found.</div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--secondary-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Receipt size={15} /> Past Payslips & Compensation Records
                  </h4>
                  {empHistory?.payslips?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {empHistory.payslips.map((p, i) => (
                        <div key={`emp-hist-payslip-${p.id || i}-${i}`} style={{ padding: '8px 10px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--deep-navy)' }}>{p.payrun_name || `Period ${formatDate(p.period_start)} - ${formatDate(p.period_end)}`}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross: ₹{p.gross_salary?.toLocaleString()} • Deductions: ₹{p.total_deductions?.toLocaleString()}</div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#10B981' }}>Net: ₹{p.net_salary?.toLocaleString()}</div>
                              <span className="badge badge-active" style={{ fontSize: '10px' }}>{p.status}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const token = localStorage.getItem('pp360_token');
                                const baseUrl = api.getActiveBaseURL();
                                const pdfUrl = `${baseUrl.replace(/\/$/, '')}/payslips/${p.id}/pdf?token=${token}`;
                                window.open(pdfUrl, '_blank');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '4px 6px', fontSize: '11px' }}
                              title="Download PDF Payslip"
                            >
                              <Download size={12} /> PDF
                            </button>
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
