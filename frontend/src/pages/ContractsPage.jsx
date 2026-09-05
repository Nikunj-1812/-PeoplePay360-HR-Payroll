import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { FileText, Plus, CheckCircle, Clock } from 'lucide-react';

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);

  const [formData, setFormData] = useState({
    contract_number: '', employee_id: '1', start_date: '2026-01-01', end_date: '2027-12-31',
    wage: 85000, salary_structure_id: '1', position: 'Software Engineer', employment_terms: 'Full Time Permanent'
  });

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contracts');
      setContracts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    api.get('/employees').then(r => setEmployees(r.data || []));
    api.get('/salary/structures').then(r => setStructures(r.data || []));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contracts', formData);
      setShowModal(false);
      fetchContracts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Contract Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Historical employment terms & period-specific payroll mapping</p>
        </div>
        <button onClick={() => {
          setFormData({
            contract_number: `CNT-2026-00${contracts.length + 1}`,
            employee_id: employees[0]?.id || '1',
            start_date: '2026-01-01', end_date: '2027-12-31',
            wage: 85000, salary_structure_id: structures[0]?.id || '1', position: 'Software Engineer', employment_terms: 'Full Time Permanent'
          });
          setShowModal(true);
        }} className="btn btn-primary">
          <Plus size={16} /> New Contract
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading historical contracts...</div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Monthly Wage</th>
                <th>Salary Structure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '600', color: 'var(--secondary-navy)' }}>{c.contract_number}</td>
                  <td style={{ fontWeight: '600' }}>{c.employee_name} ({c.emp_id})</td>
                  <td>{c.position || 'N/A'}</td>
                  <td>{c.start_date}</td>
                  <td>{c.end_date || 'Present / Ongoing'}</td>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>₹ {parseFloat(c.wage).toLocaleString('en-IN')}</td>
                  <td>{c.salary_structure_name || 'Standard'}</td>
                  <td>
                    <span className={`badge ${c.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>
                      {c.status === 'Active' ? <CheckCircle size={12} /> : <Clock size={12} />} {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Employment Contract</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Contract Number</label>
                  <input type="text" required className="form-input" value={formData.contract_number} onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select className="form-select" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.emp_id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" required className="form-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Gross Wage (INR)</label>
                  <input type="number" required className="form-input" value={formData.wage} onChange={(e) => setFormData({ ...formData, wage: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Structure</label>
                  <select className="form-select" value={formData.salary_structure_id} onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}>
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
