import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Shell from './components/layout/Shell';
import LoginPage from './components/auth/LoginPage';

import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ContractsPage from './pages/ContractsPage';
import SchedulesPage from './pages/SchedulesPage';
import AttendancePage from './pages/AttendancePage';
import TimeOffPage from './pages/TimeOffPage';
import SalaryStructuresPage from './pages/SalaryStructuresPage';
import PayrunsPage from './pages/PayrunsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-muted)',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        Loading PeoplePay360 HRMS...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'employees':
        return <EmployeesPage onNavigateTab={setActiveTab} />;
      case 'contracts':
        return <ContractsPage />;
      case 'schedules':
        return <SchedulesPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'time-off':
        return <TimeOffPage />;
      case 'payroll':
        return <PayrunsPage />;
      case 'structures':
        return <SalaryStructuresPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Shell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
