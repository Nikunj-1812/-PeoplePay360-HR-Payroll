import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { subscribeCache } from '../api/cache';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CenteredSpinner } from '../components/ui/Loading';
import { Sliders, Plus, CheckCircle, ArrowDown, Calculator, Search, Edit2, Trash2, ArrowUp, Layers } from 'lucide-react';

export default function SalaryStructuresPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [structures, setStructures] = useState([]);
  const [selectedStruct, setSelectedStruct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showStructModal, setShowStructModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingStruct, setEditingStruct] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedRuleDetail, setSelectedRuleDetail] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Forms
  const [structForm, setStructForm] = useState({ name: '', description: '' });
  const [ruleForm, setRuleForm] = useState({
    name: '', code: '', category: 'allowance', sequence: 25, computation_type: 'percentage', amount: 0, percentage: 10, percentage_based_on: 'BASIC', formula_expression: ''
  });

  const canManage = ['hr_payroll_manager', 'admin'].includes(user?.role || '');

  const fetchStructures = async (selectId = null, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getFetch('/salary/structures');
      const list = res.data || [];
      setStructures(list);
      const targetId = selectId || selectedStruct?.id || (list.length > 0 ? list[0].id : null);
      if (targetId) {
        handleSelectStructure(targetId, isBackground);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
    const unsubscribe = subscribeCache(() => {
      fetchStructures(null, true);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectStructure = async (id, isBackground = false) => {
    try {
      const detail = await api.getFetch(`/salary/structures/${id}`);
      setSelectedStruct(detail.data);
    } catch (err) {
      if (!isBackground) toast.error(err.message || 'Failed to fetch salary structure.');
    }
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    try {
      if (editingStruct) {
        await api.put(`/salary/structures/${editingStruct.id}`, structForm);
        toast.success('Salary structure updated.');
      } else {
        const res = await api.post('/salary/structures', structForm);
        toast.success('Salary structure created.');
        if (res.data?.id) handleSelectStructure(res.data.id);
      }
      api.invalidate(['salary', 'payruns', 'dashboard']);
      setShowStructModal(false);
      setEditingStruct(null);
      setStructForm({ name: '', description: '' });
      fetchStructures();
    } catch (err) {
      toast.error(err.message || 'Failed to save salary structure.');
    }
  };

  const handleDeleteStructure = (s) => {
    setConfirmConfig({
      title: 'Delete Salary Structure',
      description: `Are you sure you want to delete "${s.name}"? Rules attached will be removed.`,
      confirmText: 'Delete Structure',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/salary/structures/${s.id}`);
          api.invalidate(['salary', 'payruns', 'dashboard']);
          toast.info('Salary structure deleted.');
          setSelectedStruct(null);
          fetchStructures();
        } catch (err) {
          toast.error(err.message || 'Failed to delete structure.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await api.put(`/salary/rules/${editingRule.id}`, {
          ...ruleForm,
          salary_structure_id: selectedStruct.id
        });
        toast.success('Salary rule updated successfully.');
      } else {
        await api.post('/salary/rules', {
          ...ruleForm,
          salary_structure_id: selectedStruct.id
        });
        toast.success('Salary rule created successfully.');
      }
      api.invalidate(['salary', 'payruns', 'dashboard']);
      setShowRuleModal(false);
      setEditingRule(null);
      handleSelectStructure(selectedStruct.id);
    } catch (err) {
      toast.error(err.message || 'Failed to save rule.');
    }
  };

  const handleDeleteRule = (r) => {
    setConfirmConfig({
      title: 'Delete Salary Rule',
      description: `Are you sure you want to delete rule "${r.name}" (${r.code})?`,
      confirmText: 'Delete Rule',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/salary/rules/${r.id}`);
          api.invalidate(['salary', 'payruns', 'dashboard']);
          toast.info('Salary rule deleted.');
          handleSelectStructure(selectedStruct.id);
        } catch (err) {
          toast.error(err.message || 'Failed to delete rule.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Salary Structures & Ordered Rules Engine</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configurable standalone salary component computation sequence driving payroll computation</p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setEditingStruct(null);
              setStructForm({ name: '', description: '' });
              setShowStructModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> New Structure
          </button>
        )}
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Structures Left List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Salary Structures ({structures.length})</h3>
            {structures.map((s, idx) => (
              <div
                key={`sal-struct-${s.id || idx}-${idx}`}
                onClick={() => handleSelectStructure(s.id)}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: selectedStruct?.id === s.id ? 'var(--secondary-blue)' : 'var(--border-color)',
                  backgroundColor: selectedStruct?.id === s.id ? 'rgba(179, 207, 229, 0.1)' : 'var(--card-bg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.description || 'Standard India Salary'}</div>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingStruct(s);
                          setStructForm({ name: s.name, description: s.description || '' });
                          setShowStructModal(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '2px 4px' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteStructure(s)}
                        className="btn btn-danger"
                        style={{ padding: '2px 4px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

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
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Execution Sequence: Rules execute strictly top-to-bottom according to Sequence index.</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      setEditingRule(null);
                      setRuleForm({
                        name: '', code: '', category: 'allowance', sequence: (selectedStruct.rules?.length || 0) * 10 + 10,
                        computation_type: 'percentage', amount: 0, percentage: 10, percentage_based_on: 'BASIC', formula_expression: ''
                      });
                      setShowRuleModal(true);
                    }}
                    className="btn btn-primary"
                  >
                    <Plus size={16} /> Add Salary Rule
                  </button>
                )}
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
                      <th>Status</th>
                      {canManage && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStruct.rules?.map((r, idx) => (
                      <tr key={`sal-rule-${r.id || idx}-${idx}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedRuleDetail(r)}>
                        <td style={{ fontWeight: '700', color: 'var(--secondary-navy)' }}>{r.sequence}</td>
                        <td style={{ fontWeight: '700' }}>{r.code}</td>
                        <td>{r.name}</td>
                        <td>
                          <span className={`badge ${r.category === 'gross' ? 'badge-primary' : r.category === 'net' ? 'badge-active' : r.category === 'deduction' ? 'badge-danger' : 'badge-warning'}`}>
                            {r.category ? String(r.category).toUpperCase() : 'GENERAL'}
                          </span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{r.computation_type}</td>
                        <td><span className="badge badge-active">Active</span></td>
                        {canManage && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => {
                                  setEditingRule(r);
                                  setRuleForm({
                                    name: r.name,
                                    code: r.code,
                                    category: r.category || 'allowance',
                                    sequence: r.sequence || 10,
                                    computation_type: r.computation_type || 'fixed',
                                    amount: r.amount || 0,
                                    percentage: r.percentage || 0,
                                    percentage_based_on: r.percentage_based_on || 'BASIC',
                                    formula_expression: r.formula_expression || ''
                                  });
                                  setShowRuleModal(true);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '3px 6px', fontSize: '11px' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(r)}
                                className="btn btn-danger"
                                style={{ padding: '3px 6px', fontSize: '11px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salary Structure Create / Edit Modal */}
      {showStructModal && (
        <div className="modal-overlay" onClick={() => setShowStructModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingStruct ? 'Edit Structure' : 'New Salary Structure'}</h3>
              <button onClick={() => setShowStructModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleSaveStructure}>
              <div className="form-group">
                <label className="form-label">Structure Name</label>
                <input type="text" required placeholder="e.g. Standard Executive Structure" className="form-input" value={structForm.name} onChange={(e) => setStructForm({ ...structForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Brief summary of this structure's purpose..." value={structForm.description} onChange={(e) => setStructForm({ ...structForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowStructModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingStruct ? 'Save Changes' : 'Create Structure'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Rule Detail Modal */}
      {selectedRuleDetail && (
        <div className="modal-overlay" onClick={() => setSelectedRuleDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Salary Rule Detail</h3>
              <button onClick={() => setSelectedRuleDetail(null)} className="btn btn-secondary">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>Rule Code:</strong> {selectedRuleDetail.code}</div>
                <div><strong>Sequence:</strong> {selectedRuleDetail.sequence}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Rule Name:</strong> {selectedRuleDetail.name}</div>
                <div><strong>Category:</strong> {selectedRuleDetail.category}</div>
                <div><strong>Computation Type:</strong> {selectedRuleDetail.computation_type}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedRuleDetail(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Salary Rule Modal */}
      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRule ? 'Edit Salary Rule' : `Add Salary Rule to ${selectedStruct?.name}`}</h3>
              <button onClick={() => setShowRuleModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleSaveRule}>
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
                {ruleForm.computation_type === 'formula' && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Formula Expression</label>
                    <input type="text" placeholder="e.g. BASIC * 0.4 + HRA" className="form-input" value={ruleForm.formula_expression} onChange={(e) => setRuleForm({ ...ruleForm, formula_expression: e.target.value })} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowRuleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingRule ? 'Save Changes' : 'Save Rule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={Boolean(confirmConfig)}
          onCancel={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.description || confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          confirmVariant={confirmConfig.variant || 'primary'}
        />
      )}
    </div>
  );
}
