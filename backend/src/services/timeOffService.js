const { sql } = require('../db');

async function getTimeOffTypes() {
  return await sql`SELECT * FROM time_off_types ORDER BY id ASC`;
}

async function getAllocations(employeeId = null) {
  let query = `
    SELECT 
      toa.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id,
      tot.name as type_name,
      tot.unit
    FROM time_off_allocations toa
    JOIN employees e ON toa.employee_id = e.id
    JOIN time_off_types tot ON toa.time_off_type_id = tot.id
  `;

  if (employeeId) {
    query += ` WHERE toa.employee_id = ${parseInt(employeeId, 10)}`;
  }
  query += ` ORDER BY toa.id DESC`;

  return await sql.unsafe(query);
}

async function getRequests(filters = {}) {
  let query = `
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
    WHERE 1=1
  `;

  if (filters.employee_id) {
    query += ` AND tor.employee_id = ${parseInt(filters.employee_id, 10)}`;
  }
  if (filters.status) {
    query += ` AND tor.status = '${filters.status}'`;
  }

  query += ` ORDER BY tor.id DESC`;

  return await sql.unsafe(query);
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
  // Fetch request & leave type info
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

  // Deduct allocation if required
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
