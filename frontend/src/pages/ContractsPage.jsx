import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { subscribeCache } from '../api/cache';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/dateUtils';
import { FileText, Plus, CheckCircle, Clock, Search, Edit2, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CenteredSpinner } from '../components/ui/Loading';

export default function ContractsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteConfig, setDeleteConfig] = useState(null);

  const [formData, setFormData] = useState({
    contract_number: '', employee_id: '1', start_date: '2026-01-01', end_date: '2027-12-31',
    wage: 85000, position: 'Software Engineer', employment_terms: 'Full Time Permanent'
  });

  const fetchContracts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getFetch('/contracts');
      setContracts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleDeleteContract = (c, e) => {
    if (e) e.stopPropagation();
    setDeleteConfig({
      isOpen: true,
      title: 'Delete Contract',
      message: `Are you sure you want to delete contract "${c.contract_number}" for ${c.employee_name}? This action cannot be undone.`,
      confirmText: 'Delete Contract',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/contracts/${c.id}`);
          api.invalidate(['contracts', 'employees', 'dashboard']);
          toast.info(`Contract ${c.contract_number} deleted.`);
          if (selectedContract?.id === c.id) setSelectedContract(null);
          fetchContracts();
        } catch (err) {
          toast.error(err.message || 'Failed to delete contract.');
        } finally {
          setDeleteConfig(null);
        }
      },
      onCancel: () => setDeleteConfig(null)
    });
  };

  useEffect(() => {
    fetchContracts();
    api.getFetch('/employees').then(r => setEmployees(r.data || []));

    const unsubscribe = subscribeCache(() => {
      fetchContracts(true);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contracts', formData);
      api.invalidate(['contracts', 'employees', 'dashboard']);
      setShowModal(false);
      toast.success('Contract created successfully.');
      fetchContracts();
    } catch (err) {
      toast.error(err.message || 'Failed to create contract.');
    }
  };

  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (c.contract_number && c.contract_number.toLowerCase().includes(term)) ||
      (c.employee_name && c.employee_name.toLowerCase().includes(term)) ||
      (c.position && c.position.toLowerCase().includes(term))
    );
  });

  const canManageContracts = ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'].includes(user?.role || 'admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Contract Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Historical employment terms, intern promotions & period-specific contract records</p>
        </div>

        {canManageContracts && (
          <button onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
              contract_number: `CNT-2026-00${contracts.length + 1}`,
              employee_id: employees[0]?.id || '1',
              start_date: today,
              end_date: '',
              wage: 85000,
              position: 'Full-Time Software Engineer',
              employment_terms: 'Full-Time Permanent (Promoted)'
            });
            setShowModal(true);
          }} className="btn btn-primary">
            <Plus size={16} /> New Contract / Increment
          </button>
        )}
      </div>

      {/* Filter Bar & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by contract #, employee, position..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {['ALL', 'Active', 'Expired'].map(st => (
            <button
              key={`filter-${st}`}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === st ? 'var(--primary-color)' : 'transparent',
                color: statusFilter === st ? '#0A1931' : 'var(--text-muted)',
                transition: 'all 150ms ease'
              }}
            >
              {st === 'ALL' ? 'All Contracts' : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : filteredContracts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No employment contracts found matching your filters.
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Employee Name</th>
                <th>Position / Role</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Monthly Wage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c, index) => (
                <tr key={`contract-${c.id || index}-${index}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedContract(c)}>
                  <td style={{ fontWeight: '600', color: 'var(--secondary-navy)' }}>{c.contract_number}</td>
                  <td style={{ fontWeight: '600' }}>{c.employee_name} ({c.emp_id})</td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{c.position || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.employment_terms}</div>
                  </td>
                  <td>{formatDate(c.start_date)}</td>
                  <td>{c.end_date ? formatDate(c.end_date) : <span style={{ color: '#10B981', fontWeight: '600' }}>Ongoing (Active)</span>}</td>
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>₹ {parseFloat(c.wage).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${c.status === 'Active' ? 'badge-active' : 'badge-warning'}`}>
                      {c.status === 'Active' ? <CheckCircle size={12} /> : <Clock size={12} />} {c.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => setSelectedContract(c)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      View Details
                    </button>
                    {canManageContracts && (
                      <button
                        onClick={(e) => handleDeleteContract(c, e)}
                        className="btn btn-secondary"
                        title="Delete Contract"
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

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Contract Details ({selectedContract.contract_number})</h3>
              <button onClick={() => setSelectedContract(null)} className="btn btn-secondary">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>Contract Number:</strong> {selectedContract.contract_number}</div>
                <div><strong>Status:</strong> <span className={`badge ${selectedContract.status === 'Active' ? 'badge-active' : 'badge-warning'}`}>{selectedContract.status}</span></div>
                <div><strong>Employee:</strong> {selectedContract.employee_name} ({selectedContract.emp_id})</div>
                <div><strong>Position:</strong> {selectedContract.position || 'N/A'}</div>
                <div><strong>Start Date:</strong> {formatDate(selectedContract.start_date)}</div>
                <div><strong>End Date:</strong> {selectedContract.end_date ? formatDate(selectedContract.end_date) : 'Ongoing (Permanent)'}</div>
                <div><strong>Monthly Wage:</strong> ₹ {parseFloat(selectedContract.wage).toLocaleString('en-IN')}</div>
                <div><strong>Employment Terms:</strong> {selectedContract.employment_terms || 'Full Time Permanent'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedContract(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Employment Contract / Promotion</h3>
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
                    {employees.map((emp, index) => (
                      <option key={`contract-emp-${emp.id || index}-${index}`} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.emp_id})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position / Job Title</label>
                  <input type="text" required placeholder="e.g. Intern -> Full Time Engineer" className="form-input" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Terms / Notes</label>
                  <input type="text" placeholder="e.g. Promotion, Intern Conversion" className="form-input" value={formData.employment_terms} onChange={(e) => setFormData({ ...formData, employment_terms: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" required className="form-input" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date (Leave blank if ongoing)</label>
                  <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Monthly Gross Wage (INR)</label>
                  <input type="number" required className="form-input" value={formData.wage} onChange={(e) => setFormData({ ...formData, wage: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(179, 207, 229, 0.15)', border: '1px solid rgba(179, 207, 229, 0.3)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--secondary-navy)', marginTop: '12px' }}>
                💡 <strong>Promotion & Increment Handling:</strong> Creating a new Active contract automatically transitions previous active contracts for this employee to <em>Expired</em>, while preserving historical records for prior payruns.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contract</button>
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
