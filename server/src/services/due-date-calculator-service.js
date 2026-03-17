import { addDays, formatDate, isWorkingDay } from '../utils/date-utils.js';
import { readRules, readSettings } from '../storage/json-storage-adapter.js';

// Calculate due date from start date, skipping non-working days
export function calculateDueDate(startDate, estTime, estUnit) {
  const rules = readRules();
  const settings = readSettings();
  const workingDays = rules?.workingDays || [1, 2, 3, 4, 5];
  const hoursPerDay = settings?.hoursPerDay || 8;

  let daysNeeded;
  if (estUnit === 'h') {
    daysNeeded = Math.ceil(estTime / hoursPerDay);
  } else {
    daysNeeded = Math.ceil(estTime);
  }

  if (daysNeeded <= 0) return formatDate(startDate);

  let current = new Date(startDate);
  let added = 0;

  while (added < daysNeeded) {
    current = addDays(current, 1);
    if (isWorkingDay(current, workingDays)) {
      added++;
    }
  }

  return formatDate(current);
}

// Recalculate due date when start date or est changes
export function recalculateDueDate(task) {
  if (!task.startDate || !task.estTime) return task.dueDate;
  return calculateDueDate(task.startDate, task.estTime, task.estUnit || 'd');
}
