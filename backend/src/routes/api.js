const express = require('express');
const router = express.Router();

const { authenticateToken, requireRole } = require('../middleware/auth');
const authService = require('../services/authService');
const employeeService = require('../services/employeeService');
const contractService = require('../services/contractService');
const scheduleService = require('../services/scheduleService');
const attendanceService = require('../services/attendanceService');
const timeOffService = require('../services/timeOffService');
const salaryService = require('../services/salaryService');
const payrollService = require('../services/payrollService');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const dashboardService = require('../services/dashboardService');
const reportService = require('../services/reportService');
const redisService = require('../services/redisService');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');
const { sql } = require('../db');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// 1. AUTH & USER MANAGEMENT ROUTES
// ==========================================

// POST /api/auth/login
router.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, ...result });
}));

// POST /api/auth/forgot-password
router.post('/auth/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }
  const result = await authService.requestPasswordReset(email);
  res.json(result);
}));

// POST /api/auth/verify-reset-token
router.post('/auth/verify-reset-token', asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  const result = await authService.verifyResetToken(token);
  res.json(result);
}));

// POST /api/auth/reset-password
router.post('/auth/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  const result = await authService.resetPassword({ token, newPassword, confirmPassword });
  res.json(result);
}));

// POST /api/auth/change-password
router.post('/auth/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'New password is required' });
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  await redisService.del(`pp360:user:profile:${req.user.id}`);
  res.json(result);
}));

// GET /api/auth/me
router.get('/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  const cacheKey = `pp360:user:profile:${req.user.id}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const user = await authService.getCurrentUser(req.user.id);
  await redisService.set(cacheKey, user, 300);
  res.json({ success: true, data: user });
}));

// GET /api/notifications
router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const data = await notificationService.getUserNotifications(req.user.id);
  res.json({ success: true, data });
}));

// PUT /api/notifications/read-all
router.put('/notifications/read-all', authenticateToken, asyncHandler(async (req, res) => {
  const data = await notificationService.markAllAsRead(req.user.id);
  res.json({ success: true, data });
}));

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(req.params.id, req.user.id);
  res.json({ success: true, data });
}));

// GET /api/auth/users
router.get('/auth/users', authenticateToken, requireRole(['admin']), asyncHandler(async (_req, res) => {
  const cacheKey = 'pp360:users:all';
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const users = await authService.getAllUsers();
  await redisService.set(cacheKey, users, 300);
  res.json({ success: true, data: users });
}));

// POST /api/auth/users
router.post('/auth/users', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);
  await redisService.del('pp360:users:all');
  socketService.emitToRole(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], 'USER_CREATED', { user });
  res.status(201).json({ success: true, data: user });
}));

// PUT /api/auth/users/:id
router.put('/auth/users/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body);
  await redisService.del('pp360:users:all');
  await redisService.del(`pp360:user:profile:${req.params.id}`);
  socketService.emitToRolesAndUser(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], req.params.id, 'USER_UPDATED', { user });
  res.json({ success: true, data: user });
}));

// PUT /api/auth/users/:id/reset-password
router.put('/auth/users/:id/reset-password', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ success: false, message: 'New password required' });
  const result = await authService.resetUserPassword(req.params.id, new_password);
  await redisService.del(`pp360:user:profile:${req.params.id}`);
  socketService.emitToUser(req.params.id, 'USER_UPDATED', { id: req.params.id, event: 'password_reset' });
  res.json({ success: true, data: result });
}));

// POST /api/auth/users/:id/resend-credentials
router.post('/auth/users/:id/resend-credentials', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const result = await authService.resendUserCredentials(req.params.id);
  res.json({ success: true, data: result });
}));

// DELETE /api/auth/users/:id
router.delete('/auth/users/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const deleted = await authService.deleteUser(req.params.id);
  await redisService.del('pp360:users:all');
  await redisService.del(`pp360:user:profile:${req.params.id}`);
  socketService.emitToRolesAndUser(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], req.params.id, 'USER_DELETED', { id: req.params.id });
  res.json({ success: true, data: deleted });
}));

