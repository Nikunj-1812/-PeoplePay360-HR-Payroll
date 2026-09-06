const { sql } = require('../db');

// Max single shift threshold (in hours) before flagging an excessive shift exception
const MAX_STANDARD_SHIFT_HOURS = 12.0;

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
      const err = new Error('You are already checked in for today. Please check out first before starting a new session.');
      err.status = 400;
      throw err;
    }
    // If previous session for today is completed (check_out is set), allow starting a new split-shift session
  }

  // Determine if late based on employee schedule (default 09:15)
  let status = 'Present';
  const hours = now.getHours();
  const minutes = now.getMinutes();
  if (hours > 9 || (hours === 9 && minutes > 15)) {
    status = 'Late';
  }

  const [rec] = await sql`
    INSERT INTO attendance (employee_id, date, check_in, status)
    VALUES (${cleanId}, ${todayStr}, ${nowISO}, ${status})
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
  const checkInTime = new Date(rec.check_in).getTime();
  const checkOutTime = now.getTime();

  // Validate checkout after check-in
  if (checkOutTime < checkInTime) {
    const err = new Error('Check Out time cannot be earlier than Check In time.');
    err.status = 400;
    throw err;
  }

  let workedHours = parseFloat(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2));
  workedHours = Math.max(0.01, workedHours);

  let status = rec.status || 'Present';
  let exceptionNote = rec.exception_note || '';

  // Flag excessive shift duration (>12h)
  if (workedHours > MAX_STANDARD_SHIFT_HOURS) {
    status = 'Overtime';
    exceptionNote = exceptionNote 
      ? `${exceptionNote} | Flagged: Excessive shift duration (${workedHours}h)`
      : `Flagged: Excessive shift duration (${workedHours}h)`;
  }

  const [updated] = await sql`
    UPDATE attendance SET
      check_out = ${nowISO},
      worked_hours = ${workedHours},
      status = ${status},
      exception_note = ${exceptionNote || null}
    WHERE id = ${rec.id}
    RETURNING *
  `;
  return updated;
}

async function correctAttendance(id, data) {
  const cleanId = parseInt(id, 10);
  const { status, check_in, check_out, worked_hours, exception_note, corrected_by } = data;

  // Validate timestamps if both check_in and check_out provided
  if (check_in && check_out) {
    const inTime = new Date(check_in).getTime();
    const outTime = new Date(check_out).getTime();

    if (isNaN(inTime) || isNaN(outTime)) {
      const err = new Error('Invalid date/time format for attendance correction.');
      err.status = 400;
      throw err;
    }

    if (outTime < inTime) {
      const err = new Error('Check Out time cannot be earlier than Check In time.');
      err.status = 400;
      throw err;
    }
  }

  let computedWorked = parseFloat(worked_hours) || 0;
  if (check_in && check_out && computedWorked === 0) {
    const inTime = new Date(check_in).getTime();
    const outTime = new Date(check_out).getTime();
    computedWorked = parseFloat(((outTime - inTime) / (1000 * 60 * 60)).toFixed(2));
  }

  let finalExceptionNote = exception_note || '';
  let finalStatus = status || 'Present';

  if (computedWorked > MAX_STANDARD_SHIFT_HOURS) {
    if (!finalExceptionNote.includes('Excessive shift')) {
      finalExceptionNote = finalExceptionNote 
        ? `${finalExceptionNote} | Flagged: Excessive shift duration (${computedWorked}h)`
        : `Flagged: Excessive shift duration (${computedWorked}h)`;
    }
    if (finalStatus === 'Present') {
      finalStatus = 'Overtime';
    }
  }

  const [updated] = await sql`
    UPDATE attendance SET
      status = ${finalStatus},
      check_in = ${check_in || null},
      check_out = ${check_out || null},
      worked_hours = ${computedWorked},
      exception_note = ${finalExceptionNote || null},
      corrected_by = ${corrected_by || 'HR Admin'}
    WHERE id = ${cleanId}
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
