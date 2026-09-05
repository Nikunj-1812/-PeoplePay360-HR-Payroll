import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Search, Plus, LayoutGrid, List, User, Mail, Phone, Building2, Briefcase, FileText, Clock, WalletCards, Receipt } from 'lucide-react';

export default function EmployeesPage({ onNavigateTab }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    emp_id: '', first_name: '', last_name: '', email: '', phone: '',
    job_position: '', department_id: '1', bank_name: '', account_number: '', ifsc_code: ''
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees', { params: { search } });
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/employees/${id}`);
      setSelectedEmp(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/employees/${formData.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setShowFormModal(false);
      fetchEmployees();
    } catch (err) {
      alert(err.message);
    }
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
                emp_id: `EMP00${employees.length + 1}`,
                first_name: '', last_name: '', email: '', phone: '',
                job_position: '', department_id: '1', bank_name: '', account_number: '', ifsc_code: ''
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
                <div>
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
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>{emp.status}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>View Smart Links ➔</span>
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
                  <td>{emp.email}</td>
                  <td><span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>{emp.status}</span></td>
                  <td>
                    <button onClick={() => handleOpenDetail(emp.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      View Operational Hub
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
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedEmp.emp_id} • {selectedEmp.job_position}</div>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="btn btn-secondary">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setShowFormModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleSaveEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input type="text" required className="form-input" value={formData.emp_id} onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Position</label>
                  <input type="text" required className="form-input" value={formData.job_position} onChange={(e) => setFormData({ ...formData, job_position: e.target.value })} />
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
                  <label className="form-label">Email Address</label>
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
                <button type="submit" className="btn btn-primary">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