// ==========================================
// 2. DASHBOARD
// ==========================================

// GET /api/dashboard
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    query.employee_id = req.user.employee_id;
  }

  const cacheKey = `pp360:dashboard:${req.user.role}:${isEmployee ? req.user.employee_id : 'global'}:${JSON.stringify(query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const data = await dashboardService.getDashboardData(query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

// ==========================================
// 3. EMPLOYEES & EMPLOYMENT HISTORY
// ==========================================

// GET /api/employees
router.get('/employees', authenticateToken, asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    query.id = req.user.employee_id;
  }

  const cacheKey = `pp360:employees:list:${req.user.role}:${isEmployee ? req.user.employee_id : 'all'}:${JSON.stringify(query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const employees = await employeeService.getEmployees(query);
  await redisService.set(cacheKey, employees, 300);
  res.json({ success: true, data: employees });
}));

// GET /api/employees/:id
router.get('/employees/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'employee' && String(req.user.employee_id) !== String(req.params.id)) {
    return res.status(403).json({ success: false, message: 'Access denied to other employee profiles.' });
  }

  const cacheKey = `pp360:employees:detail:${req.params.id}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const employee = await employeeService.getEmployeeById(req.params.id);
  await redisService.set(cacheKey, employee, 300);
  res.json({ success: true, data: employee });
}));

// GET /api/employees/:id/history
router.get('/employees/:id/history', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'employee' && String(req.user.employee_id) !== String(req.params.id)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const cacheKey = `pp360:employees:history:${req.params.id}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const history = await employeeService.getEmployeeHistory(req.params.id);
  await redisService.set(cacheKey, history, 300);
  res.json({ success: true, data: history });
}));

// POST /api/employees
router.post('/employees', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const emp = await employeeService.createEmployee(req.body);
  await redisService.invalidateEmployees();
  await redisService.del('pp360:users:all');
  socketService.emitToRole(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], 'EMPLOYEE_CREATED', { employee: emp });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.status(201).json({ success: true, data: emp });
}));

// PUT /api/employees/:id
router.put('/employees/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const emp = await employeeService.updateEmployee(req.params.id, req.body);
  await redisService.invalidateEmployees(req.params.id);
  await redisService.del('pp360:users:all');
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], emp?.id, 'EMPLOYEE_UPDATED', { employee: emp });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: emp });
}));

// DELETE /api/employees/:id
router.delete('/employees/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await employeeService.deleteEmployee(req.params.id);
  await redisService.invalidateEmployees(req.params.id);
  await redisService.del('pp360:users:all');
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], req.params.id, 'EMPLOYEE_DELETED', { id: req.params.id });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// POST /api/employees/:id/resend-invitation
router.post('/employees/:id/resend-invitation', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const result = await employeeService.resendInvitation(req.params.id);
  res.json({ success: true, ...result });
}));

// ==========================================
// 4. CONTRACTS
// ==========================================

