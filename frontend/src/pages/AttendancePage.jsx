import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Clock, CheckCircle, AlertTriangle, Play, Square, Edit2 } from 'lucide-react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionData, setCorrectionData] = useState({ status: 'Present', worked_hours: 8, exception_note: '' });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      setAttendance(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleClockIn = async () => {
    try {
      await api.post('/attendance/clock-in');
      alert('Clocked in successfully!');
      fetchAttendance();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/attendance/clock-out');
      alert('Clocked out successfully!');
      fetchAttendance();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/attendance/${selectedRecord.id}/correct`, correctionData);
      setSelectedRecord(null);
      fetchAttendance();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Attendance Operations</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Daily time tracking, clock-in/out & exception corrections</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleClockIn} className="btn btn-primary">
            <Play size={16} /> Clock In Now
          </button>
          <button onClick={handleClockOut} className="btn btn-secondary">
            <Square size={16} /> Clock Out
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance logs...</div>
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
              {attendance.map(a => {
                const isException = a.status === 'Missing Checkout';
                return (
                  <tr key={a.id} style={{ backgroundColor: isException ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                    <td style={{ fontWeight: '600' }}>{a.date}</td>
                    <td style={{ fontWeight: '600' }}>{a.employee_name} ({a.emp_id})</td>
                    <td>{a.department_name || 'N/A'}</td>
                    <td>{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ fontWeight: '700' }}>{a.worked_hours}h</td>
                    <td>
                      <span className={`badge ${a.status === 'Present' ? 'badge-present' : isException ? 'badge-missing-checkout' : 'badge-warning'}`}>
                        {isException ? <AlertTriangle size={12} /> : <CheckCircle size={12} />} {a.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => {
                          setSelectedRecord(a);
                          setCorrectionData({ status: a.status === 'Missing Checkout' ? 'Present' : a.status, worked_hours: a.worked_hours || 8, exception_note: a.exception_note || '' });
                        }}
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <Edit2 size={13} /> Correct
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Correction Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Attendance Exception Correction</h3>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleSaveCorrection}>
              <div style={{ marginBottom: '16px', fontSize: '13px' }}>
                <div><strong>Employee:</strong> {selectedRecord.employee_name} ({selectedRecord.emp_id})</div>
                <div><strong>Date:</strong> {selectedRecord.date}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
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
                <textarea className="form-textarea" rows={3} placeholder="Reason for manual edit..." value={correctionData.exception_note} onChange={(e) => setCorrectionData({ ...correctionData, exception_note: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setSelectedRecord(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
