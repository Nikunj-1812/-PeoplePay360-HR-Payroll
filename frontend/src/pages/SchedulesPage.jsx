import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { CalendarDays, Plus, Clock, Users, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CenteredSpinner } from '../components/ui/Loading';

export default function SchedulesPage() {
  const toast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakHours, setBreakHours] = useState(1);
  const [workDays, setWorkDays] = useState(5);
  const [deleteConfig, setDeleteConfig] = useState(null);

  // Live weekly hours calculation: (end - start - break) * workDays
  const calculateShiftHours = () => {
    if (!startTime || !endTime) return 8;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    const shiftHrs = Math.max(0, (totalMinutes / 60) - breakHours);
    return parseFloat((shiftHrs * workDays).toFixed(2));
  };

  const calculatedHours = calculateShiftHours();

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/schedules');
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = (s, e) => {
    if (e) e.stopPropagation();
    setDeleteConfig({
      isOpen: true,
      title: 'Delete Working Schedule',
      message: `Are you sure you want to delete working schedule "${s.name}"? This action cannot be undone.`,
      confirmText: 'Delete Schedule',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/schedules/${s.id}`);
          api.invalidate(['schedules']);
          toast.info(`Schedule "${s.name}" deleted.`);
          fetchSchedules();
        } catch (err) {
          toast.error(err.message || 'Failed to delete schedule.');
        } finally {
          setDeleteConfig(null);
        }
      },
      onCancel: () => setDeleteConfig(null)
    });
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        schedule_type: `${calculatedHours}h Weekly`,
        monday_start: startTime, monday_end: endTime, monday_break: `0${breakHours}:00`.slice(-5),
        tuesday_start: startTime, tuesday_end: endTime, tuesday_break: `0${breakHours}:00`.slice(-5),
        wednesday_start: startTime, wednesday_end: endTime, wednesday_break: `0${breakHours}:00`.slice(-5),
        thursday_start: startTime, thursday_end: endTime, thursday_break: `0${breakHours}:00`.slice(-5),
        friday_start: workDays >= 5 ? startTime : '', friday_end: workDays >= 5 ? endTime : '', friday_break: workDays >= 5 ? `0${breakHours}:00`.slice(-5) : '',
        saturday_start: workDays >= 6 ? startTime : '', saturday_end: workDays >= 6 ? endTime : '', saturday_break: workDays >= 6 ? `0${breakHours}:00`.slice(-5) : '',
        sunday_start: workDays >= 7 ? startTime : '', sunday_end: workDays >= 7 ? endTime : '', sunday_break: workDays >= 7 ? `0${breakHours}:00`.slice(-5) : ''
      };
      await api.post('/schedules', payload);
      setShowModal(false);
      setName('');
      toast.success(`Working schedule "${name}" (${calculatedHours}h/week) created.`);
      fetchSchedules();
    } catch (err) {
      toast.error(err.message || 'Failed to create schedule.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Working Schedules</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Weekly working patterns & automated hours calculation</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create Schedule
        </button>
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {schedules.map((s, idx) => (
            <div key={`sched-card-${s.id || idx}-${idx}`} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CalendarDays size={20} color="var(--secondary-blue)" />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{s.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.schedule_type}</span>
                  </div>
                </div>
                <span className="badge badge-primary">{s.weekly_hours}h / Week</span>
              </div>

              {/* Day Pattern Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: 'var(--surface)', padding: '10px', borderRadius: '6px' }}>
                <div><strong>Mon</strong><br/>09:00-18:00</div>
                <div><strong>Tue</strong><br/>09:00-18:00</div>
                <div><strong>Wed</strong><br/>09:00-18:00</div>
                <div><strong>Thu</strong><br/>09:00-18:00</div>
                <div><strong>Fri</strong><br/>09:00-18:00</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> {s.employee_count || 0} Assigned Employees</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10B981', fontWeight: '600' }}>✓ Auto-Calculated</span>
                  <button 
                    onClick={(e) => handleDeleteSchedule(s, e)}
                    className="btn btn-secondary" 
                    title="Delete Schedule"
                    style={{ padding: '4px 6px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Working Schedule</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Schedule Name</label>
                <input type="text" required placeholder="e.g. Standard 40h Shift" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Break (Hours)</label>
                  <input type="number" step="0.5" className="form-input" value={breakHours} onChange={(e) => setBreakHours(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Days / Week</label>
                  <input type="number" min="1" max="7" className="form-input" value={workDays} onChange={(e) => setWorkDays(parseInt(e.target.value, 10) || 5)} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '6px', marginTop: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-Calculated Total:</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-blue)' }}>
                  {calculatedHours} Hours / Week
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Schedule</button>
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