// GET /api/contracts
router.get('/contracts', authenticateToken, asyncHandler(async (req, res) => {
  let empId = req.query.employee_id;
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    empId = req.user.employee_id;
  }

  const cacheKey = `pp360:contracts:${req.user.role}:${empId || 'all'}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const contracts = await contractService.getContracts(empId);
  await redisService.set(cacheKey, contracts, 300);
  res.json({ success: true, data: contracts });
}));

// POST /api/contracts
router.post('/contracts', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const contract = await contractService.createContract(req.body);
  await redisService.invalidateContracts(contract.employee_id);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], contract?.employee_id, 'CONTRACT_UPDATED', { contract });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.status(201).json({ success: true, data: contract });
}));

// PUT /api/contracts/:id
router.put('/contracts/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const contract = await contractService.updateContract(req.params.id, req.body);
  await redisService.invalidateContracts(contract.employee_id);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], contract?.employee_id, 'CONTRACT_UPDATED', { contract });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: contract });
}));

// DELETE /api/contracts/:id
router.delete('/contracts/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await contractService.deleteContract(req.params.id);
  await redisService.invalidateContracts();
  socketService.emitToRole(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], 'CONTRACT_UPDATED', { id: req.params.id });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// ==========================================
// 5. WORKING SCHEDULES
// ==========================================

// GET /api/schedules
router.get('/schedules', authenticateToken, asyncHandler(async (_req, res) => {
  const cacheKey = 'pp360:schedules:list';
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const schedules = await scheduleService.getSchedules();
  await redisService.set(cacheKey, schedules, 600);
  res.json({ success: true, data: schedules });
}));

// GET /api/schedules/:id
router.get('/schedules/:id', authenticateToken, asyncHandler(async (req, res) => {
  const schedule = await scheduleService.getScheduleById(req.params.id);
  res.json({ success: true, data: schedule });
}));

// POST /api/schedules
router.post('/schedules', authenticateToken, requireRole(['hr_manager', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body);
  await redisService.invalidateSchedules();
  socketService.emitToAll('SCHEDULE_UPDATED', { schedule });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.status(201).json({ success: true, data: schedule });
}));

// PUT /api/schedules/:id
router.put('/schedules/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await scheduleService.updateSchedule(req.params.id, req.body);
  await redisService.invalidateSchedules();
  socketService.emitToAll('SCHEDULE_UPDATED', { schedule: updated });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: updated });
}));

// DELETE /api/schedules/:id
router.delete('/schedules/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await scheduleService.deleteSchedule(req.params.id);
  await redisService.invalidateSchedules();
  socketService.emitToAll('SCHEDULE_UPDATED', { id: req.params.id });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// ==========================================
// 6. ATTENDANCE
// ==========================================

// GET /api/attendance
router.get('/attendance', authenticateToken, asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    if (!req.user.employee_id) {
      return res.json({ success: true, data: [] });
    }
    query.employee_id = req.user.employee_id;
  }

  const attendance = await attendanceService.getAttendance(query);
  res.json({ success: true, data: attendance });
}));

const handleCheckIn = asyncHandler(async (req, res) => {
  let empId = req.user?.role === 'employee'
    ? req.user.employee_id
    : (req.body?.employee_id || req.user?.employee_id);
  if (!empId && req.user?.id) {
    const [emp] = await sql`
      SELECT e.id
      FROM users u
      JOIN employees e ON e.id = u.employee_id
      WHERE u.id = ${req.user.id} OR lower(trim(u.email)) = lower(trim(${req.user.email}))
      LIMIT 1
    `;
    if (emp) empId = emp.id;
  }
  if (!empId) return res.status(400).json({ success: false, message: 'Employee ID required for Check In' });

  const rec = await attendanceService.clockIn(empId);
  await redisService.invalidateAttendance(empId);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], empId, 'ATTENDANCE_UPDATED', { attendance: rec, action: 'check-in' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: rec });
});

const handleCheckOut = asyncHandler(async (req, res) => {
  let empId = req.user?.role === 'employee'
    ? req.user.employee_id
    : (req.body?.employee_id || req.user?.employee_id);
  if (!empId && req.user?.id) {
    const [emp] = await sql`
      SELECT e.id
      FROM users u
      JOIN employees e ON e.id = u.employee_id
      WHERE u.id = ${req.user.id} OR lower(trim(u.email)) = lower(trim(${req.user.email}))
      LIMIT 1
    `;
    if (emp) empId = emp.id;
  }
  if (!empId) return res.status(400).json({ success: false, message: 'Employee ID required for Check Out' });

  const rec = await attendanceService.clockOut(empId);
  await redisService.invalidateAttendance(empId);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], empId, 'ATTENDANCE_UPDATED', { attendance: rec, action: 'check-out' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: rec });
});

const { createRateLimiter } = require('../middleware/rateLimiter');
const attendanceLimiter = createRateLimiter({
  windowMs: 30000,
  max: 5,
  message: 'Too many attendance check-in/out attempts. Please wait a moment before trying again.'
});

// POST /api/attendance/check-in
router.post('/attendance/check-in', authenticateToken, attendanceLimiter, handleCheckIn);
// POST /api/attendance/clock-in
router.post('/attendance/clock-in', authenticateToken, attendanceLimiter, handleCheckIn);

// POST /api/attendance/check-out
router.post('/attendance/check-out', authenticateToken, attendanceLimiter, handleCheckOut);
// POST /api/attendance/clock-out
router.post('/attendance/clock-out', authenticateToken, attendanceLimiter, handleCheckOut);

// PUT /api/attendance/:id/correct
router.put('/attendance/:id/correct', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const corrected = await attendanceService.correctAttendance(req.params.id, {
    ...req.body,
    corrected_by: req.user.name
  });
  await redisService.invalidateAttendance(corrected?.employee_id);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], corrected?.employee_id, 'ATTENDANCE_UPDATED', { attendance: corrected, action: 'correction' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: corrected });
}));

// DELETE /api/attendance/:id
router.delete('/attendance/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await attendanceService.deleteAttendance(req.params.id);
  await redisService.invalidateAttendance();
  socketService.emitToRole(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], 'ATTENDANCE_UPDATED', { id: req.params.id, action: 'delete' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// ==========================================
// 7. TIME OFF (TYPES, ALLOCATIONS, REQUESTS)
// ==========================================

// GET /api/time-off/types
router.get('/time-off/types', authenticateToken, asyncHandler(async (_req, res) => {
  const cacheKey = 'pp360:timeoff:types';
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const types = await timeOffService.getTimeOffTypes();
  await redisService.set(cacheKey, types, 600);
  res.json({ success: true, data: types });
}));

// POST /api/time-off/types
router.post('/time-off/types', authenticateToken, requireRole(['hr_manager', 'admin']), asyncHandler(async (req, res) => {
  const created = await timeOffService.createTimeOffType(req.body);
  await redisService.invalidateTimeOff();
  res.status(201).json({ success: true, data: created });
}));

// PUT /api/time-off/types/:id
router.put('/time-off/types/:id', authenticateToken, requireRole(['hr_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await timeOffService.updateTimeOffType(req.params.id, req.body);
  await redisService.invalidateTimeOff();
  res.json({ success: true, data: updated });
}));

// DELETE /api/time-off/types/:id
router.delete('/time-off/types/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await timeOffService.deleteTimeOffType(req.params.id);
  await redisService.invalidateTimeOff();
  res.json({ success: true, data: deleted });
}));

// GET /api/time-off/allocations
router.get('/time-off/allocations', authenticateToken, asyncHandler(async (req, res) => {
  let empId = req.query.employee_id;
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    empId = req.user.employee_id;
  }

  const cacheKey = `pp360:timeoff:allocations:${req.user.role}:${empId || 'all'}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const allocs = await timeOffService.getAllocations(empId);
  await redisService.set(cacheKey, allocs, 300);
  res.json({ success: true, data: allocs });
}));

