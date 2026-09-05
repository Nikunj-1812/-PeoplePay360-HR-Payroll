const { sql } = require('../db');

async function getAttendance(filters = {}) {
  return await sql`
    SELECT 
      a.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id,
      d.name as department_name
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE (${filters.employee_id ? parseInt(filters.employee_id, 10) : null}::int IS NULL OR a.employee_id = ${filters.employee_id ? parseInt(filters.employee_id, 10) : null})
      AND (${filters.date || null}::text IS NULL OR a.date = ${filters.date || null}::date)
      AND (${filters.status || null}::text IS NULL OR a.status = ${filters.status || null})
    ORDER BY a.date DESC, a.id DESC
  `;
}

async function clockIn(employeeId) {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowISO = new Date().toISOString();

  const existing = await sql`
    SELECT * FROM attendance WHERE employee_id = ${employeeId} AND date = ${todayStr}
  `;

  if (existing.length > 0) {
    throw new Error('Already checked in for today.');
  }

  const [rec] = await sql`
    INSERT INTO attendance (employee_id, date, check_in, status)
    VALUES (${employeeId}, ${todayStr}, ${nowISO}, 'Present')
    RETURNING *
  `;
  return rec;
}

async function clockOut(employeeId) {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowISO = new Date().toISOString();

  const existing = await sql`
    SELECT * FROM attendance WHERE employee_id = ${employeeId} AND date = ${todayStr}
  `;

  if (existing.length === 0) {
    throw new Error('You must Check In before Check Out. No check-in record found for today.');
  }

  if (existing[0].check_out) {
    throw new Error('Already checked out for today.');
  }

  const checkInTime = new Date(existing[0].check_in).getTime();
  const checkOutTime = new Date(nowISO).getTime();
  const workedHours = Math.max(0, parseFloat(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2)));

  const [rec] = await sql`
    UPDATE attendance SET
      check_out = ${nowISO},
      worked_hours = ${workedHours},
      status = 'Present'
    WHERE id = ${existing[0].id}
    RETURNING *
  `;
  return rec;
}

async function correctAttendance(id, data) {
  const { status, check_in, check_out, worked_hours, exception_note, corrected_by } = data;

  const [updated] = await sql`
    UPDATE attendance SET
      status = ${status},
      check_in = ${check_in || null},
      check_out = ${check_out || null},
      worked_hours = ${worked_hours || 0},
      exception_note = ${exception_note || ''},
      corrected_by = ${corrected_by || 'HR Admin'}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

module.exports = { getAttendance, clockIn, clockOut, correctAttendance };
