// Format date to YYYY-MM-DD
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today as YYYY-MM-DD
export function today() {
  return formatDate(new Date());
}

// Add N calendar days to a date
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Get ISO day of week (1=Mon ... 7=Sun)
export function isoWeekday(date) {
  const day = new Date(date).getDay(); // 0=Sun
  return day === 0 ? 7 : day;
}

// Check if date is a working day based on workingDays array
export function isWorkingDay(date, workingDays = [1, 2, 3, 4, 5]) {
  return workingDays.includes(isoWeekday(date));
}

// Parse ISO date string to Date object
export function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

// Get current ISO datetime
export function nowISO() {
  return new Date().toISOString();
}

// Days between two dates
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}
