import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Settings, Shield, User, Database, Server } from 'lucide-react';

export default function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await api.get('/auth/users');
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>System Administration & Role Access Control</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage system users, assigned roles, & environment status</p>
      </div>

      {/* System Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={24} color="var(--secondary-blue)" />
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DATABASE ENGINE</div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>Neon PostgreSQL</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Server size={24} color="#10B981" />
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>BACKEND SERVICE</div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>Express Node.js</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={24} color="var(--primary-text)" />
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SECURITY ENGINE</div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>JWT + RBAC</div>
          </div>
        </div>
      </div>

      {/* Users & Roles Table */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Configured System Users & Role Assignments</h3>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th>Employee Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role.includes('payroll') ? 'badge-active' : 'badge-warning'}`}>
                        {u.role.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{u.emp_id || 'N/A'}</td>
                    <td><span className="badge badge-active">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
