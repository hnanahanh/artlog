import { readTasks } from '../storage/json-storage-adapter.js';
import { today } from '../utils/date-utils.js';
import { sortByPriority } from './priority-engine-service.js';

// Get all tasks with optional filters
export function getTasks(filters = {}) {
  let tasks = readTasks();

  if (filters.status) {
    tasks = tasks.filter(t => t.status === filters.status);
  }
  if (filters.game) {
    tasks = tasks.filter(t => t.game?.toLowerCase() === filters.game.toLowerCase());
  }
  if (filters.project) {
    tasks = tasks.filter(t => t.project?.toLowerCase() === filters.project.toLowerCase());
  }

  return sortByPriority(tasks);
}

// Get today's tasks + overdue + upcoming
// "today" = task whose date range covers today (startDate <= today <= dueDate)
export function getTodayTasks() {
  const tasks = readTasks();
  const todayStr = today();
  const active = tasks.filter(t => t.status !== 'done');

  const todayTasks = active.filter(t => (t.startDate || t.dueDate) <= todayStr && t.dueDate >= todayStr);
  const overdue = active.filter(t => t.dueDate < todayStr);
  const upcoming = active.filter(t => (t.startDate || t.dueDate) > todayStr)
    .sort((a, b) => (a.startDate || a.dueDate).localeCompare(b.startDate || b.dueDate))
    .slice(0, 10);

  return {
    today: sortByPriority(todayTasks),
    overdue: sortByPriority(overdue),
    upcoming,
  };
}

// Get tasks in date range (calendar) — overlap logic: startDate <= to AND dueDate >= from
export function getTasksByDateRange(from, to) {
  const tasks = readTasks();
  return tasks.filter(t => (t.startDate || t.dueDate) <= to && t.dueDate >= from);
}
