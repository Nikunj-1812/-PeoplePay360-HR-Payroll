import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import ConfirmDialog from '../ui/ConfirmDialog';
import faviconImg from '../../assets/favicon.jpeg';
import logoImg from '../../assets/logo..jpeg';
import { 
  LayoutDashboard, Users, FileText, CalendarDays, Clock, 
  WalletCards, Receipt, Sliders, Settings, Sun, Moon, 
  Search, Bell, UserCheck, ShieldCheck, ChevronDown, LogOut,
  FileSpreadsheet, Check, CheckCheck, Menu, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Shell({ activeTab, setActiveTab, children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const notifRef = useRef(null);

  // Authoritative role from backend session
  const currentRole = user?.role || 'admin';

  const fetchNotifications = async () => {
    try {
      const res = await api.getFetch('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // Quiet background fetch
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, linkTab, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
      if (linkTab && linkTab !== activeTab) {
        setActiveTab(linkTab);
        setShowNotifDropdown(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'contracts', label: 'Contracts', icon: FileText, roles: ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'time-off', label: 'Time Off', icon: WalletCards, roles: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'payroll', label: 'Payruns', icon: Receipt, roles: ['hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'structures', label: 'Salary Structures', icon: Sliders, roles: ['hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet, roles: ['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'] },
    { id: 'settings', label: 'Settings & Users', icon: Settings, roles: ['admin'] }
  ];

  const visibleNav = navItems.filter(item => 
    currentRole === 'admin' || item.roles.includes(currentRole)
  );

  const handleConfirmLogout = () => {
    logout();
    toast.info('Logged out successfully.');
    setShowLogoutConfirm(false);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'hr_payroll_manager':
        return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'hr_payroll_user':
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'hr_manager':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' };
    }
  };

  const roleStyle = getRoleBadgeStyle(currentRole);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'leave': return <WalletCards size={15} color="#3B82F6" />;
      case 'payroll': return <Receipt size={15} color="#10B981" />;
      case 'attendance': return <Clock size={15} color="#F59E0B" />;
      case 'contract': return <FileText size={15} color="#8B5CF6" />;
      default: return <Bell size={15} color="var(--primary)" />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--surface)' }}>
      {/* Collapsible Sticky Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '240px' : '68px',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#0A1931',
        color: '#F6FAFD',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Logo & Toggle Header */}
        <div style={{
          padding: isSidebarOpen ? '14px 16px' : '14px 8px',
          borderBottom: '1px solid rgba(179, 207, 229, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarOpen ? 'space-between' : 'center',
          height: '60px'
        }}>
          {isSidebarOpen ? (
            <>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#B3CFE5', letterSpacing: '0.5px' }}>
                  PeoplePay360
                </div>
                <div style={{ fontSize: '10px', color: '#4A7FA7', fontWeight: '500' }}>
                  HR & Payroll Operations
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#B3CFE5',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Collapse Sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <img 
              src={faviconImg} 
              alt="Open Sidebar" 
              style={{ height: '36px', width: '36px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => setIsSidebarOpen(true)}
              title="Click to Open Sidebar"
            />
          )}
        </div>

        {/* Navigation list */}
        <nav style={{ padding: '16px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  gap: '12px',
                  padding: isSidebarOpen ? '10px 14px' : '10px 0',
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
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div style={{
          padding: isSidebarOpen ? '16px' : '16px 8px',
          borderTop: '1px solid rgba(179, 207, 229, 0.12)',
          backgroundColor: '#102744',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarOpen ? 'space-between' : 'center'
        }}>
          {isSidebarOpen && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#B3CFE5' }}>
                {user?.name || 'Authorized User'}
              </div>
              <div style={{ fontSize: '11px', color: '#4A7FA7', marginTop: '2px', textTransform: 'capitalize' }}>
                {currentRole.replace(/_/g, ' ')}
              </div>
            </div>
          )}
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

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Fixed Top Header */}
        <header style={{
          height: '60px',
          flexShrink: 0,
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'relative',
          zIndex: 100
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
              PeoplePay360 / <span style={{ color: 'var(--text-main)', fontWeight: '600', textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          {/* Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notifications Bell Dropdown Container */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="btn btn-secondary"
                style={{ position: 'relative', padding: '8px', borderRadius: '50%' }}
                title="Notifications"
              >
                <Bell size={17} color="var(--text-main)" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 0 2px var(--card-bg)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover List */}
              {showNotifDropdown && (
                <div className="card shadow-lg" style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '350px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  zIndex: 200,
                  padding: 0,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-bg)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--surface)'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={14} color="var(--secondary-blue)" /> System Notifications ({unreadCount} unread)
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--secondary-blue)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCheck size={13} /> Read All
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.length > 0 ? (
                      notifications.map((n, idx) => (
                        <div
                          key={`notif-${n.id || idx}-${idx}`}
                          onClick={(e) => handleMarkAsRead(n.id, n.link_tab, e)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: n.is_read ? 'transparent' : 'rgba(179, 207, 229, 0.1)',
                            cursor: 'pointer',
                            transition: 'background 150ms ease',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{ marginTop: '2px' }}>
                            {getNotifIcon(n.type)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: n.is_read ? '600' : '700', color: 'var(--text-main)' }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {!n.is_read && (
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3B82F6', marginTop: '6px', flexShrink: 0 }} />
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        No notifications found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Read-only Verified Backend Role Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: roleStyle.bg,
              border: `1px solid ${roleStyle.border}`,
              color: roleStyle.text,
              fontWeight: '600'
            }}>
              <ShieldCheck size={14} color={roleStyle.text} />
              <span style={{ textTransform: 'capitalize' }}>{currentRole.replace(/_/g, ' ')}</span>
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

        {/* Scrollable Page Content Body */}
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

