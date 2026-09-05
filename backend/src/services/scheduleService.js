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

async function getSchedules() {
  return await sql`
    SELECT ws.*, (SELECT count(*)::int FROM employees e WHERE e.schedule_id = ws.id) as employee_count
    FROM working_schedules ws
    ORDER BY ws.id ASC
  `;
}

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

module.exports = { getSchedules, createSchedule, calculateWeeklyHours };
