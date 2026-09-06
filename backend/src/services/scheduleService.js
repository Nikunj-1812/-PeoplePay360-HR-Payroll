const { sql } = require('../db');

/**
 * Normalizes time string into strict HH:mm format (00:00 to 23:59)
 */
function normalizeHHMM(val) {
  if (!val || typeof val !== 'string' || !val.trim()) return '';
  const trimmed = val.trim();
  const parts = trimmed.split(':');
  if (parts.length !== 2) return '';

  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return '';
  }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates shift worked hours supporting standard and overnight shifts (e.g. 22:00 to 06:00)
 */
function calculateHours(start, end, breakTime) {
  const normStart = normalizeHHMM(start);
  const normEnd = normalizeHHMM(end);
  if (!normStart || !normEnd) return 0;

  const [sh, sm] = normStart.split(':').map(Number);
  const [eh, em] = normEnd.split(':').map(Number);

  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;

  // Overnight shift support: if end <= start, add 24 hours (1440 mins)
  if (endMins <= startMins) {
    endMins += 24 * 60;
  }

  let totalMinutes = endMins - startMins;

  const normBreak = normalizeHHMM(breakTime);
  if (normBreak) {
    const [bh, bm] = normBreak.split(':').map(Number);
    totalMinutes -= (bh * 60 + bm);
  }

  return Math.max(0, totalMinutes / 60);
}

function calculateWeeklyHours(data) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let weekly = 0;
  for (const day of days) {
    const start = normalizeHHMM(data[`${day}_start`]);
    const end = normalizeHHMM(data[`${day}_end`]);
    const brk = normalizeHHMM(data[`${day}_break`]);

    if (start && end) {
      weekly += calculateHours(start, end, brk);
    }
  }
  return parseFloat(weekly.toFixed(2));
}

// Get all working schedules
async function getSchedules() {
  return await sql`
    SELECT ws.*, (SELECT count(*)::int FROM employees e WHERE e.schedule_id = ws.id) as employee_count
    FROM working_schedules ws
    ORDER BY ws.id ASC
  `;
}

// Get schedule by ID
async function getScheduleById(id) {
  const scheds = await sql`SELECT * FROM working_schedules WHERE id = ${id}`;
  if (scheds.length === 0) throw new Error('Working schedule not found');
  return scheds[0];
}

// Extract & normalize day pattern fields
function extractNormalizedScheduleData(data) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const normalized = {
    name: data.name ? String(data.name).trim() : '',
    schedule_type: data.schedule_type || 'Full Time'
  };

  if (!normalized.name) {
    const err = new Error('Working schedule name is required.');
    err.status = 400;
    throw err;
  }

  let activeDaysCount = 0;

  for (const d of days) {
    const rawStart = data[`${d}_start`];
    const rawEnd = data[`${d}_end`];
    const rawBreak = data[`${d}_break`];

    if (rawStart && !normalizeHHMM(rawStart)) {
      const err = new Error(`Invalid time format for ${d} start time. Expected valid HH:mm (00:00 to 23:59).`);
      err.status = 400;
      throw err;
    }
    if (rawEnd && !normalizeHHMM(rawEnd)) {
      const err = new Error(`Invalid time format for ${d} end time. Expected valid HH:mm (00:00 to 23:59).`);
      err.status = 400;
      throw err;
    }
    if (rawBreak && !normalizeHHMM(rawBreak)) {
      const err = new Error(`Invalid time format for ${d} break time. Expected valid HH:mm (00:00 to 23:59).`);
      err.status = 400;
      throw err;
    }

    const nStart = normalizeHHMM(rawStart);
    const nEnd = normalizeHHMM(rawEnd);
    const nBreak = normalizeHHMM(rawBreak);

    if ((nStart && !nEnd) || (!nStart && nEnd)) {
      const err = new Error(`Both start and end time must be specified for ${d}.`);
      err.status = 400;
      throw err;
    }

    if (nStart && nEnd) {
      activeDaysCount += 1;
    }

    normalized[`${d}_start`] = nStart;
    normalized[`${d}_end`] = nEnd;
    normalized[`${d}_break`] = nBreak;
  }

  // Edge Case #7 Guard: Reject schedule if 0 working days are enabled
  if (activeDaysCount === 0) {
    const err = new Error('A working schedule must contain at least one valid working day.');
    err.status = 400;
    throw err;
  }

  return normalized;
}

// Create working schedule
async function createSchedule(data) {
  const norm = extractNormalizedScheduleData(data);
  const weeklyHours = calculateWeeklyHours(norm);

  const [sched] = await sql`
    INSERT INTO working_schedules (
      name, schedule_type,
      monday_start, monday_end, monday_break,
      tuesday_start, tuesday_end, tuesday_break,
      wednesday_start, wednesday_end, wednesday_break,
      thursday_start, thursday_end, thursday_break,
      friday_start, friday_end, friday_break,
      saturday_start, saturday_end, saturday_break,
      sunday_start, sunday_end, sunday_break,
      weekly_hours
    ) VALUES (
      ${norm.name}, ${norm.schedule_type},
      ${norm.monday_start || ''}, ${norm.monday_end || ''}, ${norm.monday_break || ''},
      ${norm.tuesday_start || ''}, ${norm.tuesday_end || ''}, ${norm.tuesday_break || ''},
      ${norm.wednesday_start || ''}, ${norm.wednesday_end || ''}, ${norm.wednesday_break || ''},
      ${norm.thursday_start || ''}, ${norm.thursday_end || ''}, ${norm.thursday_break || ''},
      ${norm.friday_start || ''}, ${norm.friday_end || ''}, ${norm.friday_break || ''},
      ${norm.saturday_start || ''}, ${norm.saturday_end || ''}, ${norm.saturday_break || ''},
      ${norm.sunday_start || ''}, ${norm.sunday_end || ''}, ${norm.sunday_break || ''},
      ${weeklyHours}
    )
    RETURNING *
  `;
  return sched;
}

// Update working schedule
async function updateSchedule(id, data) {
  const norm = extractNormalizedScheduleData(data);
  const weeklyHours = calculateWeeklyHours(norm);

  const [updated] = await sql`
    UPDATE working_schedules SET
      name = ${norm.name},
      schedule_type = ${norm.schedule_type},
      monday_start = ${norm.monday_start}, monday_end = ${norm.monday_end}, monday_break = ${norm.monday_break},
      tuesday_start = ${norm.tuesday_start}, tuesday_end = ${norm.tuesday_end}, tuesday_break = ${norm.tuesday_break},
      wednesday_start = ${norm.wednesday_start}, wednesday_end = ${norm.wednesday_end}, wednesday_break = ${norm.wednesday_break},
      thursday_start = ${norm.thursday_start}, thursday_end = ${norm.thursday_end}, thursday_break = ${norm.thursday_break},
      friday_start = ${norm.friday_start}, friday_end = ${norm.friday_end}, friday_break = ${norm.friday_break},
      saturday_start = ${norm.saturday_start}, saturday_end = ${norm.saturday_end}, saturday_break = ${norm.saturday_break},
      sunday_start = ${norm.sunday_start}, sunday_end = ${norm.sunday_end}, sunday_break = ${norm.sunday_break},
      weekly_hours = ${weeklyHours}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete working schedule
async function deleteSchedule(id) {
  await sql`UPDATE employees SET schedule_id = NULL WHERE schedule_id = ${id}`;
  const [deleted] = await sql`DELETE FROM working_schedules WHERE id = ${id} RETURNING *`;
  return deleted;
}

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  calculateWeeklyHours,
  extractNormalizedScheduleData,
  normalizeHHMM
};
