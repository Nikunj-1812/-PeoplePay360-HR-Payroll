import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import { 
  LayoutDashboard, Users, FileText, CalendarDays, Clock, 
  WalletCards, Receipt, Sliders, Settings, Sun, Moon, 
  Search, Bell, UserCheck, ShieldCheck, ChevronDown, LogOut
} from 'lucide-react';

export default function Shell({ activeTab, setActiveTab, children }) {
  const { user, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Role permissions filter
  const currentRole = user?.role || 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'contracts', label: 'Contracts', icon: FileText, roles: ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'time-off', label: 'Time Off', icon: WalletCards, roles: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'payroll', label: 'Payruns', icon: Receipt, roles: ['hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'structures', label: 'Salary Structures', icon: Sliders, roles: ['hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'settings', label: 'Settings & Users', icon: Settings, roles: ['admin'] }
  ];

  const visibleNav = navItems.filter(item => 
    currentRole === 'admin' || item.roles.includes(currentRole)
  );

  const handleRoleSelect = async (newRole) => {
    if (switching) return;
    try {
      setSwitching(true);
      const res = await switchRole(newRole);
      toast.success(`Demo switched to ${res.label}`);
    } catch (err) {
      toast.error(err.message || 'Failed to switch demo account.');
    } finally {
      setSwitching(false);
    }
  };

  const handleConfirmLogout = () => {
    logout();
    toast.info('Logged out successfully.');
    setShowLogoutConfirm(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: '#0A1931',
        color: '#F6FAFD',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(179, 207, 229, 0.12)' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#B3CFE5', letterSpacing: '0.5px' }}>
            PeoplePay360
          </div>
          <div style={{ fontSize: '11px', color: '#4A7FA7', fontWeight: '500' }}>
            HR & Payroll Operations
          </div>
        </div>

        {/* Nav list */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#0A1931' : '#B3CFE5',
                  backgroundColor: isActive ? '#B3CFE5' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease'
                }}
              >
                <Icon size={18} color={isActive ? '#0A1931' : '#4A7FA7'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Card */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(179, 207, 229, 0.12)',
          backgroundColor: '#102744',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#B3CFE5' }}>
              {user?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '11px', color: '#4A7FA7', marginTop: '2px', textTransform: 'capitalize' }}>
              Role: {currentRole.replace(/_/g, ' ')}
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F87171',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 150ms ease'
            }}
            title="Log Out of Account"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{
          height: '60px',
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          {/* Breadcrumb Context */}
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
            PeoplePay360 / <span style={{ color: 'var(--text-main)', fontWeight: '600', textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Quick Demo Role Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <ShieldCheck size={16} color="var(--secondary-blue)" />
              <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Role Demo:</span>
              <select
                value={currentRole}
                disabled={switching}
                onChange={(e) => handleRoleSelect(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: switching ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="admin">Admin</option>
                <option value="hr_payroll_manager">HR Payroll Manager</option>
                <option value="hr_payroll_user">HR Payroll User</option>
                <option value="hr_manager">HR Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Toggle Light / Dark Mode"
            >
              {theme === 'light' ? <Moon size={15} color="#0A1931" /> : <Sun size={15} color="#F59E0B" />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>

            {/* Log Out Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--danger)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
              title="Log Out of System"
            >
              <LogOut size={15} color="var(--danger)" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your PeoplePay360 session?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
