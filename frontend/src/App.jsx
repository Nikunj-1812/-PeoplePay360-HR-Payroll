import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { GlobalLoadingScreen, CenteredSpinner } from './components/ui/Loading';
import Shell from './components/layout/Shell';
import LoginPage from './components/auth/LoginPage';
import LandingPage from './components/landing/LandingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForcedPasswordChangeModal from './components/auth/ForcedPasswordChangeModal';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const TimeOffPage = lazy(() => import('./pages/TimeOffPage'));
const SalaryStructuresPage = lazy(() => import('./pages/SalaryStructuresPage'));
const PayrunsPage = lazy(() => import('./pages/PayrunsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function AppContent() {
  const { user, loading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  const pathname = window.location.pathname;
  const isResetPasswordRoute = pathname === '/reset-password' || window.location.search.includes('token=');

  // Return to the public landing page whenever the session ends.
  React.useEffect(() => {
    if (!user) {
      setShowAuth(false);
    }
  }, [user]);

  if (isResetPasswordRoute) {
    return <ResetPasswordPage />;
  }

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
        <Suspense fallback={<CenteredSpinner height="300px" />}>
          {renderContent()}
        </Suspense>
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
