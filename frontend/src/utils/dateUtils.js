/**
 * Central Date Formatter Utility for PeoplePay360
 * Mandatory format: DD-MM-YYYY (e.g. 05-09-2026)
 */

export function formatDate(value) {
  if (!value) return '-';

  const str = String(value).trim();
  if (str === '-' || str === 'N/A' || str === 'Present' || str === 'Ongoing') {
    return str;
  }

  // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const datePart = str.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) return str;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

export function formatTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);

  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
