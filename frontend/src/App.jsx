import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { GlobalLoadingScreen } from './components/ui/Loading';
import Shell from './components/layout/Shell';
import LoginPage from './components/auth/LoginPage';

import LandingPage from './components/landing/LandingPage';

import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ContractsPage from './pages/ContractsPage';
import AttendancePage from './pages/AttendancePage';
import TimeOffPage from './pages/TimeOffPage';
import SalaryStructuresPage from './pages/SalaryStructuresPage';
import PayrunsPage from './pages/PayrunsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  // Return to the public landing page whenever the session ends.
  React.useEffect(() => {
    if (!user) {
      setShowAuth(false);
    }
  }, [user]);

  if (loading) {
    return <GlobalLoadingScreen message="Restoring authenticated session..." />;
  }

  if (!user) {
    if (!showAuth) {
      return <LandingPage onOpenApp={() => setShowAuth(true)} onOpenSignIn={() => setShowAuth(true)} />;
    }
    return <LoginPage onCancel={() => setShowAuth(false)} />;
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
      case 'attendance':
        return <AttendancePage />;
      case 'time-off':
        return <TimeOffPage />;
      case 'payroll':
        return <PayrunsPage />;
      case 'structures':
        return <SalaryStructuresPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      <div key={activeTab} className="page-transition">
        {renderContent()}
      </div>
    </Shell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
