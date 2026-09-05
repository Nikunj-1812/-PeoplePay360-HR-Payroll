import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Settings, Shield, User, Database, Server, Plus, Search, Edit2, Key, Trash2, CheckCircle, UserCheck } from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'employee', employee_id: ''
  });
  const [editForm, setEditForm] = useState({
    name: '', email: '', role: 'employee', employee_id: ''
  });
  const [newPassword, setNewPassword] = useState('');

  const fetchUsersAndEmployees = async () => {
    try {
      setLoading(true);
      const [usersRes, empRes] = await Promise.all([
        api.getFetch('/auth/users'),
        api.getFetch('/employees')
      ]);
      setUsers(usersRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndEmployees();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', createForm);
      api.invalidate(['users', 'dashboard']);
      toast.success('System user created successfully.');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'employee', employee_id: '' });
      fetchUsersAndEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to create user.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${selectedUser.id}`, editForm);
      api.invalidate(['users', 'dashboard']);
      toast.success('User details and role updated successfully.');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsersAndEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to update user.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      await api.put(`/auth/users/${selectedUser.id}/reset-password`, { new_password: newPassword });
      api.invalidate(['users']);
      toast.success(`Password for ${selectedUser.name} reset successfully.`);
      setShowResetModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = (u) => {
    setConfirmConfig({
      title: 'Delete System User',
      description: `Are you sure you want to delete user account "${u.name}" (${u.email})? This action cannot be undone.`,
      confirmText: 'Delete User',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/auth/users/${u.id}`);
          api.invalidate(['users', 'dashboard']);
          toast.info('User account deleted.');
          setSelectedUser(null);
          fetchUsersAndEmployees();
        } catch (err) {
          toast.error(err.message || 'Failed to delete user.');
        } finally {
          setConfirmConfig(null);
        }
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !search || 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.emp_id && u.emp_id.toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>System Administration & Role Access Control</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Manage verified system users, link employee profiles, & control 5-tier RBAC access</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add System User
        </button>
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
            <div style={{ fontSize: '15px', fontWeight: '700' }}>JWT + 5-Tier RBAC</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search users by name, email, role, emp code..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Users & Roles Table */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
          Configured System Users ({filteredUsers.length})
        </h3>
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
                  <th>Linked Employee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role.includes('payroll') ? 'badge-active' : 'badge-warning'}`}>
                        {u.role.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{u.emp_id ? `${u.emp_id} - ${u.first_name || ''} ${u.last_name || ''}` : 'None (Standalone Admin/HR)'}</td>
                    <td><span className="badge badge-active">Active</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setEditForm({
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              employee_id: u.employee_id ? String(u.employee_id) : ''
                            });
                            setShowEditModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="Edit User & Role"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowResetModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="Reset Password"
                        >
                          <Key size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create System User</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required placeholder="e.g. John Doe" className="form-input" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" required placeholder="e.g. user@peoplepay360.com" className="form-input" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" required placeholder="Minimum 6 characters" className="form-input" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Role (Strict RBAC)</label>
                  <select className="form-select" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="hr_payroll_user">HR Payroll User</option>
                    <option value="hr_payroll_manager">HR Payroll Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Link to Employee Profile (Optional)</label>
                  <select className="form-select" value={createForm.employee_id} onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })}>
                    <option value="">-- No Linked Employee (Admin/HR User) --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.emp_id})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit User & Role Assignment</h3>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" required className="form-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select className="form-select" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="hr_payroll_user">HR Payroll User</option>
                    <option value="hr_payroll_manager">HR Payroll Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Linked Employee Profile</label>
                  <select className="form-select" value={editForm.employee_id} onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}>
                    <option value="">-- No Linked Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.emp_id})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Password for {selectedUser.name}</h3>
              <button onClick={() => setShowResetModal(false)} className="btn btn-secondary">✕</button>
            </div>
            <form onSubmit={handleResetPassword}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Enter the new password for user <strong>{selectedUser.email}</strong>. It will be securely hashed with bcrypt.
              </p>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" required placeholder="Minimum 6 characters" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Reset Password</button>
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
