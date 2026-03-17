import { readRules } from '../storage/json-storage-adapter.js';

// Compute priority score for a task based on rules.json
// Lower score = higher priority
export function computePriority(task) {
  const rules = readRules();
  const priorityRules = rules?.priorityRules || [];
  const fallback = rules?.prioritySortFallback || 'estTime_desc';

  let score = 1000;

  // Apply rule-based boosts
  for (const rule of priorityRules) {
    const fieldValue = String(task[rule.field] || '').toLowerCase();
    if (fieldValue.includes(rule.contains.toLowerCase())) {
      score += rule.boost; // negative boost = higher priority
    }
  }

  // Fallback: longer estTime = higher priority (lower score)
  if (fallback === 'estTime_desc') {
    const hours = toHours(task.estTime, task.estUnit);
    score -= hours;
  }

  return Math.round(score);
}

// Apply priority to array of tasks and sort
export function sortByPriority(tasks) {
  return tasks
    .map(t => ({ ...t, priority: computePriority(t) }))
    .sort((a, b) => a.priority - b.priority);
}

function toHours(estTime, estUnit) {
  if (!estTime) return 0;
  return estUnit === 'h' ? estTime : estTime * 8;
}
