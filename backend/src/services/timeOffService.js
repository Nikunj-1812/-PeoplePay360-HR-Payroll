const { sql } = require('../db');
const notificationService = require('./notificationService');

// Get time off types
async function getTimeOffTypes() {
  return await sql`SELECT * FROM time_off_types ORDER BY id ASC`;
}

// Create time off type
async function createTimeOffType(data) {
  const { name, unit, requires_allocation, approval_workflow, payroll_integration } = data;
  const [created] = await sql`
    INSERT INTO time_off_types (name, unit, requires_allocation, approval_workflow, payroll_integration)
    VALUES (${name}, ${unit || 'days'}, ${requires_allocation !== false}, ${approval_workflow || 'Manager'}, ${payroll_integration !== false})
    RETURNING *
  `;
  return created;
}

// Update time off type
async function updateTimeOffType(id, data) {
  const { name, unit, requires_allocation, approval_workflow, payroll_integration } = data;
  const [updated] = await sql`
    UPDATE time_off_types SET
      name = ${name},
      unit = ${unit || 'days'},
      requires_allocation = ${requires_allocation !== false},
      approval_workflow = ${approval_workflow || 'Manager'},
      payroll_integration = ${payroll_integration !== false}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete time off type
async function deleteTimeOffType(id) {
  const [deleted] = await sql`DELETE FROM time_off_types WHERE id = ${id} RETURNING *`;
  return deleted;
}

// Get allocations
async function getAllocations(employeeId = null) {
  const cleanEmpId = employeeId && !isNaN(employeeId) ? parseInt(employeeId, 10) : null;
  return await sql`
    SELECT 
      toa.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id,
      tot.name as type_name,
      tot.unit
    FROM time_off_allocations toa
    JOIN employees e ON toa.employee_id = e.id
    JOIN time_off_types tot ON toa.time_off_type_id = tot.id
    WHERE (${cleanEmpId}::int IS NULL OR toa.employee_id = ${cleanEmpId})
    ORDER BY toa.id DESC
  `;
}

// Create allocation
async function createAllocation(data) {
  const { employee_id, time_off_type_id, allocated_days, validity_start, validity_end } = data;
  const days = parseFloat(allocated_days) || 0;

  const [alloc] = await sql`
    INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_days, taken_days, remaining_days, status, validity_start, validity_end)
    VALUES (${employee_id}, ${time_off_type_id}, ${days}, 0, ${days}, 'Approved', ${validity_start || '2026-01-01'}, ${validity_end || '2026-12-31'})
    RETURNING *
  `;
  return alloc;
}

// Update allocation
async function updateAllocation(id, data) {
  const { allocated_days, taken_days, validity_start, validity_end, status } = data;
  const allocDays = parseFloat(allocated_days) || 0;
  const takenDays = parseFloat(taken_days) || 0;
  const remDays = Math.max(0, allocDays - takenDays);

  const [updated] = await sql`
    UPDATE time_off_allocations SET
      allocated_days = ${allocDays},
      taken_days = ${takenDays},
      remaining_days = ${remDays},
      validity_start = ${validity_start || '2026-01-01'},
      validity_end = ${validity_end || '2026-12-31'},
      status = ${status || 'Approved'}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete allocation
async function deleteAllocation(id) {
  const [deleted] = await sql`DELETE FROM time_off_allocations WHERE id = ${id} RETURNING *`;
  return deleted;
}

// Get time off requests
async function getRequests(filters = {}) {
  const cleanEmpId = filters.employee_id && !isNaN(filters.employee_id) ? parseInt(filters.employee_id, 10) : null;
  const cleanStatus = filters.status || null;
  return await sql`
    SELECT 
      tor.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id,
      d.name as department_name,
      tot.name as type_name,
      tot.unit,
      tot.requires_allocation
    FROM time_off_requests tor
    JOIN employees e ON tor.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    WHERE (${cleanEmpId}::int IS NULL OR tor.employee_id = ${cleanEmpId})
      AND (${cleanStatus}::text IS NULL OR tor.status = ${cleanStatus})
    ORDER BY tor.id DESC
  `;
}