// POST /api/time-off/allocations
router.post('/time-off/allocations', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const created = await timeOffService.createAllocation(req.body);
  await redisService.invalidateTimeOff(created.employee_id);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], created.employee_id, 'TIME_OFF_UPDATED', { allocation: created });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.status(201).json({ success: true, data: created });
}));

// PUT /api/time-off/allocations/:id
router.put('/time-off/allocations/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await timeOffService.updateAllocation(req.params.id, req.body);
  await redisService.invalidateTimeOff();
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], updated?.employee_id, 'TIME_OFF_UPDATED', { allocation: updated });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: updated });
}));

// DELETE /api/time-off/allocations/:id
router.delete('/time-off/allocations/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await timeOffService.deleteAllocation(req.params.id);
  await redisService.invalidateTimeOff();
  socketService.emitToRole(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], 'TIME_OFF_UPDATED', { id: req.params.id });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// GET /api/time-off/requests
router.get('/time-off/requests', authenticateToken, asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    query.employee_id = req.user.employee_id;
  }

  const cacheKey = `pp360:timeoff:requests:${req.user.role}:${isEmployee ? req.user.employee_id : (query.employee_id || 'all')}:${JSON.stringify(query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const requests = await timeOffService.getRequests(query);
  await redisService.set(cacheKey, requests, 300);
  res.json({ success: true, data: requests });
}));

// POST /api/time-off/requests
router.post('/time-off/requests', authenticateToken, asyncHandler(async (req, res) => {
  const empId = req.user?.role === 'employee'
    ? req.user.employee_id
    : (req.body.employee_id || req.user.employee_id);
  if (!empId) {
    return res.status(400).json({ success: false, message: 'Link this user to an employee profile before requesting time off.' });
  }
  const request = await timeOffService.createRequest({ ...req.body, employee_id: empId });
  await redisService.invalidateTimeOff(empId);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], empId, 'TIME_OFF_UPDATED', { request, status: 'requested' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.status(201).json({ success: true, data: request });
}));

// PUT /api/time-off/requests/:id/approve
router.put('/time-off/requests/:id/approve', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const approved = await timeOffService.approveRequest(req.params.id, req.user.name);
  await redisService.invalidateTimeOff(approved?.employee_id);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], approved?.employee_id, 'TIME_OFF_UPDATED', { request: approved, status: 'approved' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: approved });
}));

// PUT /api/time-off/requests/:id/refuse
router.put('/time-off/requests/:id/refuse', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const refused = await timeOffService.refuseRequest(req.params.id, req.user.name);
  await redisService.invalidateTimeOff(refused?.employee_id);
  socketService.emitToRolesAndEmployee(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], refused?.employee_id, 'TIME_OFF_UPDATED', { request: refused, status: 'refused' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: refused });
}));

// DELETE /api/time-off/requests/:id
router.delete('/time-off/requests/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'employee') {
    const reqs = await sql`SELECT employee_id FROM time_off_requests WHERE id = ${req.params.id}`;
    if (reqs.length === 0 || String(reqs[0].employee_id) !== String(req.user.employee_id)) {
      return res.status(403).json({ success: false, message: 'Access denied to delete another employee request.' });
    }
  }

  const deleted = await timeOffService.deleteRequest(req.params.id);
  await redisService.invalidateTimeOff();
  socketService.emitToRole(['admin', 'hr_manager', 'hr_payroll_manager', 'hr_payroll_user'], 'TIME_OFF_UPDATED', { id: req.params.id, status: 'deleted' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// ==========================================
// 8. SALARY STRUCTURES & RULES
// ==========================================

// GET /api/salary/structures
router.get('/salary/structures', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (_req, res) => {
  const cacheKey = 'pp360:salary:structures:list';
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const structures = await salaryService.getSalaryStructures();
  await redisService.set(cacheKey, structures, 300);
  res.json({ success: true, data: structures });
}));

// GET /api/salary/structures/:id
router.get('/salary/structures/:id', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:salary:structures:detail:${req.params.id}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const structure = await salaryService.getSalaryStructureById(req.params.id);
  await redisService.set(cacheKey, structure, 300);
  res.json({ success: true, data: structure });
}));

// POST /api/salary/structures
router.post('/salary/structures', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const struct = await salaryService.createSalaryStructure(req.body);
  await redisService.invalidateSalaryStructures(struct?.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_STRUCTURE_UPDATED', { structure: struct });
  res.status(201).json({ success: true, data: struct });
}));

// PUT /api/salary/structures/:id
router.put('/salary/structures/:id', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await salaryService.updateSalaryStructure(req.params.id, req.body);
  await redisService.invalidateSalaryStructures(req.params.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_STRUCTURE_UPDATED', { structure: updated });
  res.json({ success: true, data: updated });
}));

// DELETE /api/salary/structures/:id
router.delete('/salary/structures/:id', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await salaryService.deleteSalaryStructure(req.params.id);
  await redisService.invalidateSalaryStructures(req.params.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_STRUCTURE_UPDATED', { id: req.params.id });
  res.json({ success: true, data: deleted });
}));

// GET /api/salary/rules
router.get('/salary/rules', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const structId = req.query.salary_structure_id || 'all';
  const cacheKey = `pp360:salary:rules:${structId}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const rules = await salaryService.getSalaryRules(req.query.salary_structure_id);
  await redisService.set(cacheKey, rules, 300);
  res.json({ success: true, data: rules });
}));

