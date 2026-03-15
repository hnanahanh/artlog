import { readTasks, writeTasks } from '../storage/json-storage-adapter.js';
import { nowISO } from '../utils/date-utils.js';
import { recalculateDueDate } from './due-date-calculator-service.js';

const TIME_REGEX = /(\d+(?:\.\d+)?)\s*(d|h|hr|hrs|day|days|hour|hours?)$/i;

// Parse time estimate from feedback content (e.g., "fix shadow 1d" → {time:1, unit:'d'})
function parseTimeFromContent(content) {
  const match = content.trim().match(TIME_REGEX);
  if (!match) return null;
  const time = parseFloat(match[1]);
  const raw = match[2].toLowerCase();
  const unit = ['d', 'day', 'days'].includes(raw) ? 'd' : 'h';
  return { time, unit };
}

// Add feedback to task - extends due date if feedback has time estimate
export function addFeedback(taskId, content) {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const feedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    content,
    createdAt: nowISO(),
  };
  task.feedbacks.push(feedback);
  task.updatedAt = nowISO();

  // Extend due date if feedback contains time estimate
  const extraTime = parseTimeFromContent(content);
  if (extraTime) {
    const newEst = task.estTime + (extraTime.unit === task.estUnit
      ? extraTime.time
      : extraTime.unit === 'h' ? extraTime.time / 8 : extraTime.time * 8);
    task.estTime = newEst;
    task.dueDate = recalculateDueDate(task);
  }

  writeTasks(tasks);
  return { task, feedback, extended: !!extraTime };
}

// Delete a specific feedback from task
export function deleteFeedback(taskId, feedbackId) {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  const idx = task.feedbacks.findIndex(fb => fb.id === feedbackId);
  if (idx === -1) return null;
  task.feedbacks.splice(idx, 1);
  task.updatedAt = nowISO();
  writeTasks(tasks);
  return { task };
}

// Update feedback content and/or date
export function updateFeedback(taskId, feedbackId, data) {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  const fb = task.feedbacks.find(f => f.id === feedbackId);
  if (!fb) return null;
  if (data.content) fb.content = data.content;
  if (data.createdAt) fb.createdAt = data.createdAt;
  task.updatedAt = nowISO();
  writeTasks(tasks);
  return { task, feedback: fb };
}
