// Central Date and Time Formatter Utilities for PeoplePay360
// Mandatory display format: DD-MM-YYYY (e.g. 05-09-2026) and 12-hour formatted time (e.g. 09:00 AM)

export function formatDate(value) {
  if (!value && value !== 0) return '-';

  // If already in DD-MM-YYYY format
  if (typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value.trim())) {
    return value.trim();
  }

  // If Date instance
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '-';
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // If object with nested date fields
  if (typeof value === 'object') {
    if (value.date) return formatDate(value.date);
    if (value.start_date) return formatDate(value.start_date);
    if (value.period_start) return formatDate(value.period_start);
    if (value.start) return formatDate(value.start);
    if (value.end_date) return formatDate(value.end_date);
    if (value.created_at) return formatDate(value.created_at);
    const s = String(value);
    if (s && s !== '[object Object]') return formatDate(s);
    return '-';
  }

  const str = String(value).trim();
  if (str === '-' || str === 'N/A' || str === 'Present' || str === 'Ongoing' || str === 'null' || str === 'undefined' || str === '[object Object]') {
    return str === 'null' || str === 'undefined' || str === '[object Object]' ? '-' : str;
  }

  // Date-only string YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }

  // ISO string or full datetime
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Fallback regex match for any string starting with YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const datePart = str.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  return str;
}

export function formatTime(value) {
  if (!value && value !== 0) return '-';

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '-';
    return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  if (typeof value === 'object') {
    if (value.time) return formatTime(value.time);
    if (value.check_in) return formatTime(value.check_in);
    if (value.check_out) return formatTime(value.check_out);
    if (value.hours !== undefined) {
      const h = String(value.hours).padStart(2, '0');
      const m = String(value.minutes || 0).padStart(2, '0');
      return `${h}:${m}`;
    }
    return '-';
  }

  const str = String(value).trim();
  if (str === '-' || str === 'N/A' || str === 'null' || str === 'undefined' || str === '[object Object]') {
    return '-';
  }

  // Time format HH:mm or HH:mm:ss
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parts[1].padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${minute} ${ampm}`;
  }

  // ISO timestamp or full date string
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return str;
}
