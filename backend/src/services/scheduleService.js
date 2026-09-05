const { sql } = require('../db');

function calculateHours(start, end, breakTime) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  
  if (breakTime) {
    const [bh, bm] = breakTime.split(':').map(Number);
    totalMinutes -= (bh * 60 + bm);
  }
  return Math.max(0, totalMinutes / 60);
}

function calculateWeeklyHours(data) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let weekly = 0;
  for (const day of days) {
    weekly += calculateHours(data[`${day}_start`], data[`${day}_end`], data[`${day}_break`]);
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

// Create working schedule
async function createSchedule(data) {
  const weeklyHours = calculateWeeklyHours(data);
  const {
    name, schedule_type,
    monday_start, monday_end, monday_break,
    tuesday_start, tuesday_end, tuesday_break,
    wednesday_start, wednesday_end, wednesday_break,
    thursday_start, thursday_end, thursday_break,
    friday_start, friday_end, friday_break,
    saturday_start, saturday_end, saturday_break,
    sunday_start, sunday_end, sunday_break
  } = data;

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
      ${name}, ${schedule_type || 'Full Time'},
      ${monday_start || '09:00'}, ${monday_end || '18:00'}, ${monday_break || '01:00'},
      ${tuesday_start || '09:00'}, ${tuesday_end || '18:00'}, ${tuesday_break || '01:00'},
      ${wednesday_start || '09:00'}, ${wednesday_end || '18:00'}, ${wednesday_break || '01:00'},
      ${thursday_start || '09:00'}, ${thursday_end || '18:00'}, ${thursday_break || '01:00'},
      ${friday_start || '09:00'}, ${friday_end || '18:00'}, ${friday_break || '01:00'},
      ${saturday_start || ''}, ${saturday_end || ''}, ${saturday_break || ''},
      ${sunday_start || ''}, ${sunday_end || ''}, ${sunday_break || ''},
      ${weeklyHours}
    )
    RETURNING *
  `;
  return sched;
}

// Update working schedule
async function updateSchedule(id, data) {
  const weeklyHours = calculateWeeklyHours(data);
  const {
    name, schedule_type,
    monday_start, monday_end, monday_break,
    tuesday_start, tuesday_end, tuesday_break,
    wednesday_start, wednesday_end, wednesday_break,
    thursday_start, thursday_end, thursday_break,
    friday_start, friday_end, friday_break,
    saturday_start, saturday_end, saturday_break,
    sunday_start, sunday_end, sunday_break
  } = data;

  const [updated] = await sql`
    UPDATE working_schedules SET
      name = ${name},
      schedule_type = ${schedule_type || 'Full Time'},
      monday_start = ${monday_start || ''}, monday_end = ${monday_end || ''}, monday_break = ${monday_break || ''},
      tuesday_start = ${tuesday_start || ''}, tuesday_end = ${tuesday_end || ''}, tuesday_break = ${tuesday_break || ''},
      wednesday_start = ${wednesday_start || ''}, wednesday_end = ${wednesday_end || ''}, wednesday_break = ${wednesday_break || ''},
      thursday_start = ${thursday_start || ''}, thursday_end = ${thursday_end || ''}, thursday_break = ${thursday_break || ''},
      friday_start = ${friday_start || ''}, friday_end = ${friday_end || ''}, friday_break = ${friday_break || ''},
      saturday_start = ${saturday_start || ''}, saturday_end = ${saturday_end || ''}, saturday_break = ${saturday_break || ''},
      sunday_start = ${sunday_start || ''}, sunday_end = ${sunday_end || ''}, sunday_break = ${sunday_break || ''},
      weekly_hours = ${weeklyHours}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete working schedule
async function deleteSchedule(id) {
  // Unassign from employees first
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
  calculateWeeklyHours
};
