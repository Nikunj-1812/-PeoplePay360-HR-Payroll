import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, formatTime } from '../utils/dateUtils';
import { 
  Clock, CheckCircle, AlertTriangle, Play, Square, Edit2, Trash2,
  CalendarDays, Plus, Users, Filter, Search, Check, RefreshCw
} from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'schedules' | 'exceptions'
  const [attendance, setAttendance] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionData, setCorrectionData] = useState({ status: 'Present', worked_hours: 8, exception_note: '' });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ name: '', schedule_type: 'Full Time', weekly_hours: 40 });
  const [confirmConfig, setConfirmConfig] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const userEmpId = user?.employee_id;

  // Find today's attendance record for current user
  const todayRecord = userEmpId 
    ? attendance.find(a => String(a.employee_id) === String(userEmpId) && (formatDate(a.date) === formatDate(todayStr) || (a.date && String(a.date).startsWith(todayStr))))
    : null;

  const isCheckedIn = Boolean(todayRecord && todayRecord.check_in);
  const isCheckedOut = Boolean(todayRecord && todayRecord.check_out);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, schedRes] = await Promise.all([
        api.getFetch('/attendance'),
        api.getFetch('/schedules')
      ]);
      setAttendance(attRes.data || []);
      setSchedules(schedRes.data || []);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    if (actionLoading) return;
    if (isCheckedIn) {
      toast.warning('You have already checked in for today.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/attendance/check-in', { employee_id: userEmpId });
      api.invalidate(['attendance', 'dashboard']);
      toast.success('Check In successful!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Check In failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (actionLoading) return;
    if (!isCheckedIn) {
      toast.error('You must Check In before Check Out.');
      return;
    }
    if (isCheckedOut) {
      toast.warning('Already checked out for today.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/attendance/check-out', { employee_id: userEmpId });
      api.invalidate(['attendance', 'dashboard']);
      toast.success('Check Out successful!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Check Out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/attendance/${selectedRecord.id}/correct`, correctionData);
      api.invalidate(['attendance', 'dashboard']);
      toast.success('Attendance exception corrected successfully.');
      setSelectedRecord(null);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Correction failed.');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.name) return;
    try {
      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}`, scheduleForm);
        toast.success('Working Schedule updated successfully.');
      } else {
        await api.post('/schedules', scheduleForm);
        toast.success('Working Schedule created successfully.');
      }
      api.invalidate(['schedules', 'attendance']);
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setScheduleForm({ name: '', schedule_type: 'Full Time', weekly_hours: 40 });
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || 'Failed to save schedule.');
    }
  };

  const handleDeleteSchedule = (s) => {
    setConfirmConfig({
      title: 'Delete Working Schedule',
      description: `Are you sure you want to delete schedule "${s.name}"?`,
      confirmText: 'Delete Schedule',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/schedules/${s.id}`);
          api.invalidate(['schedules', 'attendance']);
          toast.info('Working schedule deleted.');
          fetchAttendance();
        } catch (err) {
          toast.error(err.message || 'Failed to delete schedule.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const handleDeleteAttendance = (att, e) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Attendance Record',
      description: `Are you sure you want to delete attendance record for ${att.employee_name} (${formatDate(att.date)})?`,
      confirmText: 'Delete Record',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/attendance/${att.id}`);
          api.invalidate(['attendance', 'dashboard']);
          toast.info('Attendance record deleted.');
          if (selectedRecord?.id === att.id) setSelectedRecord(null);
          fetchAttendance();
        } catch (err) {
          toast.error(err.message || 'Failed to delete attendance record.');
        } finally {
          setConfirmConfig(null);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  // Filtered Attendance List
  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = !search || 
      (a.employee_name && a.employee_name.toLowerCase().includes(search.toLowerCase())) ||
      (a.emp_id && a.emp_id.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' ? true :
      statusFilter === 'Exceptions' ? (a.status === 'Missing Checkout' || a.status === 'Late') :
      a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const canManageSchedules = ['hr_manager', 'hr_payroll_manager', 'admin'].includes(user?.role || 'admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top Banner & Check In / Out Actions */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', backgroundColor: 'var(--card-bg)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-main)' }}>Attendance & Working Schedules</h1>
            <span className="badge badge-primary">{formatDate(todayStr)}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Operational daily time tracking, Check In/Out, weekly shift patterns & exception corrections
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
            {isCheckedOut ? (
              <span style={{ color: '#10B981', fontWeight: '600' }}>✓ Checked Out ({formatTime(todayRecord?.check_out)})</span>
            ) : isCheckedIn ? (
              <span style={{ color: 'var(--secondary-blue)', fontWeight: '600' }}>● Checked In ({formatTime(todayRecord?.check_in)})</span>
            ) : (
              <span>Not Checked In Today</span>
            )}
          </div>

          <button
            onClick={handleCheckIn}
            disabled={isCheckedIn || actionLoading}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              opacity: isCheckedIn ? 0.6 : 1,
              cursor: isCheckedIn ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={16} />
            {actionLoading && !isCheckedIn ? 'Checking In...' : isCheckedIn ? 'Checked In' : 'Check In'}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={!isCheckedIn || isCheckedOut || actionLoading}
            className="btn btn-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              opacity: (!isCheckedIn || isCheckedOut) ? 0.6 : 1,
              cursor: (!isCheckedIn || isCheckedOut) ? 'not-allowed' : 'pointer'
            }}
            title={!isCheckedIn ? 'You must Check In before Check Out' : isCheckedOut ? 'Already checked out today' : 'Check Out Now'}
          >
            <Square size={16} />
            {actionLoading && isCheckedIn && !isCheckedOut ? 'Checking Out...' : isCheckedOut ? 'Checked Out' : 'Check Out'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setActiveSubTab('attendance'); setStatusFilter('All'); }}
            className={`btn ${activeSubTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Clock size={15} /> Daily Attendance Logs ({attendance.length})
          </button>
          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`btn ${activeSubTab === 'schedules' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <CalendarDays size={15} /> Working Schedules ({schedules.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('attendance'); setStatusFilter('Exceptions'); }}
            className={`btn ${statusFilter === 'Exceptions' ? 'btn-navy' : 'btn-secondary'}`}
          >
            <AlertTriangle size={15} /> Exceptions ({attendance.filter(a => a.status === 'Missing Checkout' || a.status === 'Late').length})
          </button>
        </div>

        {activeSubTab === 'schedules' && canManageSchedules && (
          <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary" style={{ fontSize: '13px' }}>
            <Plus size={16} /> Create Schedule
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Attendance Logs & Exceptions */}
      {activeSubTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Status Filter:</span>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px', padding: '6px 10px' }}>
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Missing Checkout">Missing Checkout</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance logs...</div>
          ) : filteredAttendance.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No attendance records found matching filters.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Worked Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map(a => {
                    const isException = a.status === 'Missing Checkout' || a.status === 'Late';
                    return (
                      <tr key={a.id} style={{ backgroundColor: isException ? 'rgba(239, 68, 68, 0.04)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedRecord(a)}>
                        <td style={{ fontWeight: '600' }}>{formatDate(a.date)}</td>
                        <td style={{ fontWeight: '600' }}>{a.employee_name} ({a.emp_id})</td>
                        <td>{a.department_name || 'General'}</td>
                        <td>{formatTime(a.check_in)}</td>
                        <td>{formatTime(a.check_out)}</td>
                        <td style={{ fontWeight: '700' }}>{a.worked_hours ? `${a.worked_hours}h` : '-'}</td>
                        <td>
                          <span className={`badge ${a.status === 'Present' ? 'badge-present' : isException ? 'badge-missing-checkout' : 'badge-warning'}`}>
                            {isException ? <AlertTriangle size={12} /> : <CheckCircle size={12} />} {a.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedRecord(a);
                              setCorrectionData({
                                status: a.status === 'Missing Checkout' ? 'Present' : a.status,
                                worked_hours: a.worked_hours || 8,
                                exception_note: a.exception_note || ''
                              });
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            <Edit2 size={13} /> View / Edit
                          </button>
                          {['hr_manager', 'admin'].includes(user?.role || 'admin') && (
                            <button
                              onClick={(e) => handleDeleteAttendance(a, e)}
                              className="btn btn-secondary"
                              title="Delete Record"
                              style={{ padding: '4px 8px', color: 'var(--danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Working Schedules */}
      {activeSubTab === 'schedules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {schedules.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarDays size={20} color="var(--secondary-blue)" />
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{s.name}</h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.schedule_type || 'Full Time'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-primary">{s.weekly_hours || 40}h / Week</span>
                    {canManageSchedules && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => {
                            setEditingSchedule(s);
                            setScheduleForm({
                              name: s.name,
                              schedule_type: s.schedule_type || 'Full Time',
                              weekly_hours: s.weekly_hours || 40
                            });
                            setShowScheduleModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '3px 6px' }}
                          title="Edit Schedule"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(s)}
                          className="btn btn-danger"
                          style={{ padding: '3px 6px' }}
                          title="Delete Schedule"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: 'var(--surface)', padding: '10px', borderRadius: '6px' }}>
                  <div><strong>Mon</strong><br/>09:00-18:00</div>
                  <div><strong>Tue</strong><br/>09:00-18:00</div>
                  <div><strong>Wed</strong><br/>09:00-18:00</div>
                  <div><strong>Thu</strong><br/>09:00-18:00</div>
                  <div><strong>Fri</strong><br/>09:00-18:00</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Assigned to Employees</span>
                  <span style={{ color: '#10B981', fontWeight: '600' }}>✓ Auto-Calculated Hours</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Detail & Exception Correction Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Attendance Detail & Correction</h3>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary">✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div><strong>Employee:</strong> {selectedRecord.employee_name} ({selectedRecord.emp_id})</div>
                <div><strong>Date:</strong> {formatDate(selectedRecord.date)}</div>
                <div><strong>Department:</strong> {selectedRecord.department_name || 'General'}</div>
                <div><strong>Current Status:</strong> <span className="badge badge-active">{selectedRecord.status}</span></div>
                <div><strong>Check In:</strong> {formatTime(selectedRecord.check_in)}</div>
                <div><strong>Check Out:</strong> {formatTime(selectedRecord.check_out)}</div>
                <div><strong>Worked Hours:</strong> {selectedRecord.worked_hours || 0}h</div>
                <div><strong>Corrected By:</strong> {selectedRecord.corrected_by || 'System / Auto'}</div>
              </div>

              {canManageSchedules && (
                <form onSubmit={handleSaveCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Manual Correction Form</h4>

                  <div className="form-group">
                    <label className="form-label">Update Attendance Status</label>
                    <select className="form-select" value={correctionData.status} onChange={(e) => setCorrectionData({ ...correctionData, status: e.target.value })}>
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                      <option value="Overtime">Overtime</option>
                      <option value="Missing Checkout">Missing Checkout</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Corrected Worked Hours</label>
                    <input type="number" step="0.5" className="form-input" value={correctionData.worked_hours} onChange={(e) => setCorrectionData({ ...correctionData, worked_hours: parseFloat(e.target.value) })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correction Audit Reason / Note</label>
                    <textarea className="form-textarea" rows={2} placeholder="Reason for manual correction..." value={correctionData.exception_note} onChange={(e) => setCorrectionData({ ...correctionData, exception_note: e.target.value })} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setSelectedRecord(null)} className="btn btn-secondary">Close</button>
                    <button type="submit" className="btn btn-primary">Save Correction</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingSchedule ? 'Edit Working Schedule' : 'Create Working Schedule'}</h3>
              <button onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleSaveSchedule}>
              <div className="form-group">
                <label className="form-label">Schedule Name</label>
                <input type="text" required placeholder="e.g. Standard 40h Shift" className="form-input" value={scheduleForm.name} onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Schedule Type</label>
                <select className="form-select" value={scheduleForm.schedule_type} onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_type: e.target.value })}>
                  <option value="Full Time">Full Time (5 Days / 40h)</option>
                  <option value="Part Time">Part Time (20h)</option>
                  <option value="Flexible Shift">Flexible Shift</option>
                  <option value="Weekend Shift">Weekend Shift</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Weekly Standard Hours</label>
                <input type="number" step="0.5" required className="form-input" value={scheduleForm.weekly_hours} onChange={(e) => setScheduleForm({ ...scheduleForm, weekly_hours: parseFloat(e.target.value) })} />
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Note: Total weekly hours are calculated automatically from standard daily work patterns (8h/day × 5 days = 40h/week).
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSchedule ? 'Save Changes' : 'Save Schedule'}</button>
              </div>
            </form>
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
