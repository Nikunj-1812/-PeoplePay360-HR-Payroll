import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Sliders, Plus, CheckCircle, ArrowDown, Calculator, Search } from 'lucide-react';

export default function SalaryStructuresPage() {
  const toast = useToast();
  const [structures, setStructures] = useState([]);
  const [selectedStruct, setSelectedStruct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  const [ruleForm, setRuleForm] = useState({
    name: '', code: '', category: 'allowance', sequence: 25, computation_type: 'percentage', amount: 0, percentage: 10, percentage_based_on: 'BASIC', formula_expression: ''
  });

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await api.getFetch('/salary/structures');
      setStructures(res.data || []);
      if (res.data?.length > 0 && !selectedStruct) {
        handleSelectStructure(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const handleSelectStructure = async (id) => {
    try {
      const detail = await api.getFetch(`/salary/structures/${id}`);
      setSelectedStruct(detail.data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch salary structure.');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/salary/rules', {
        ...ruleForm,
        salary_structure_id: selectedStruct.id
      });
      api.invalidate(['salary', 'payruns', 'dashboard']);
      setShowRuleModal(false);
      toast.success('Salary rule created successfully.');
      handleSelectStructure(selectedStruct.id);
    } catch (err) {
      toast.error(err.message || 'Failed to create rule.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Salary Structures & Ordered Rules Engine</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configurable standalone salary component computation sequence driving payroll computation</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading salary structures...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
          {/* Structures Left List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Salary Structures</h3>
            {structures.map(s => (
              <div
                key={s.id}
                onClick={() => handleSelectStructure(s.id)}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: selectedStruct?.id === s.id ? 'var(--secondary-blue)' : 'var(--border-color)',
                  backgroundColor: selectedStruct?.id === s.id ? 'rgba(179, 207, 229, 0.1)' : 'var(--card-bg)'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.description || 'Standard India Salary'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '600' }}>{s.rule_count || 0} Rules</span>
                  <span className="badge badge-active">Active</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Structure Rules Detail */}
          {selectedStruct && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{selectedStruct.name}</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Execution Sequence: Rules are calculated strictly top-to-bottom by sequence order.</p>
                </div>
                <button onClick={() => setShowRuleModal(true)} className="btn btn-primary">
                  <Plus size={16} /> Add Salary Rule
                </button>
              </div>

              {/* Rules Sequence Table */}
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Seq</th>
                      <th>Rule Code</th>
                      <th>Rule Name</th>
                      <th>Category</th>
                      <th>Computation Type</th>
                      <th>Value / Formula</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStruct.rules?.map(r => (
                      <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedRule(r)}>
                        <td style={{ fontWeight: '700', color: 'var(--secondary-navy)' }}>{r.sequence}</td>
                        <td style={{ fontWeight: '700' }}>{r.code}</td>
                        <td>{r.name}</td>
                        <td>
                          <span className={`badge ${r.category === 'gross' ? 'badge-primary' : r.category === 'net' ? 'badge-active' : r.category === 'deduction' ? 'badge-danger' : 'badge-warning'}`}>
                            {r.category ? String(r.category).toUpperCase() : 'GENERAL'}
                          </span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{r.computation_type}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '12px' }}>
                          {r.computation_type === 'percentage' ? `${r.percentage}% of ${r.percentage_based_on}` : r.computation_type === 'fixed' ? `₹ ${r.amount}` : r.formula_expression}
                        </td>
                        <td><span className="badge badge-active">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salary Rule Detail Modal */}
      {selectedRule && (
        <div className="modal-overlay" onClick={() => setSelectedRule(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Salary Rule Detail</h3>
              <button onClick={() => setSelectedRule(null)} className="btn btn-secondary">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>Rule Code:</strong> {selectedRule.code}</div>
                <div><strong>Sequence:</strong> {selectedRule.sequence}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Rule Name:</strong> {selectedRule.name}</div>
                <div><strong>Category:</strong> {selectedRule.category}</div>
                <div><strong>Computation Type:</strong> {selectedRule.computation_type}</div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Formula / Value:</strong> {selectedRule.computation_type === 'percentage' ? `${selectedRule.percentage}% of ${selectedRule.percentage_based_on}` : selectedRule.computation_type === 'fixed' ? `₹ ${selectedRule.amount}` : selectedRule.formula_expression}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedRule(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Salary Rule Modal */}
      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Salary Rule to {selectedStruct?.name}</h3>
              <button onClick={() => setShowRuleModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreateRule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Rule Name</label>
                  <input type="text" required placeholder="e.g. Travel Allowance" className="form-input" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rule Code</label>
                  <input type="text" required placeholder="e.g. TRAVEL_ALLOW" className="form-input" value={ruleForm.code} onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={ruleForm.category} onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}>
                    <option value="basic">Basic</option>
                    <option value="allowance">Allowance</option>
                    <option value="gross">Gross</option>
                    <option value="deduction">Deduction</option>
                    <option value="net">Net</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Execution Sequence</label>
                  <input type="number" required className="form-input" value={ruleForm.sequence} onChange={(e) => setRuleForm({ ...ruleForm, sequence: parseInt(e.target.value, 10) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Computation Type</label>
                  <select className="form-select" value={ruleForm.computation_type} onChange={(e) => setRuleForm({ ...ruleForm, computation_type: e.target.value })}>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                    <option value="formula">Formula</option>
                  </select>
                </div>
                {ruleForm.computation_type === 'percentage' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Percentage (%)</label>
                      <input type="number" step="0.1" className="form-input" value={ruleForm.percentage} onChange={(e) => setRuleForm({ ...ruleForm, percentage: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Percentage Based On</label>
                      <select className="form-select" value={ruleForm.percentage_based_on} onChange={(e) => setRuleForm({ ...ruleForm, percentage_based_on: e.target.value })}>
                        <option value="WAGE">Monthly Contract Wage</option>
                        <option value="BASIC">Basic Salary</option>
                        <option value="GROSS">Gross Salary</option>
                      </select>
                    </div>
                  </>
                )}
                {ruleForm.computation_type === 'fixed' && (
                  <div className="form-group">
                    <label className="form-label">Fixed Amount (INR)</label>
                    <input type="number" className="form-input" value={ruleForm.amount} onChange={(e) => setRuleForm({ ...ruleForm, amount: parseFloat(e.target.value) })} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowRuleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
