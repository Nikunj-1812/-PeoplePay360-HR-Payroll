import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogIn, Shield, Users, Wallet, ShieldCheck, ArrowLeft, X } from 'lucide-react';

export default function LoginPage({ onCancel }) {
  const { login } = useAuth();
  const toast = useToast();
  
  const [viewMode, setViewMode] = useState('signin'); // 'signin' | 'demo'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeDemoEmail, setActiveDemoEmail] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMessage(res?.message || 'If an account exists for that email, a password reset link has been dispatched.');
    } catch (err) {
      setForgotMessage(err.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      if (onCancel) onCancel();
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setActiveDemoEmail(demoEmail);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      toast.success('Demo login successful!');
      if (onCancel) onCancel();
    } catch (err) {
      const errMsg = err.message || 'Demo login failed.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
      setActiveDemoEmail(null);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@peoplepay360.com', pass: 'Admin@123', desc: 'Full System Control & Settings', icon: Shield, badge: '#EF4444' },
    { role: 'HR Payroll Manager', email: 'payrollmanager@peoplepay360.com', pass: 'PayrollManager@123', desc: 'Payroll, Payruns & Salary Rules', icon: ShieldCheck, badge: '#3B82F6' },
    { role: 'HR Payroll User', email: 'payrolluser@peoplepay360.com', pass: 'PayrollUser@123', desc: 'Payruns & Payslips Processing', icon: Wallet, badge: '#10B981' },
    { role: 'HR Manager', email: 'hrmanager@peoplepay360.com', pass: 'HRManager@123', desc: 'Employees, Contracts & Leave', icon: Users, badge: '#F59E0B' },
    { role: 'Employee', email: 'employee@peoplepay360.com', pass: 'Employee@123', desc: 'Self-Service & Payslip View', icon: Users, badge: '#8B5CF6' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(10, 25, 49, 0.12)',
        overflow: 'hidden',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#B3CFE5', letterSpacing: '-0.5px' }}>
              PeoplePay360
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              HR & Payroll Operations Platform
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--secondary-blue)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={14} /> Website
            </button>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '8px',
            color: 'var(--danger)',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {viewMode === 'signin' ? (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
              Sign In to Your Account
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Enter your operational credentials below to access your workspace.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@peoplepay360.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotMessage('');
                      setShowForgotModal(true);
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '12px', color: 'var(--secondary-blue)', cursor: 'pointer', textDecoration: 'none' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  backgroundColor: '#B3CFE5',
                  color: '#0A1931',
                  borderRadius: '8px'
                }}
              >
                <LogIn size={18} />
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Need instant access for testing role permissions?
              </p>
              <button
                type="button"
                onClick={() => setViewMode('demo')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease'
                }}
                className="hover-card"
              >
                Demo Accounts
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>
                Demo Accounts
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Select any role below to test system permissions instantly:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isLoggingInThis = activeDemoEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleQuickLogin(acc.email, acc.pass)}
                    disabled={loading}
                    className={`demo-account-card ${isLoggingInThis ? 'logging-in' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="demo-account-icon">
                        <Icon size={18} color="var(--secondary-blue)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {acc.role}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    <span className="demo-account-badge">
                      {isLoggingInThis ? 'Signing in...' : 'Log In →'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setViewMode('signin')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </button>
          </>
        )}
      </div>

      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(10, 25, 49, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Reset Your Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Enter your account email address and we'll send you a single-use link to set a new password.
            </p>

            {forgotMessage && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(179, 207, 229, 0.1)',
                border: '1px solid #B3CFE5',
                color: 'var(--text-main)',
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-main)' }}>
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@peoplepay360.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#B3CFE5',
                    color: '#0A1931',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {forgotLoading ? 'Sending...' : 'Send Setup Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
