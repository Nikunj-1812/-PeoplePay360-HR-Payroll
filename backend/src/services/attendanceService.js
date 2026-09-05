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
  const cleanId = parseInt(employeeId, 10);
  if (!cleanId || isNaN(cleanId)) throw new Error('Valid employee ID required for Check In');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const nowISO = now.toISOString();

  const existing = await sql`
    SELECT * FROM attendance 
    WHERE employee_id = ${cleanId} 
      AND (date = ${todayStr}::date OR (check_in IS NOT NULL AND check_in::date = ${todayStr}::date))
    ORDER BY id DESC
  `;

  if (existing.length > 0) {
    const rec = existing[0];
    if (rec.check_in && !rec.check_out) {
      const err = new Error('You are already checked in for today.');
      err.status = 400;
      throw err;
    }
    if (rec.check_in && rec.check_out) {
      const err = new Error('You have already completed attendance for today.');
      err.status = 400;
      throw err;
    }
  }

  const [rec] = await sql`
    INSERT INTO attendance (employee_id, date, check_in, status)
    VALUES (${cleanId}, ${todayStr}, ${nowISO}, 'Present')
    RETURNING *
  `;
  return rec;
}

async function clockOut(employeeId) {
  const cleanId = parseInt(employeeId, 10);
  if (!cleanId || isNaN(cleanId)) throw new Error('Valid employee ID required for Check Out');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const nowISO = now.toISOString();

  const existing = await sql`
    SELECT * FROM attendance 
    WHERE employee_id = ${cleanId} 
      AND check_in IS NOT NULL
      AND check_out IS NULL
      AND (date = ${todayStr}::date OR (check_in IS NOT NULL AND check_in::date = ${todayStr}::date))
    ORDER BY id DESC
  `;

  if (existing.length === 0) {
    const err = new Error('No active Check In found for today. Please Check In first.');
    err.status = 400;
    throw err;
  }

  const rec = existing[0];
  let checkInTime = rec.check_in ? new Date(rec.check_in).getTime() : Date.now();
  if (isNaN(checkInTime)) checkInTime = Date.now() - (8 * 3600 * 1000);
  const checkOutTime = Date.now();
  let workedHours = Math.max(0.01, parseFloat(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2)));

  const [updated] = await sql`
    UPDATE attendance SET
      check_out = ${nowISO},
      worked_hours = ${workedHours},
      status = 'Present'
    WHERE id = ${rec.id}
    RETURNING *
  `;
  return updated;
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

async function deleteAttendance(id) {
  const cleanId = parseInt(id, 10);
  const [deleted] = await sql`DELETE FROM attendance WHERE id = ${cleanId} RETURNING *`;
  return deleted;
}

module.exports = { getAttendance, clockIn, clockOut, correctAttendance, deleteAttendance };
