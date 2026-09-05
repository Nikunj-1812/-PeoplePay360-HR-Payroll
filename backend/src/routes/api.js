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
const { sql } = require('../db');

// Helper wrapper for async handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// 1. AUTH ROUTES
// ==========================================

router.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, ...result });
}));

router.get('/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.json({ success: true, data: user });
}));

router.get('/auth/users', asyncHandler(async (_req, res) => {
  const users = await authService.getAllUsers();
  res.json({ success: true, data: users });
}));

// Quick Demo Role Switcher endpoint
router.post('/auth/switch-role', authenticateToken, asyncHandler(async (req, res) => {
  const { role } = req.body;
  await sql`UPDATE users SET role = ${role} WHERE id = ${req.user.id}`;
  const updated = await authService.getCurrentUser(req.user.id);
  res.json({ success: true, data: updated });
}));

// ==========================================
// 2. DASHBOARD
// ==========================================

router.get('/dashboard', asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardData(req.query);
  res.json({ success: true, data });
}));

// ==========================================
// 3. EMPLOYEES
// ==========================================

router.get('/employees', asyncHandler(async (req, res) => {
  const employees = await employeeService.getEmployees(req.query);
  res.json({ success: true, data: employees });
}));

router.get('/employees/:id', asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  res.json({ success: true, data: employee });
}));

router.post('/employees', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const emp = await employeeService.createEmployee(req.body);
  res.status(201).json({ success: true, data: emp });
}));

router.put('/employees/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const emp = await employeeService.updateEmployee(req.params.id, req.body);
  res.json({ success: true, data: emp });
}));

// ==========================================
// 4. CONTRACTS
// ==========================================

router.get('/contracts', asyncHandler(async (req, res) => {
  const contracts = await contractService.getContracts(req.query.employee_id);
  res.json({ success: true, data: contracts });
}));

router.post('/contracts', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const contract = await contractService.createContract(req.body);
  res.status(201).json({ success: true, data: contract });
}));

router.put('/contracts/:id', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const contract = await contractService.updateContract(req.params.id, req.body);
  res.json({ success: true, data: contract });
}));

// ==========================================
// 5. WORKING SCHEDULES
// ==========================================

router.get('/schedules', asyncHandler(async (_req, res) => {
  const schedules = await scheduleService.getSchedules();
  res.json({ success: true, data: schedules });
}));

router.post('/schedules', authenticateToken, requireRole(['hr_manager', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body);
  res.status(201).json({ success: true, data: schedule });
}));

// ==========================================
// 6. ATTENDANCE
// ==========================================

router.get('/attendance', asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getAttendance(req.query);
  res.json({ success: true, data: attendance });
}));

router.post('/attendance/clock-in', authenticateToken, asyncHandler(async (req, res) => {
  const empId = req.body.employee_id || req.user.employee_id;
  if (!empId) return res.status(400).json({ success: false, message: 'Employee ID required' });
  const rec = await attendanceService.clockIn(empId);
  res.json({ success: true, data: rec });
}));

router.post('/attendance/clock-out', authenticateToken, asyncHandler(async (req, res) => {
  const empId = req.body.employee_id || req.user.employee_id;
  if (!empId) return res.status(400).json({ success: false, message: 'Employee ID required' });
  const rec = await attendanceService.clockOut(empId);
  res.json({ success: true, data: rec });
}));

router.put('/attendance/:id/correct', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const corrected = await attendanceService.correctAttendance(req.params.id, {
    ...req.body,
    corrected_by: req.user.name
  });
  res.json({ success: true, data: corrected });
}));

// ==========================================
// 7. TIME OFF
// ==========================================

router.get('/time-off/types', asyncHandler(async (_req, res) => {
  const types = await timeOffService.getTimeOffTypes();
  res.json({ success: true, data: types });
}));

router.get('/time-off/allocations', asyncHandler(async (req, res) => {
  const allocs = await timeOffService.getAllocations(req.query.employee_id);
  res.json({ success: true, data: allocs });
}));

router.get('/time-off/requests', asyncHandler(async (req, res) => {
  const requests = await timeOffService.getRequests(req.query);
  res.json({ success: true, data: requests });
}));

router.post('/time-off/requests', authenticateToken, asyncHandler(async (req, res) => {
  const empId = req.body.employee_id || req.user.employee_id;
  const request = await timeOffService.createRequest({ ...req.body, employee_id: empId });
  res.status(201).json({ success: true, data: request });
}));

router.put('/time-off/requests/:id/approve', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const approved = await timeOffService.approveRequest(req.params.id, req.user.name);
  res.json({ success: true, data: approved });
}));

router.put('/time-off/requests/:id/refuse', authenticateToken, requireRole(['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const refused = await timeOffService.refuseRequest(req.params.id, req.user.name);
  res.json({ success: true, data: refused });
}));

// ==========================================
// 8. SALARY STRUCTURES & RULES
// ==========================================

router.get('/salary/structures', asyncHandler(async (_req, res) => {
  const structures = await salaryService.getSalaryStructures();
  res.json({ success: true, data: structures });
}));

router.get('/salary/structures/:id', asyncHandler(async (req, res) => {
  const structure = await salaryService.getSalaryStructureById(req.params.id);
  res.json({ success: true, data: structure });
}));

router.post('/salary/structures', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const struct = await salaryService.createSalaryStructure(req.body);
  res.status(201).json({ success: true, data: struct });
}));

router.get('/salary/rules', asyncHandler(async (req, res) => {
  const rules = await salaryService.getSalaryRules(req.query.salary_structure_id);
  res.json({ success: true, data: rules });
}));

router.post('/salary/rules', authenticateToken, requireRole(['hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const rule = await salaryService.createSalaryRule(req.body);
  res.status(201).json({ success: true, data: rule });
}));

// ==========================================
// 9. PAYRUNS & PAYSLIPS
// ==========================================

// Step 2 Wizard Eligible Employees
router.get('/payruns/eligible-employees', asyncHandler(async (req, res) => {
  const { salary_structure_id, period_start, period_end } = req.query;
  const employees = await payrollService.getEligibleEmployees(salary_structure_id, period_start, period_end);
  res.json({ success: true, data: employees });
}));

router.get('/payruns', asyncHandler(async (_req, res) => {
  const payruns = await payrollService.getPayruns();
  res.json({ success: true, data: payruns });
}));

router.get('/payruns/:id', asyncHandler(async (req, res) => {
  const payrun = await payrollService.getPayrunById(req.params.id);
  res.json({ success: true, data: payrun });
}));

router.post('/payruns', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const payrun = await payrollService.createPayrun(req.body);
  res.status(201).json({ success: true, data: payrun });
}));

router.post('/payruns/:id/compute', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const computed = await payrollService.computePayrun(req.params.id);
  res.json({ success: true, data: computed });
}));

router.put('/payruns/:id/status', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const updated = await payrollService.updatePayrunStatus(req.params.id, req.body.status);
  res.json({ success: true, data: updated });
}));

// Bulk Email Delivery
router.post('/payruns/:id/send-payslips', authenticateToken, requireRole(['hr_payroll_user', 'hr_payroll_manager', 'admin']), asyncHandler(async (req, res) => {
  const result = await emailService.sendBulkPayslips(req.params.id);
  res.json({ success: true, data: result });
}));

// PDF Payslip Download
router.get('/payslips/:id/pdf', asyncHandler(async (req, res) => {
  const pdfBuffer = await pdfService.generatePayslipPDF(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=payslip-${req.params.id}.pdf`);
  res.send(pdfBuffer);
}));

module.exports = router;