// POST /api/salary/rules
router.post('/salary/rules', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const rule = await salaryService.createSalaryRule(req.body);
  await redisService.invalidateSalaryStructures(rule?.salary_structure_id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_RULE_UPDATED', { rule });
  res.status(201).json({ success: true, data: rule });
}));

// PUT /api/salary/rules/reorder
router.put('/salary/rules/reorder', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const result = await salaryService.reorderSalaryRules(req.body.rules);
  await redisService.invalidateSalaryStructures();
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_RULE_UPDATED', { action: 'reorder' });
  res.json({ success: true, data: result });
}));

// PUT /api/salary/rules/:id
router.put('/salary/rules/:id', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await salaryService.updateSalaryRule(req.params.id, req.body);
  await redisService.invalidateSalaryStructures(updated?.salary_structure_id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_RULE_UPDATED', { rule: updated });
  res.json({ success: true, data: updated });
}));

// DELETE /api/salary/rules/:id
router.delete('/salary/rules/:id', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await salaryService.deleteSalaryRule(req.params.id);
  await redisService.invalidateSalaryStructures();
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'SALARY_RULE_UPDATED', { id: req.params.id });
  res.json({ success: true, data: deleted });
}));

// ==========================================
// 9. PAYRUNS & PAYSLIPS
// ==========================================

