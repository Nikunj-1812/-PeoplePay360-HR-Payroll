import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { CalendarDays, Plus, Clock, Users } from 'lucide-react';

export default function SchedulesPage() {
  const toast = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');

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

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schedules', { name, schedule_type: 'Full Time' });
      setShowModal(false);
      setName('');
      toast.success('Working schedule created successfully.');
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
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading working schedules...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {schedules.map(s => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <span style={{ color: '#10B981', fontWeight: '600' }}>✓ Auto-Calculated Hours</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Working Schedule</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Schedule Name</label>
                <input type="text" required placeholder="e.g. Standard 40h Shift" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Note: Total weekly hours are calculated automatically from daily start/end/break inputs (8h/day × 5 days = 40h/week).
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
