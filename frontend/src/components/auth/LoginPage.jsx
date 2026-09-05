import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogIn, Shield, Users, Wallet, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function LoginPage({ onCancel }) {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      if (onCancel) onCancel();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      if (onCancel) onCancel();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
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
        maxWidth: '900px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '32px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 12px 32px rgba(10, 25, 49, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Left Side: Standard Login Form */}
        <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#B3CFE5', letterSpacing: '-0.5px' }}>
                PeoplePay360
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                HR & Payroll Operations Platform
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={15} color="#0A1931" /> : <Sun size={15} color="#F59E0B" />}
            </button>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
            Sign In to Your Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Enter your operational credentials below
          </p>

          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              borderRadius: '6px',
              color: 'var(--danger)',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                Password
              </label>
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
                padding: '10px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                backgroundColor: '#B3CFE5',
                color: '#0A1931'
              }}
            >
              <LogIn size={18} />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Right Side: Quick 1-Click Demo Accounts */}
        <div style={{
          padding: '36px',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
            Quick 1-Click Demo Logins
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Select any role to test system permissions instantly
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--card-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(74, 127, 167, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} color="var(--secondary-blue)" />
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
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#0A1931',
                    backgroundColor: '#B3CFE5',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    Log In
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