// Helper to calculate & validate multi-allocation requirements across validity periods
async function resolveAllocationDeductions(employeeId, timeOffTypeId, startDateStr, endDateStr, reqDuration, leaveTypeName) {
  const allocations = await sql`
    SELECT * FROM time_off_allocations
    WHERE employee_id = ${employeeId} 
      AND time_off_type_id = ${timeOffTypeId} 
      AND status = 'Approved'
    ORDER BY validity_start ASC, id ASC
  `;

  if (allocations.length === 0) {
    const err = new Error(`No active allocation found for '${leaveTypeName}'. Please request an allocation first.`);
    err.status = 400;
    throw err;
  }

  // Build array of dates in the requested leave range
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const dates = [];
  const curr = new Date(start);
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const totalCalendarDays = dates.length || 1;
  const dayWeight = reqDuration / totalCalendarDays;
  const allocDeductionMap = new Map(); // allocId -> { alloc, neededDays }

  for (const dayStr of dates) {
    const matchingAlloc = allocations.find(a => {
      const vStart = a.validity_start ? new Date(a.validity_start).toISOString().split('T')[0] : '1970-01-01';
      const vEnd = a.validity_end ? new Date(a.validity_end).toISOString().split('T')[0] : '9999-12-31';
      return dayStr >= vStart && dayStr <= vEnd;
    }) || allocations[0]; // fallback to first available allocation if boundary open

    const existing = allocDeductionMap.get(matchingAlloc.id) || { alloc: matchingAlloc, neededDays: 0 };
    existing.neededDays += dayWeight;
    allocDeductionMap.set(matchingAlloc.id, existing);
  }

  // Validate balance for each required allocation
  const deductions = [];
  for (const [allocId, item] of allocDeductionMap.entries()) {
    const needed = parseFloat(item.neededDays.toFixed(2));
    const available = parseFloat(item.alloc.remaining_days || 0);

    if (available < needed) {
      const vStart = item.alloc.validity_start ? new Date(item.alloc.validity_start).toISOString().split('T')[0] : 'Period Start';
      const vEnd = item.alloc.validity_end ? new Date(item.alloc.validity_end).toISOString().split('T')[0] : 'Period End';
      const err = new Error(
        `Insufficient leave balance for '${leaveTypeName}'. Allocation period (${vStart} to ${vEnd}) requires ${needed} day(s), but available remaining balance is only ${available} day(s).`
      );
      err.status = 400;
      throw err;
    }

    deductions.push({
      alloc: item.alloc,
      deductAmount: needed
    });
  }

  return deductions;
}

// Create time off request
async function createRequest(data) {
  const { employee_id, time_off_type_id, start_date, end_date, duration, reason } = data;
  
  // Edge Case #6 Guard: Validate numeric duration & reject <= 0 / NaN / non-numeric
  let reqDuration = parseFloat(duration);
  if (isNaN(reqDuration)) {
    if (start_date && end_date) {
      const s = new Date(start_date);
      const e = new Date(end_date);
      const diffTime = e.getTime() - s.getTime();
      if (diffTime < 0) {
        const err = new Error('End date cannot be earlier than start date.');
        err.status = 400;
        throw err;
      }
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      reqDuration = diffDays;
    } else {
      reqDuration = 1.0;
    }
  }

  if (isNaN(reqDuration) || reqDuration <= 0) {
    const err = new Error('Leave duration must be greater than 0 days.');
    err.status = 400;
    throw err;
  }

  // Check type allocation requirement
  const types = await sql`SELECT * FROM time_off_types WHERE id = ${time_off_type_id}`;
  if (types.length === 0) {
    const err = new Error('Invalid Time Off Type selected.');
    err.status = 400;
    throw err;
  }

  const leaveType = types[0];

  if (leaveType.requires_allocation) {
    await resolveAllocationDeductions(
      employee_id,
      time_off_type_id,
      start_date,
      end_date,
      reqDuration,
      leaveType.name
    );
  }

  const [req] = await sql`
    INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, reason)
    VALUES (${employee_id}, ${time_off_type_id}, ${start_date}, ${end_date}, ${reqDuration}, 'Pending', ${reason || ''})
    RETURNING *
  `;

  // Notify HR Managers & Admins
  try {
    const [emp] = await sql`SELECT first_name, last_name FROM employees WHERE id = ${employee_id}`;
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : `Employee #${employee_id}`;
    await notificationService.notifyRoles(['admin', 'hr_manager', 'hr_payroll_manager'], {
      title: 'New Leave Request',
      message: `${empName} requested ${reqDuration} day(s) of leave (${leaveType.name}).`,
      type: 'leave',
      link_tab: 'time-off'
    });
  } catch (err) {
    console.error('Notification trigger error:', err);
  }

  return req;
}

// Approve time off request and auto-deduct allocation balance across multiple validity periods transactionally
async function approveRequest(id, approverName = 'HR Manager') {
  const requests = await sql`
    SELECT tor.*, tot.requires_allocation, tot.name as type_name
    FROM time_off_requests tor
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    WHERE tor.id = ${id}
  `;

  if (requests.length === 0) throw new Error('Time Off Request not found');
  const req = requests[0];

  // Prevent double deduction
  if (req.status === 'Approved') {
    const err = new Error('This time off request has already been approved.');
    err.status = 400;
    throw err;
  }

  if (req.status !== 'Pending') {
    const err = new Error(`Cannot approve request in status '${req.status}'. Only Pending requests can be approved.`);
    err.status = 400;
    throw err;
  }

  const reqDuration = parseFloat(req.duration) || 0;

  if (req.requires_allocation) {
    const deductions = await resolveAllocationDeductions(
      req.employee_id,
      req.time_off_type_id,
      req.start_date,
      req.end_date,
      reqDuration,
      req.type_name
    );

    // Apply allocation deductions sequentially / transactionally
    for (const item of deductions) {
      const alloc = item.alloc;
      const newTaken = parseFloat((parseFloat(alloc.taken_days) + item.deductAmount).toFixed(2));
      const newRemaining = Math.max(0, parseFloat((parseFloat(alloc.allocated_days) - newTaken).toFixed(2)));

      await sql`
        UPDATE time_off_allocations SET
          taken_days = ${newTaken},
          remaining_days = ${newRemaining}
        WHERE id = ${alloc.id}
      `;
    }
  }

  // Update request status to Approved
  const [updated] = await sql`
    UPDATE time_off_requests SET
      status = 'Approved',
      approved_by = ${approverName}
    WHERE id = ${id}
    RETURNING *
  `;

  // Notify Employee
  try {
    await notificationService.notifyEmployeeUser(req.employee_id, {
      title: 'Leave Request Approved',
      message: `Your leave request for ${reqDuration} day(s) was APPROVED by ${approverName}.`,
      type: 'leave',
      link_tab: 'time-off'
    });
  } catch (err) {
    console.error('Notification trigger error:', err);
  }

  return updated;
}

