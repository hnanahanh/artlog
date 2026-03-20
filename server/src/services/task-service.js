import { readTasks, writeTasks } from '../storage/json-storage-adapter.js';
import { nowISO, today } from '../utils/date-utils.js';
import { recalculateDueDate } from './due-date-calculator-service.js';

// Get single task by id
export function getTaskById(id) {
  const tasks = readTasks();
  return tasks.find(t => t.id === id) || null;
}

// Create single task
export function createTask(taskData) {
  const tasks = readTasks();
  const task = {
    id: taskData.id || `t_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name: taskData.name || '',
    project: taskData.project || '',
    game: taskData.game || '',
    estTime: taskData.estTime || 0,
    estUnit: taskData.estUnit || 'd',
    startDate: taskData.startDate || today(),
    dueDate: taskData.dueDate || today(),
    status: taskData.status || 'todo',
    priority: taskData.priority || 0,
    feedbacks: taskData.feedbacks || [],
    createdAt: taskData.createdAt || nowISO(),
    updatedAt: nowISO(),
  };
  tasks.push(task);
  writeTasks(tasks);
  return task;
}

// Batch create tasks (from parser)
export function createTasksBatch(taskList) {
  const tasks = readTasks();
  const created = [];
  for (const td of taskList) {
    const task = { ...td, updatedAt: nowISO() };
    tasks.push(task);
    created.push(task);
  }
  writeTasks(tasks);
  return created;
}

// Update task by id
export function updateTask(id, updates) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  const task = { ...tasks[idx], ...updates, updatedAt: nowISO() };

  // Recalculate due date if est or start changed (skip if dueDate explicitly provided)
  if (updates.dueDate === undefined && (updates.estTime !== undefined || updates.estUnit !== undefined || updates.startDate !== undefined)) {
    task.dueDate = recalculateDueDate(task);
  }

  tasks[idx] = task;
  writeTasks(tasks);
  return task;
}

// Quick status update (for Kanban drag)
export function updateTaskStatus(id, status) {
  return updateTask(id, { status });
}

// Delete task
export function deleteTask(id) {
  const tasks = readTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  writeTasks(filtered);
  return true;
}
