const { sql } = require('../db');

async function getTimeOffTypes() {
  return await sql`SELECT * FROM time_off_types ORDER BY id ASC`;
}

async function getAllocations(employeeId = null) {
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
    WHERE (${employeeId ? parseInt(employeeId, 10) : null}::int IS NULL OR toa.employee_id = ${employeeId ? parseInt(employeeId, 10) : null})
    ORDER BY toa.id DESC
  `;
}

async function getRequests(filters = {}) {
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
    WHERE (${filters.employee_id ? parseInt(filters.employee_id, 10) : null}::int IS NULL OR tor.employee_id = ${filters.employee_id ? parseInt(filters.employee_id, 10) : null})
      AND (${filters.status || null}::text IS NULL OR tor.status = ${filters.status || null})
    ORDER BY tor.id DESC
  `;
}

async function createRequest(data) {
  const { employee_id, time_off_type_id, start_date, end_date, duration, reason } = data;

  const [req] = await sql`
    INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, reason)
    VALUES (${employee_id}, ${time_off_type_id}, ${start_date}, ${end_date}, ${duration}, 'Pending', ${reason || ''})
    RETURNING *
  `;
  return req;
}

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

module.exports = { getTimeOffTypes, getAllocations, getRequests, createRequest, approveRequest, refuseRequest };
