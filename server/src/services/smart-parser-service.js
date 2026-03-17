import { today, nowISO } from '../utils/date-utils.js';
import { calculateDueDate } from './due-date-calculator-service.js';
import { computePriority } from './priority-engine-service.js';
import { readRules } from '../storage/json-storage-adapter.js';

// Regex to match time suffix at end of line: "1d", "3.5h", "2hr", "1day"
const TIME_REGEX = /(\d+(?:\.\d+)?)\s*(d|h|hr|hrs|day|days|hour|hours?)$/i;

// Generate unique task ID
function generateId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 5);
  return `t_${ts}_${rand}`;
}

// Normalize time unit to "d" or "h"
function normalizeUnit(raw) {
  const u = raw.toLowerCase();
  if (['d', 'day', 'days'].includes(u)) return 'd';
  if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(u)) return 'h';
  return 'd';
}

// Map numeric priority score to text label
export function getPriorityLabel(score) {
  if (score < 900) return 'high';
  if (score < 950) return 'medium';
  return 'low';
}

// Check if line is a context line: contains separator and NO time suffix
function isContextLine(line, separator) {
  return line.includes(separator) && !TIME_REGEX.test(line);
}

// Parse a task line: extract name + estTime/estUnit (configurable default)
function parseTaskLine(line, defaultEstTime, defaultEstUnit) {
  const match = line.match(TIME_REGEX);
  if (match) {
    const name = line.replace(TIME_REGEX, '').trim();
    const estTime = parseFloat(match[1]);
    const estUnit = normalizeUnit(match[2]);
    return { name, estTime, estUnit };
  }
  return { name: line, estTime: defaultEstTime, estUnit: defaultEstUnit };
}

// Check if task name contains feedback keywords from rules.json
function checkIsFeedback(taskName) {
  const rules = readRules();
  const keywords = rules.feedbackKeywords || [];
  const lower = taskName.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// Main entry: parse multi-line raw text into structured tasks
// Format:
//   Game - Project
//   TaskName EstTime
//   TaskName (defaults to 1d)
export function parseRawInput(rawText) {
  const rules = readRules();
  const separator = rules.contextSeparator || ' - ';
  const defaultEstTime = rules.defaultEstTime || 1;
  const defaultEstUnit = rules.defaultEstUnit || 'd';

  const lines = rawText.split('\n').filter(l => l.trim());
  const allTasks = [];
  const warnings = [];
  let context = { game: '', project: '' };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (isContextLine(line, separator)) {
      const parts = line.split(separator);
      context.game = parts[0].trim();
      context.project = parts.slice(1).join(separator).trim();
      continue;
    }

    // Task line
    try {
      const { name, estTime, estUnit } = parseTaskLine(line, defaultEstTime, defaultEstUnit);
      if (!name) {
        warnings.push(`Line ${i + 1}: empty task name`);
        continue;
      }

      const startDate = today();
      const dueDate = calculateDueDate(startDate, estTime, estUnit);
      const task = {
        id: generateId(),
        name,
        project: context.project,
        game: context.game,
        estTime,
        estUnit,
        startDate,
        dueDate,
        status: 'todo',
        priority: 0,
        priorityLabel: 'low',
        feedbacks: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      task.priority = computePriority(task);
      task.priorityLabel = getPriorityLabel(task.priority);
      task.isFeedback = checkIsFeedback(name);
      allTasks.push(task);
    } catch (err) {
      warnings.push(`Line ${i + 1}: ${err.message}`);
    }
  }

  return { parsed: allTasks, warnings };
}
