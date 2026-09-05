import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { WalletCards, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TimeOffPage() {
  const [activeSubTab, setActiveSubTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: '1', time_off_type_id: '1', start_date: '2026-09-10', end_date: '2026-09-11', duration: 2, reason: 'Personal work'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, allocRes, typeRes, empRes] = await Promise.all([
        api.get('/time-off/requests'),
        api.get('/time-off/allocations'),
        api.get('/time-off/types'),
        api.get('/employees')
      ]);
      setRequests(reqRes.data || []);
      setAllocations(allocRes.data || []);
      setTypes(typeRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/time-off/requests', formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/time-off/requests/${id}/approve`);
      alert('Request Approved! Leave allocation balance has been updated.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRefuse = async (id) => {
    try {
      await api.put(`/time-off/requests/${id}/refuse`);
      alert('Request Refused.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Time Off & Leave Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Leave policies, allocations, & approval balance workflow</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Request Time Off
        </button>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`btn ${activeSubTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Time Off Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveSubTab('allocations')}
          className={`btn ${activeSubTab === 'allocations' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Leave Allocations ({allocations.length})
        </button>
        <button
          onClick={() => setActiveSubTab('types')}
          className={`btn ${activeSubTab === 'types' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Time Off Types ({types.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leave records...</div>
      ) : activeSubTab === 'requests' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.employee_name} ({r.emp_id})</td>
                  <td>{r.type_name}</td>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td style={{ fontWeight: '700' }}>{r.duration} {r.unit || 'days'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.reason || 'N/A'}</td>
                  <td>
                    <span className={`badge ${r.status === 'Approved' ? 'badge-approved' : r.status === 'Refused' ? 'badge-danger' : 'badge-pending'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleApprove(r.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => handleRefuse(r.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>
                          <XCircle size={13} /> Refuse
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>By: {r.approved_by || 'Manager'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeSubTab === 'allocations' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Allocated</th>
                <th>Taken</th>
                <th>Remaining Balance</th>
                <th>Validity Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: '600' }}>{a.employee_name} ({a.emp_id})</td>
                  <td>{a.type_name}</td>
                  <td>{a.allocated_days} {a.unit}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: '600' }}>{a.taken_days} {a.unit}</td>
                  <td style={{ color: '#10B981', fontWeight: '700', fontSize: '14px' }}>{a.remaining_days} {a.unit}</td>
                  <td style={{ fontSize: '12px' }}>{a.validity_start} to {a.validity_end}</td>
                  <td><span className="badge badge-approved">{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {types.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{t.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unit: <strong>{t.unit}</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requires Allocation: <strong>{t.requires_allocation ? 'Yes' : 'No'}</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Approval Workflow: <strong>{t.approval_workflow}</strong></div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Request Time Off</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-select" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.emp_id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Off Type</label>
                <select className="form-select" value={formData.time_off_type_id} onChange={(e) => setFormData({ ...formData, time_off_type_id: e.target.value })}>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" required className="form-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" required className="form-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Days / Hours)</label>
                <input type="number" step="0.5" required className="form-input" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })} />
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-textarea" rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
