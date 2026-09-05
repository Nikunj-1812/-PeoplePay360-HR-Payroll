import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CenteredSpinner } from '../components/ui/Loading';
import { formatDate } from '../utils/dateUtils';
import { 
  Receipt, Plus, Calculator, CheckCircle2, DollarSign, Mail, 
  AlertTriangle, FileText, ArrowRight, UserCheck, Download, Trash2
} from 'lucide-react';

export default function PayrunsPage() {
  const toast = useToast();
  const [payruns, setPayruns] = useState([]);
  const [selectedPayrun, setSelectedPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Confirm dialog state
  const [confirmConfig, setConfirmConfig] = useState(null);

  const handleDeletePayrun = (prId, name, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payroll Batch',
      message: `Are you sure you want to delete payrun "${name}"? This will delete all generated payslips and lines.`,
      confirmText: 'Delete Payrun',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/payruns/${prId}`);
          api.invalidate(['payruns', 'dashboard']);
          toast.info(`Payrun "${name}" deleted.`);
          if (selectedPayrun?.id === prId) setSelectedPayrun(null);
          fetchPayruns();
        } catch (err) {
          toast.error(err.message || 'Failed to delete payrun.');
        } finally {
          setConfirmConfig(null);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  // Wizard Step 1 & 2 state
  const [structures, setStructures] = useState([]);
  const [step1Data, setStep1Data] = useState({
    name: 'September 2026 Payroll',
    salary_structure_id: '1',
    period_start: '2026-09-01',
    period_end: '2026-09-30'
  });
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // Email report state
  const [emailReport, setEmailReport] = useState(null);

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      const res = await api.getFetch('/payruns');
      const list = res.data || [];
      setPayruns(list);
      if (list.length > 0) {
        if (!selectedPayrun || !list.some(p => p.id === selectedPayrun.id)) {
          handleSelectPayrun(list[0].id);
        }
      } else {
        setSelectedPayrun(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
    api.getFetch('/salary/structures').then(r => setStructures(r.data || []));
  }, []);

  const handleSelectPayrun = async (id) => {
    try {
      const res = await api.getFetch(`/payruns/${id}`);
      setSelectedPayrun(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to select payrun.');
    }
  };

  // Step 1 -> Step 2
  const handleWizardContinue = async (e) => {
    e.preventDefault();
    try {
      const res = await api.getFetch('/payruns/eligible-employees', { params: step1Data });
      setEligibleEmployees(res.data || []);
      setSelectedEmpIds((res.data || []).map(emp => emp.id));
      setWizardStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch eligible employees.');
    }
  };

  // Step 2 -> Create Payrun
  const handleFinalCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      toast.warning('Please select at least one employee for the Payrun.');
      return;
    }
    const toastId = toast.info(`Creating payroll batch with ${selectedEmpIds.length} employees... Please wait.`);
    try {
      const res = await api.post('/payruns', {
        ...step1Data,
        employee_ids: selectedEmpIds
      });
      api.invalidate(['payruns', 'dashboard', 'employees']);
      setShowWizard(false);
      setWizardStep(1);
      toast.success(`Payrun "${step1Data.name}" created successfully with ${selectedEmpIds.length} employees!`);
      const createdPayrunId = res.data.id;
      const listRes = await api.getFetch('/payruns');
      setPayruns(listRes.data || []);
      if (createdPayrunId) {
        await handleSelectPayrun(createdPayrunId);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create payrun.');
    }
  };

  // Payrun State Machine Actions
  const handleCompute = () => {
    setConfirmConfig({
      title: 'Compute Payrun Batch',
      description: `Are you sure you want to compute salary rules for ${selectedPayrun.name}? This will calculate earnings, deductions, gross and net pay for all included employees.`,
      confirmText: 'Compute Now',
      onConfirm: async () => {
        try {
          await api.post(`/payruns/${selectedPayrun.id}/compute`);
          api.invalidate(['payruns', 'dashboard']);
          toast.success('Payrun computed successfully!');
          handleSelectPayrun(selectedPayrun.id);
        } catch (err) {
          toast.error(err.message || 'Failed to compute payrun.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleUpdateStatus = (status) => {
    setConfirmConfig({
      title: `${status === 'Paid' ? 'Mark Payrun as Paid' : 'Validate Payrun'}`,
      description: status === 'Paid'
        ? 'Are you sure you want to mark this payrun as Paid? This will finalize the payroll batch.'
        : 'Are you sure you want to mark this payrun as Validated?',
      confirmText: status === 'Paid' ? 'Mark Paid' : 'Validate',
      onConfirm: async () => {
        try {
          await api.put(`/payruns/${selectedPayrun.id}/status`, { status });
          api.invalidate(['payruns', 'dashboard']);
          toast.success(`Payrun status updated to ${status}.`);
          handleSelectPayrun(selectedPayrun.id);
        } catch (err) {
          toast.error(err.message || 'Failed to update payrun status.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleSendBulkEmail = () => {
    setConfirmConfig({
      title: 'Send Payslips via Email',
      description: `Are you sure you want to send payslips via email to all employees in ${selectedPayrun.name}?`,
      confirmText: 'Send Bulk Email',
      onConfirm: async () => {
        try {
          const res = await api.post(`/payruns/${selectedPayrun.id}/send-payslips`);
          setEmailReport(res.data);
          api.invalidate(['payruns', 'dashboard']);
          toast.success(`Bulk Email Delivery Complete! Sent: ${res.data.sentCount}, Failed: ${res.data.failedCount}`);
          handleSelectPayrun(selectedPayrun.id);
        } catch (err) {
          toast.error(err.message || 'Failed to send payslips.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleDownloadPDF = async (slipId, empName, e) => {
    if (e) e.stopPropagation();
    try {
      toast.info('Downloading PDF payslip...');
      const token = localStorage.getItem('pp360_token');
      const response = await fetch(`http://localhost:5000/api/payslips/${slipId}/pdf?token=${token}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${empName ? String(empName).replace(/\s+/g, '_') : slipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF Payslip downloaded!');
    } catch (err) {
      console.error('PDF download error:', err);
      const token = localStorage.getItem('pp360_token');
      window.open(`http://localhost:5000/api/payslips/${slipId}/pdf?token=${token}`, '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Payroll Batches (Payruns)</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Two-step wizard, payroll computation engine, warnings & bulk delivery</p>
        </div>
        <button onClick={() => { setWizardStep(1); setShowWizard(true); }} className="btn btn-primary">
          <Plus size={16} /> New Payrun (Wizard)
        </button>
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Payruns List Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Payroll Batches</h3>
            {payruns.map((pr, idx) => (
              <div
                key={`pr-card-${pr.id || idx}-${idx}`}
                onClick={() => handleSelectPayrun(pr.id)}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: selectedPayrun?.id === pr.id ? 'var(--secondary-blue)' : 'var(--border-color)',
                  backgroundColor: selectedPayrun?.id === pr.id ? 'rgba(179, 207, 229, 0.1)' : 'var(--card-bg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{pr.name}</div>
                  <button
                    onClick={(e) => handleDeletePayrun(pr.id, pr.name, e)}
                    className="btn btn-secondary"
                    title="Delete Payrun"
                    style={{ padding: '3px 6px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatDate(pr.period_start)} to {formatDate(pr.period_end)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>₹ {parseFloat(pr.total_net || 0).toLocaleString('en-IN')}</span>
                  <span className={`badge ${pr.status === 'Paid' ? 'badge-paid' : pr.status === 'Computed' ? 'badge-computed' : 'badge-warning'}`}>
                    {pr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Payrun Processing Workspace */}
          {selectedPayrun ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header & State Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{selectedPayrun.name}</h2>
                    <span className={`badge ${selectedPayrun.status === 'Paid' ? 'badge-paid' : 'badge-warning'}`}>{selectedPayrun.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Structure: <strong>{selectedPayrun.salary_structure_name}</strong> | Period: {formatDate(selectedPayrun.period_start)} – {formatDate(selectedPayrun.period_end)} ({selectedPayrun.payslips?.length || 0} Employees)
                  </div>
                </div>

                {/* State Machine Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={handleCompute} className="btn btn-navy">
                    <Calculator size={15} /> Compute
                  </button>
                  <button onClick={() => handleUpdateStatus('Validated')} className="btn btn-secondary">
                    <CheckCircle2 size={15} /> Validate
                  </button>
                  <button onClick={() => handleUpdateStatus('Paid')} className="btn btn-primary">
                    <DollarSign size={15} /> Mark Paid
                  </button>
                  <button onClick={handleSendBulkEmail} className="btn btn-secondary">
                    <Mail size={15} /> Send Payslips
                  </button>
                </div>
              </div>

              {/* Payroll Warnings Section */}
              {selectedPayrun.warnings?.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>
                    <AlertTriangle size={16} color="var(--warning)" /> PAYROLL VALIDATION WARNINGS ({selectedPayrun.warnings.length})
                  </div>
                  <ul style={{ margin: '8px 0 0 24px', fontSize: '12px', color: 'var(--text-main)' }}>
                    {selectedPayrun.warnings.map((w, idx) => (
                      <li key={idx}>{w.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL GROSS EXPENDITURE</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>₹ {parseFloat(selectedPayrun.total_gross || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL NET SALARY PAYABLE</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10B981' }}>₹ {parseFloat(selectedPayrun.total_net || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SELECTED EMPLOYEES</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{selectedPayrun.payslips?.length || 0}</div>
                </div>
              </div>

              {/* Payslips Table */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Generated Payslips Breakdown</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Worked Days</th>
                        <th>Gross Earnings</th>
                        <th>Deductions</th>
                        <th>Net Pay</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayrun.payslips?.map((s, idx) => (
                        <tr key={`pr-payslip-${s.id || idx}-${idx}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedPayslip(s)}>
                          <td style={{ fontWeight: '600' }}>{s.employee_name} ({s.emp_id})</td>
                          <td>{s.worked_days} days</td>
                          <td>₹ {parseFloat(s.gross_amount).toLocaleString('en-IN')}</td>
                          <td style={{ color: 'var(--danger)' }}>- ₹ {parseFloat(s.deduction_amount).toLocaleString('en-IN')}</td>
                          <td style={{ fontWeight: '700', color: '#10B981' }}>₹ {parseFloat(s.net_amount).toLocaleString('en-IN')}</td>
                          <td><span className="badge badge-active">{s.status}</span></td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={(e) => handleDownloadPDF(s.id, s.employee_name, e)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Download PDF Payslip"
                            >
                              <Download size={12} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
              <Receipt size={44} color="var(--secondary-blue)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>No Payroll Batch Selected</h3>
              <p style={{ fontSize: '13px', maxWidth: '400px' }}>Select an existing batch from the left list or create a new batch using the Payrun Wizard.</p>
              <button onClick={() => { setWizardStep(1); setShowWizard(true); }} className="btn btn-primary" style={{ marginTop: '8px' }}>
                <Plus size={16} /> New Payrun (Wizard)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="modal-overlay" onClick={() => setSelectedPayslip(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Payslip Detail ({selectedPayslip.employee_name})</h3>
              <button onClick={() => setSelectedPayslip(null)} className="btn btn-secondary">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>Employee:</strong> {selectedPayslip.employee_name} ({selectedPayslip.emp_id})</div>
                <div><strong>Period:</strong> {formatDate(selectedPayslip.period_start)} – {formatDate(selectedPayslip.period_end)}</div>
                <div><strong>Worked Days:</strong> {selectedPayslip.worked_days} days</div>
                <div><strong>Status:</strong> <span className="badge badge-active">{selectedPayslip.status}</span></div>
                <div><strong>Gross Earnings:</strong> ₹ {parseFloat(selectedPayslip.gross_amount).toLocaleString('en-IN')}</div>
                <div><strong>Deductions:</strong> - ₹ {parseFloat(selectedPayslip.deduction_amount).toLocaleString('en-IN')}</div>
                <div style={{ gridColumn: 'span 2', fontSize: '16px', fontWeight: '700', color: '#10B981' }}>
                  Net Salary Payable: ₹ {parseFloat(selectedPayslip.net_amount).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={(e) => handleDownloadPDF(selectedPayslip.id, selectedPayslip.employee_name, e)}
                  className="btn btn-primary"
                >
                  <Download size={15} /> Download PDF Payslip
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TWO-STEP PAYRUN WIZARD MODAL */}
      {showWizard && (
        <div className="modal-overlay" onClick={() => setShowWizard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Payrun Wizard — Step {wizardStep} of 2 ({wizardStep === 1 ? 'Scope & Period' : 'Employee Selection'})
              </h3>
              <button onClick={() => setShowWizard(false)} className="btn btn-secondary">✕</button>
            </div>

            {wizardStep === 1 ? (
              <form onSubmit={handleWizardContinue}>
                <div className="form-group">
                  <label className="form-label">Payrun Name</label>
                  <input type="text" required className="form-input" value={step1Data.name} onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Structure</label>
                  <select className="form-select" value={step1Data.salary_structure_id} onChange={(e) => setStep1Data({ ...step1Data, salary_structure_id: e.target.value })}>
                    {structures.map((s, idx) => (
                      <option key={`pr-struct-${s.id || idx}-${idx}`} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Period Start</label>
                    <input type="date" required className="form-input" value={step1Data.period_start} onChange={(e) => setStep1Data({ ...step1Data, period_start: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Period End</label>
                    <input type="date" required className="form-input" value={step1Data.period_end} onChange={(e) => setStep1Data({ ...step1Data, period_end: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowWizard(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    Continue to Step 2 <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Select eligible employees to include in this payroll batch ({step1Data.name}):
                </p>

                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}>
                  {eligibleEmployees.map((emp, idx) => {
                    const isChecked = selectedEmpIds.includes(emp.id);
                    return (
                      <div key={`pr-el-emp-${emp.id || idx}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmpIds([...selectedEmpIds, emp.id]);
                              } else {
                                setSelectedEmpIds(selectedEmpIds.filter(id => id !== emp.id));
                              }
                            }}
                          />
                          <strong>{emp.first_name} {emp.last_name}</strong> ({emp.emp_id}) — {emp.job_position}
                        </label>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>₹ {parseFloat(emp.wage || 0).toLocaleString('en-IN')}/mo</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <button type="button" onClick={() => setWizardStep(1)} className="btn btn-secondary">Back to Step 1</button>
                  <button type="button" onClick={handleFinalCreatePayrun} className="btn btn-primary">
                    <UserCheck size={16} /> Create Payrun Batch ({selectedEmpIds.length} Selected)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmDialog
          open={Boolean(confirmConfig)}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmText={confirmConfig.confirmText}
          variant={confirmConfig.variant || 'primary'}
        />
      )}
    </div>
  );
}
