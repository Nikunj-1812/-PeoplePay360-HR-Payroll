import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket, disconnectSocket, updateSocketToken } from '../utils/socket';
import { invalidateCache } from '../api/cache';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error'
  socketError: null,
  subscribeEvent: () => () => {}
});

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [socketError, setSocketError] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('pp360_token');

    if (!user || !token) {
      disconnectSocket();
      setSocketInstance(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    const socket = getSocket(token);
    setSocketInstance(socket);

    if (!socket) return;

    function handleConnect() {
      setIsConnected(true);
      setConnectionStatus('connected');
      setSocketError(null);

      // On connection or reconnection, re-sync application cache with latest server state
      invalidateCache([
        'user', 'profile', 'users',
        'employees', 'contracts', 'schedules',
        'attendance', 'timeoff', 'salary',
        'payruns', 'payslips', 'dashboard'
      ]);
    }

    function handleDisconnect(reason) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.log('[SocketContext] Real-time disconnected:', reason);
    }

    function handleConnectError(err) {
      setIsConnected(false);
      setConnectionStatus('error');
      setSocketError(err?.message || 'Connection error');
    }

    function handleReconnectAttempt(attempt) {
      setConnectionStatus('reconnecting');
      console.log(`[SocketContext] Reconnection attempt #${attempt}...`);
    }

    // Attach core connection listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io?.on('reconnect_attempt', handleReconnectAttempt);

    if (socket.connected) {
      handleConnect();
    }

    // Register central domain event listeners for automatic cache invalidation
    const handleUserUpdate = (data) => {
      invalidateCache(['user', 'profile', 'users']);
      if (data && data.user && user && String(data.user.id) === String(user.id)) {
        window.dispatchEvent(new CustomEvent('pp360_user_revalidate'));
      }
    };

    const handleEmployeeUpdate = () => invalidateCache(['employees', 'dashboard', 'payruns']);
    const handleContractUpdate = () => invalidateCache(['contracts', 'employees', 'dashboard']);
    const handleScheduleUpdate = () => invalidateCache(['schedules', 'attendance', 'dashboard']);
    const handleAttendanceUpdate = () => invalidateCache(['attendance', 'dashboard', 'employees']);
    const handleTimeOffUpdate = () => invalidateCache(['timeoff', 'dashboard', 'employees']);
    const handleSalaryUpdate = () => invalidateCache(['salary', 'payruns', 'dashboard']);
    const handlePayrunUpdate = () => invalidateCache(['payruns', 'payslips', 'dashboard']);
    const handlePayslipUpdate = () => invalidateCache(['payslips', 'payruns', 'dashboard']);
    const handleDashboardUpdate = () => invalidateCache(['dashboard']);

    socket.on('USER_CREATED', handleUserUpdate);
    socket.on('USER_UPDATED', handleUserUpdate);
    socket.on('USER_DELETED', handleUserUpdate);
    socket.on('EMPLOYEE_CREATED', handleEmployeeUpdate);
    socket.on('EMPLOYEE_UPDATED', handleEmployeeUpdate);
    socket.on('EMPLOYEE_DELETED', handleEmployeeUpdate);
    socket.on('CONTRACT_UPDATED', handleContractUpdate);
    socket.on('SCHEDULE_UPDATED', handleScheduleUpdate);
    socket.on('ATTENDANCE_UPDATED', handleAttendanceUpdate);
    socket.on('TIME_OFF_UPDATED', handleTimeOffUpdate);
    socket.on('SALARY_STRUCTURE_UPDATED', handleSalaryUpdate);
    socket.on('SALARY_RULE_UPDATED', handleSalaryUpdate);
    socket.on('PAYRUN_UPDATED', handlePayrunUpdate);
    socket.on('PAYSLIP_UPDATED', handlePayslipUpdate);
    socket.on('DASHBOARD_UPDATED', handleDashboardUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io?.off('reconnect_attempt', handleReconnectAttempt);

      socket.off('USER_CREATED', handleUserUpdate);
      socket.off('USER_UPDATED', handleUserUpdate);
      socket.off('USER_DELETED', handleUserUpdate);
      socket.off('EMPLOYEE_CREATED', handleEmployeeUpdate);
      socket.off('EMPLOYEE_UPDATED', handleEmployeeUpdate);
      socket.off('EMPLOYEE_DELETED', handleEmployeeUpdate);
      socket.off('CONTRACT_UPDATED', handleContractUpdate);
      socket.off('SCHEDULE_UPDATED', handleScheduleUpdate);
      socket.off('ATTENDANCE_UPDATED', handleAttendanceUpdate);
      socket.off('TIME_OFF_UPDATED', handleTimeOffUpdate);
      socket.off('SALARY_STRUCTURE_UPDATED', handleSalaryUpdate);
      socket.off('SALARY_RULE_UPDATED', handleSalaryUpdate);
      socket.off('PAYRUN_UPDATED', handlePayrunUpdate);
      socket.off('PAYSLIP_UPDATED', handlePayslipUpdate);
      socket.off('DASHBOARD_UPDATED', handleDashboardUpdate);
    };
  }, [user]);

  // Safe helper hook to subscribe to socket events without memory leaks
  const subscribeEvent = useCallback((eventName, callback) => {
    if (!socketInstance) return () => {};
    socketInstance.on(eventName, callback);
    return () => {
      socketInstance.off(eventName, callback);
    };
  }, [socketInstance]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected, connectionStatus, socketError, subscribeEvent }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
