const { sql } = require('../db');

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

// Create time off request
async function createRequest(data) {
  const { employee_id, time_off_type_id, start_date, end_date, duration, reason } = data;

  // Check type allocation requirement
  const types = await sql`SELECT * FROM time_off_types WHERE id = ${time_off_type_id}`;
  if (types.length > 0 && types[0].requires_allocation) {
    const allocations = await sql`
      SELECT * FROM time_off_allocations
      WHERE employee_id = ${employee_id} AND time_off_type_id = ${time_off_type_id} AND status = 'Approved'
      ORDER BY id DESC LIMIT 1
    `;
    if (allocations.length === 0 || parseFloat(allocations[0].remaining_days) < parseFloat(duration)) {
      const err = new Error(`Insufficient leave balance. Available: ${allocations.length > 0 ? allocations[0].remaining_days : 0} days.`);
      err.status = 400;
      throw err;
    }
  }

  const [req] = await sql`
    INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, reason)
    VALUES (${employee_id}, ${time_off_type_id}, ${start_date}, ${end_date}, ${duration}, 'Pending', ${reason || ''})
    RETURNING *
  `;
  return req;
}

// Approve time off request and update allocation balance
async function approveRequest(id, approverName = 'HR Manager') {
  const requests = await sql`
    SELECT tor.*, tot.requires_allocation
    FROM time_off_requests tor
    JOIN time_off_types tot ON tor.time_off_type_id = tot.id
    WHERE tor.id = ${id}
  `;

  if (requests.length === 0) throw new Error('Time Off Request not found');
  const req = requests[0];

  if (req.status !== 'Pending') {
    throw new Error(`Cannot approve request in status '${req.status}'`);
  }

  if (req.requires_allocation) {
    const allocations = await sql`
      SELECT * FROM time_off_allocations
      WHERE employee_id = ${req.employee_id} 
        AND time_off_type_id = ${req.time_off_type_id}
        AND status = 'Approved'
      ORDER BY id DESC
      LIMIT 1
    `;

    if (allocations.length > 0) {
      const alloc = allocations[0];
      const newTaken = parseFloat(alloc.taken_days) + parseFloat(req.duration);
      const newRemaining = Math.max(0, parseFloat(alloc.allocated_days) - newTaken);

      await sql`
        UPDATE time_off_allocations SET
          taken_days = ${newTaken},
          remaining_days = ${newRemaining}
        WHERE id = ${alloc.id}
      `;
    }
  }

  const [updated] = await sql`
    UPDATE time_off_requests SET
      status = 'Approved',
      approved_by = ${approverName}
    WHERE id = ${id}
    RETURNING *
  `;

  return updated;
}

// Refuse time off request
async function refuseRequest(id, approverName = 'HR Manager') {
  const [updated] = await sql`
    UPDATE time_off_requests SET
      status = 'Refused',
      approved_by = ${approverName}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete time off request
async function deleteRequest(id) {
  const cleanId = parseInt(id, 10);
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