// GET /api/payruns/eligible-employees
router.get('/payruns/eligible-employees', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const { salary_structure_id, period_start, period_end } = req.query;
  const employees = await payrollService.getEligibleEmployees(salary_structure_id, period_start, period_end);
  res.json({ success: true, data: employees });
}));

// GET /api/payruns
router.get('/payruns', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (_req, res) => {
  const cacheKey = 'pp360:payruns:list';
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const payruns = await payrollService.getPayruns();
  await redisService.set(cacheKey, payruns, 300);
  res.json({ success: true, data: payruns });
}));

// GET /api/payruns/:id
router.get('/payruns/:id', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:payruns:detail:${req.params.id}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const payrun = await payrollService.getPayrunById(req.params.id);
  await redisService.set(cacheKey, payrun, 300);
  res.json({ success: true, data: payrun });
}));

// POST /api/payruns
router.post('/payruns', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const payrun = await payrollService.createPayrun(req.body);
  await redisService.invalidatePayruns(payrun?.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'PAYRUN_UPDATED', { payrun, action: 'created' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.status(201).json({ success: true, data: payrun });
}));

// POST /api/payruns/:id/compute
router.post('/payruns/:id/compute', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const computed = await payrollService.computePayrun(req.params.id);
  await redisService.invalidatePayruns(req.params.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'PAYRUN_UPDATED', { payrun: computed, action: 'computed' });
  socketService.emitToAll('PAYSLIP_UPDATED', {});
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: computed });
}));

// PUT /api/payruns/:id/status
router.put('/payruns/:id/status', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await payrollService.updatePayrunStatus(req.params.id, req.body.status);
  await redisService.invalidatePayruns(req.params.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'PAYRUN_UPDATED', { payrun: updated, action: 'status_changed' });
  socketService.emitToAll('PAYSLIP_UPDATED', {});
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: updated });
}));

