import dayjs from 'dayjs';

// Day name headers (Mon→Sun)
export const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Get all weeks for a month view. Each week = array of 7 dayjs (Mon→Sun).
 * Pads days from prev/next month to fill complete weeks.
 */
export function getWeeksInMonth(year, month) {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  // dayjs .day(): 0=Sun, 1=Mon. Convert to Mon-based: Mon=0, Sun=6
  const startDow = (firstDay.day() + 6) % 7;
  const gridStart = firstDay.subtract(startDow, 'day');

  const weeks = [];
  let cursor = gridStart;
  // Generate 6 weeks max (covers all possible month layouts)
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    // Stop if this week is entirely in the next month
    if (w >= 4 && week[0].month() + 1 !== month && week[0].isAfter(firstDay)) break;
    weeks.push(week);
  }
  return weeks;
}

/**
 * Get task bar visual style based on its state relative to today.
 * Matches DailyReminder styling: overdue=🚨 red, today=⚡ blue, done=✅ green, upcoming=gray.
 */
export function getTaskBarStyle(task, todayStr) {
  const isDone = task.status === 'done';
  const isOverdue = !isDone && task.dueDate < todayStr;
  const isToday = !isDone && !isOverdue && (task.startDate || task.dueDate) <= todayStr && task.dueDate >= todayStr;
  const fb = !!task.isFeedback;

  if (isDone) return { bg: '#f6ffed', border: '#52c41a', color: '#389e0d', emoji: '✅', isFeedback: fb };
  if (isOverdue) return { bg: '#fff2f0', border: '#ff4d4f', color: '#cf1322', emoji: '🚨', isFeedback: fb };
  if (isToday) return { bg: '#e6f4ff', border: '#1677ff', color: '#0958d9', emoji: '⚡', isFeedback: fb };
  return { bg: '#f5f5f5', border: '#d9d9d9', color: '#595959', emoji: '', isFeedback: fb };
}

/**
 * Pack tasks into visual rows to avoid vertical overlaps within a week.
 * Each task has startCol (0-6) and endCol (0-6).
 * Returns array of rows, each row = array of positioned tasks.
 */
export function packTasksIntoRows(positionedTasks) {
  // Sort by startCol, then by span descending (wider bars first)
  const sorted = [...positionedTasks].sort((a, b) =>
    a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol)
  );

  const rows = [];
  for (const task of sorted) {
    let placed = false;
    for (const row of rows) {
      // Check if task overlaps with any existing task in this row
      const overlaps = row.some(t => task.startCol <= t.endCol && task.endCol >= t.startCol);
      if (!overlaps) {
        row.push(task);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([task]);
  }
  return rows;
}

/**
 * Calculate column positions for a task within a specific week.
 * Returns { startCol, endCol, span } or null if task doesn't overlap this week.
 */
export function getTaskWeekPosition(task, weekStart, weekEnd) {
  const taskStart = task.startDate || task.dueDate;
  const taskEnd = task.dueDate;
  const ws = weekStart.format('YYYY-MM-DD');
  const we = weekEnd.format('YYYY-MM-DD');

  // No overlap
  if (taskStart > we || taskEnd < ws) return null;

  const startCol = Math.max(0, dayjs(taskStart).diff(weekStart, 'day'));
  const endCol = Math.min(6, dayjs(taskEnd).diff(weekStart, 'day'));
  return { startCol, endCol, span: endCol - startCol + 1 };
}