// Refuse time off request and restore allocation if previously approved
async function refuseRequest(id, approverName = 'HR Manager') {
  const requests = await sql`
    SELECT tor.*, tot.requires_allocation, tot.name as type_name
    FROM time_off_requests tor
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    WHERE tor.id = ${id}
  `;

  if (requests.length === 0) throw new Error('Time Off Request not found');
  const req = requests[0];
  const wasApproved = req.status === 'Approved';
  const reqDuration = parseFloat(req.duration) || 0;

  // Restore allocation if it was previously deducted
  if (wasApproved && req.requires_allocation) {
    const allocations = await sql`
      SELECT * FROM time_off_allocations
      WHERE employee_id = ${req.employee_id} 
        AND time_off_type_id = ${req.time_off_type_id}
        AND status = 'Approved'
      ORDER BY validity_start ASC, id ASC
    `;

    if (allocations.length > 0) {
      // Restore from latest allocation backwards
      let remainingToRestore = reqDuration;
      for (let i = allocations.length - 1; i >= 0 && remainingToRestore > 0; i--) {
        const alloc = allocations[i];
        const currentTaken = parseFloat(alloc.taken_days || 0);
        const restoreAmount = Math.min(currentTaken, remainingToRestore);
        if (restoreAmount > 0) {
          const newTaken = parseFloat((currentTaken - restoreAmount).toFixed(2));
          const newRemaining = Math.max(0, parseFloat((parseFloat(alloc.allocated_days) - newTaken).toFixed(2)));
          await sql`
            UPDATE time_off_allocations SET
              taken_days = ${newTaken},
              remaining_days = ${newRemaining}
            WHERE id = ${alloc.id}
          `;
          remainingToRestore -= restoreAmount;
        }
      }
    }
  }

  const [updated] = await sql`
    UPDATE time_off_requests SET
      status = 'Refused',
      approved_by = ${approverName}
    WHERE id = ${id}
    RETURNING *
  `;

  // Notify Employee
  try {
    if (updated) {
      await notificationService.notifyEmployeeUser(updated.employee_id, {
        title: 'Leave Request Refused',
        message: `Your leave request for ${reqDuration} day(s) was REFUSED by ${approverName}.`,
        type: 'leave',
        link_tab: 'time-off'
      });
    }
  } catch (err) {
    console.error('Notification trigger error:', err);
  }

  return updated;
}

// Delete time off request and restore allocation if previously approved
async function deleteRequest(id) {
  const cleanId = parseInt(id, 10);
  const requests = await sql`
    SELECT tor.*, tot.requires_allocation
    FROM time_off_requests tor
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    WHERE tor.id = ${cleanId}
  `;

  if (requests.length > 0) {
    const req = requests[0];
    if (req.status === 'Approved' && req.requires_allocation) {
      const reqDuration = parseFloat(req.duration) || 0;
      const allocations = await sql`
        SELECT * FROM time_off_allocations
        WHERE employee_id = ${req.employee_id} 
          AND time_off_type_id = ${req.time_off_type_id}
          AND status = 'Approved'
        ORDER BY validity_start ASC, id ASC
      `;
      let remainingToRestore = reqDuration;
      for (let i = allocations.length - 1; i >= 0 && remainingToRestore > 0; i--) {
        const alloc = allocations[i];
        const currentTaken = parseFloat(alloc.taken_days || 0);
        const restoreAmount = Math.min(currentTaken, remainingToRestore);
        if (restoreAmount > 0) {
          const newTaken = parseFloat((currentTaken - restoreAmount).toFixed(2));
          const newRemaining = Math.max(0, parseFloat((parseFloat(alloc.allocated_days) - newTaken).toFixed(2)));
          await sql`
            UPDATE time_off_allocations SET
              taken_days = ${newTaken},
              remaining_days = ${newRemaining}
            WHERE id = ${alloc.id}
          `;
          remainingToRestore -= restoreAmount;
        }
      }
    }
  }

  const [deleted] = await sql`DELETE FROM time_off_requests WHERE id = ${cleanId} RETURNING *`;
  return deleted;
}

module.exports = {
  getTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  getAllocations,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getRequests,
  createRequest,
  approveRequest,
  refuseRequest,
  deleteRequest
};