// POST /api/payruns/:id/send-payslips
router.post('/payruns/:id/send-payslips', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const result = await emailService.sendBulkPayslips(req.params.id);
  await redisService.invalidatePayruns(req.params.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'PAYRUN_UPDATED', { id: req.params.id, action: 'payslips_sent' });
  socketService.emitToAll('PAYSLIP_UPDATED', {});
  res.json({ success: true, data: result });
}));

// DELETE /api/payruns/:id
router.delete('/payruns/:id', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const deleted = await payrollService.deletePayrun(req.params.id);
  await redisService.invalidatePayruns(req.params.id);
  socketService.emitToRole(['admin', 'hr_payroll_manager', 'hr_payroll_user'], 'PAYRUN_UPDATED', { id: req.params.id, action: 'deleted' });
  socketService.emitToAll('DASHBOARD_UPDATED', {});
  res.json({ success: true, data: deleted });
}));

// GET /api/payslips
router.get('/payslips', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'hr_manager') {
    return res.status(403).json({ success: false, message: 'HR Managers do not have access to payroll payslips.' });
  }

  let empId = req.query.employee_id;
  const isEmployee = req.user && req.user.role === 'employee';
  if (isEmployee) {
    empId = req.user.employee_id;
  }

  const cacheKey = `pp360:payslips:list:${req.user.role}:${empId || 'all'}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  let payslips;
  if (empId) {
    payslips = await sql`
      SELECT p.*, pr.name as payrun_name
      FROM payslips p
      JOIN payruns pr ON p.payrun_id = pr.id
      WHERE p.employee_id = ${parseInt(empId, 10)}
      ORDER BY p.period_start DESC
    `;
  } else {
    payslips = await sql`
      SELECT p.*, pr.name as payrun_name, e.first_name || ' ' || e.last_name as employee_name, e.emp_id
      FROM payslips p
      JOIN payruns pr ON p.payrun_id = pr.id
      JOIN employees e ON p.employee_id = e.id
      ORDER BY p.id DESC
      LIMIT 100
    `;
  }

  await redisService.set(cacheKey, payslips, 300);
  res.json({ success: true, data: payslips });
}));

// GET /api/payslips/:id
router.get('/payslips/:id', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'hr_manager') {
    return res.status(403).json({ success: false, message: 'HR Managers do not have access to payroll payslips.' });
  }

  const slipId = parseInt(req.params.id, 10);
  const slips = await sql`
    SELECT 
      p.*,
      pr.name as payrun_name,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id, e.email, e.job_position, e.bank_name, e.account_number,
      d.name as department_name
    FROM payslips p
    JOIN payruns pr ON p.payrun_id = pr.id
    JOIN employees e ON p.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE p.id = ${slipId}
  `;

  if (slips.length === 0) {
    return res.status(404).json({ success: false, message: 'Payslip not found' });
  }

  const slip = slips[0];

  if (req.user && req.user.role === 'employee' && String(slip.employee_id) !== String(req.user.employee_id)) {
    return res.status(403).json({ success: false, message: 'Access denied to another employee payslip.' });
  }

  const lines = await sql`
    SELECT * FROM payslip_lines
    WHERE payslip_id = ${slipId}
    ORDER BY sequence ASC
  `;

  res.json({ success: true, data: { ...slip, lines } });
}));

// GET /api/payslips/:id/pdf
router.get('/payslips/:id/pdf', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'hr_manager') {
    return res.status(403).json({ success: false, message: 'HR Managers do not have access to payroll payslips.' });
  }

  if (req.user && req.user.role === 'employee') {
    const slips = await sql`SELECT employee_id FROM payslips WHERE id = ${req.params.id}`;
    if (slips.length === 0 || String(slips[0].employee_id) !== String(req.user.employee_id)) {
      return res.status(403).json({ success: false, message: 'Access denied to other employee payslips.' });
    }
  }

  const pdfBuffer = await pdfService.generatePayslipPDF(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=payslip-${req.params.id}.pdf`);
  res.send(pdfBuffer);
}));

// POST /api/payslips/:id/send-email
router.post('/payslips/:id/send-email', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const result = await emailService.sendSinglePayslip(req.params.id);
  await redisService.invalidatePayruns();
  res.json({ success: true, data: result });
}));

// ==========================================
// 10. REPORTS MODULE ROUTES
// ==========================================

// GET /api/reports (Generic Query Alias)
router.get('/reports', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const type = (req.query.type || 'payroll').toLowerCase();
  if (req.user && req.user.role === 'hr_manager' && (type === 'payroll' || type === 'payslips')) {
    return res.status(403).json({ success: false, message: 'HR Managers do not have access to payroll reports.' });
  }

  let data;
  if (type === 'employees') {
    data = await reportService.getEmployeeReport(req.query);
  } else if (type === 'contracts') {
    data = await reportService.getContractReport(req.query);
  } else if (type === 'attendance') {
    data = await reportService.getAttendanceReport(req.query);
  } else if (type === 'time-off' || type === 'timeoff') {
    data = await reportService.getTimeOffReport(req.query);
  } else if (type === 'payslips') {
    data = await reportService.getPayslipHistoryReport(req.query);
  } else {
    data = await reportService.getPayrollReport(req.query);
  }
  res.json({ success: true, data });
}));

// GET /api/reports/employees
router.get('/reports/employees', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:reports:employees:${JSON.stringify(req.query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const data = await reportService.getEmployeeReport(req.query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

// GET /api/reports/contracts
router.get('/reports/contracts', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:reports:contracts:${JSON.stringify(req.query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const data = await reportService.getContractReport(req.query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

// GET /api/reports/attendance
router.get('/reports/attendance', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:reports:attendance:${JSON.stringify(req.query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const data = await reportService.getAttendanceReport(req.query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

// GET /api/reports/time-off
router.get('/reports/time-off', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:reports:time-off:${JSON.stringify(req.query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const data = await reportService.getTimeOffReport(req.query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

// GET /api/reports/payroll
router.get('/reports/payroll', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:reports:payroll:${JSON.stringify(req.query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const data = await reportService.getPayrollReport(req.query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

// GET /api/reports/payslips
router.get('/reports/payslips', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const cacheKey = `pp360:reports:payslips:${JSON.stringify(req.query)}`;
  const cached = await redisService.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const data = await reportService.getPayslipHistoryReport(req.query);
  await redisService.set(cacheKey, data, 300);
  res.json({ success: true, data });
}));

function formatCSVCellBackend(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Protect against spreadsheet formula injection (=, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// GET /api/reports/:type/csv (Backend CSV export stream)
router.get('/reports/:type/csv', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const type = req.params.type;
  let data = [];
  if (type === 'employees') data = await reportService.getEmployeeReport(req.query);
  else if (type === 'contracts') data = await reportService.getContractReport(req.query);
  else if (type === 'attendance') data = await reportService.getAttendanceReport(req.query);
  else if (type === 'time-off') data = await reportService.getTimeOffReport(req.query);
  else if (type === 'payroll') data = await reportService.getPayrollReport(req.query);
  else if (type === 'payslips') data = await reportService.getPayslipHistoryReport(req.query);
  else return res.status(400).json({ success: false, message: 'Invalid report type for CSV export' });

  if (data.length === 0) {
    return res.status(404).json({ success: false, message: 'No records found to export' });
  }

  const headers = Object.keys(data[0]).map(formatCSVCellBackend).join(',');
  const rows = data.map(row => Object.values(row).map(formatCSVCellBackend).join(','));
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="PeoplePay360_${type}_report_${new Date().toISOString().split('T')[0]}.csv"`);
  res.status(200).send(csvContent);
}));

module.exports = router;
