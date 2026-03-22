/**
 * localStorage adapter — replaces server API for static deployment.
 * Seeds from /sample-data.json on first visit.
 */
import dayjs from 'dayjs';

const STORAGE_KEYS = { tasks: 'app_tasks', rules: 'app_rules', settings: 'app_settings', seeded: 'app_seeded' };

/* ── Helpers ── */
const now = () => new Date().toISOString();
const todayStr = () => dayjs().format('YYYY-MM-DD');
const genId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function write(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

/* ── Seed from sample-data.json if first visit ── */
export async function ensureSeeded() {
  if (localStorage.getItem(STORAGE_KEYS.seeded)) return;
  try {
    const base = import.meta.env.BASE_URL || '/';
    const res = await fetch(`${base}sample-data.json`);
    const data = await res.json();
    write(STORAGE_KEYS.tasks, data.tasks || []);
    write(STORAGE_KEYS.rules, data.rules || {});
    write(STORAGE_KEYS.settings, data.settings || {});
    localStorage.setItem(STORAGE_KEYS.seeded, '1');
  } catch { /* offline or missing file — start empty */ }
}

/* ── Tasks CRUD ── */
export function getTasks() {
  return read(STORAGE_KEYS.tasks) || [];
}

function saveTasks(tasks) {
  write(STORAGE_KEYS.tasks, tasks);
}

export function getTaskById(id) {
  return getTasks().find(t => t.id === id) || null;
}

export function createTask(data) {
  const tasks = getTasks();
  const task = {
    id: genId('t'), name: '', game: '', project: '',
    estTime: 1, estUnit: 'd', status: 'todo', priority: 1000,
    feedbacks: [], createdAt: now(), updatedAt: now(),
    startDate: todayStr(), dueDate: todayStr(),
    ...data,
    id: data.id || genId('t'),
    updatedAt: now(),
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function createBatch(taskList) {
  const tasks = getTasks();
  const created = taskList.map(td => ({
    id: genId('t'), name: '', game: '', project: '',
    estTime: 1, estUnit: 'd', status: 'todo', priority: 1000,
    feedbacks: [], createdAt: now(),
    startDate: todayStr(), dueDate: todayStr(),
    ...td,
    id: td.id || genId('t'),
    updatedAt: now(),
  }));
  tasks.push(...created);
  saveTasks(tasks);
  return created;
}

export function updateTask(id, data) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx < 0) throw new Error('Task not found');
  tasks[idx] = { ...tasks[idx], ...data, updatedAt: now() };
  saveTasks(tasks);
  return tasks[idx];
}

export function updateTaskStatus(id, status) {
  return updateTask(id, { status });
}

export function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  return { success: true };
}

/* ── Feedback ── */
export function addFeedback(taskId, content) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx < 0) throw new Error('Task not found');
  const task = { ...tasks[idx] };
  const fb = { id: genId('fb'), content, createdAt: now(), startDate: task.dueDate, endDate: todayStr() };
  task.feedbacks = [...(task.feedbacks || []), fb];

  // Auto-extend: parse time from content
  const timeMatch = content.match(/(\d+(?:\.\d+)?)\s*(d|h|hr|hrs|day|days|hour|hours?)$/i);
  let extended = false;
  if (timeMatch) {
    const extra = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].startsWith('h') ? 'h' : 'd';
    const extraDays = unit === 'h' ? Math.ceil(extra / 8) : Math.ceil(extra);
    task.estTime += unit === task.estUnit ? extra : (unit === 'h' ? extra / 8 : extra * 8);
    task.dueDate = dayjs(task.dueDate).add(extraDays, 'day').format('YYYY-MM-DD');
    extended = true;
  }

  task.updatedAt = now();
  tasks[idx] = task;
  saveTasks(tasks);
  return { task, feedback: fb, extended };
}

export function deleteFeedback(taskId, fbId) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx < 0) throw new Error('Task not found');
  const task = { ...tasks[idx] };
  task.feedbacks = (task.feedbacks || []).filter(f => f.id !== fbId);
  task.updatedAt = now();
  tasks[idx] = task;
  saveTasks(tasks);
  return { task };
}

export function updateFeedbackData(taskId, fbId, data) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx < 0) throw new Error('Task not found');
  const task = { ...tasks[idx] };
  task.feedbacks = (task.feedbacks || []).map(f => f.id === fbId ? { ...f, ...data } : f);
  task.updatedAt = now();
  tasks[idx] = task;
  saveTasks(tasks);
  return { task, feedback: task.feedbacks.find(f => f.id === fbId) };
}

/* ── Queries ── */
export function getTodayTasks() {
  const tasks = getTasks();
  const today = todayStr();
  const active = tasks.filter(t => t.status !== 'done');

  const todayTasks = active.filter(t => (t.startDate || t.dueDate) <= today && t.dueDate >= today);
  const overdue = active.filter(t => t.dueDate < today);
  const upcoming = active.filter(t => (t.startDate || t.dueDate) > today)
    .sort((a, b) => (a.startDate || a.dueDate).localeCompare(b.startDate || b.dueDate))
    .slice(0, 10);

  return { today: todayTasks, overdue, upcoming };
}

export function getCalendarTasks(from, to) {
  const tasks = getTasks();
  return tasks.filter(t => (t.startDate || t.dueDate) <= to && t.dueDate >= from);
}

/* ── Parser (client-side, simplified) ── */
export function parseRawText(rawText, rules = {}) {
  const separator = rules.contextSeparator || ' - ';
  const defaultEst = rules.defaultEstTime || 1;
  const defaultUnit = rules.defaultEstUnit || 'd';
  const lines = rawText.split('\n').filter(l => l.trim());
  const parsed = [];
  const warnings = [];
  let game = '', project = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Context line: contains separator, no time suffix
    if (trimmed.includes(separator) && !/\d+(?:\.\d+)?\s*(d|h)$/i.test(trimmed)) {
      const sepIdx = trimmed.indexOf(separator);
      game = trimmed.slice(0, sepIdx).trim();
      project = trimmed.slice(sepIdx + separator.length).trim();
      continue;
    }
    // Task line
    const timeMatch = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(d|h|hr|hrs|day|days|hour|hours?)$/i);
    let name, estTime, estUnit;
    if (timeMatch) {
      name = timeMatch[1].trim();
      estTime = parseFloat(timeMatch[2]);
      estUnit = timeMatch[3].startsWith('h') ? 'h' : 'd';
    } else {
      name = trimmed;
      estTime = defaultEst;
      estUnit = defaultUnit;
    }
    if (!name) continue;

    const startDate = todayStr();
    const days = estUnit === 'h' ? Math.ceil(estTime / 8) : Math.ceil(estTime);
    const dueDate = dayjs().add(days, 'day').format('YYYY-MM-DD');

    parsed.push({
      id: genId('t'), name, game, project, estTime, estUnit,
      startDate, dueDate, status: 'todo', priority: 1000,
      feedbacks: [], createdAt: now(), updatedAt: now(),
    });
  }
  return { parsed, warnings };
}

/* ── Feedback detection (simplified) ── */
export function detectFeedbackLocal(text, rules = {}) {
  const keywords = rules.feedbackKeywords || [];
  const matched = keywords.find(kw => text.toLowerCase().includes(kw.toLowerCase()));
  if (!matched) return { isFeedback: false };

  // Find matching task
  const tasks = getTasks().filter(t => t.status !== 'done');
  const ref = text.toLowerCase().replace(matched.toLowerCase(), '').replace(/^[\s\-:\/]+/, '').trim();
  if (!ref) return { isFeedback: false };

  let best = null, bestScore = 0;
  for (const t of tasks) {
    const name = t.name.toLowerCase();
    const score = name.includes(ref) ? 0.9 : ref.includes(name) ? 0.8 : 0;
    if (score > bestScore) { bestScore = score; best = t; }
  }

  const threshold = rules.similarityThreshold || 0.6;
  if (best && bestScore >= threshold) {
    return { isFeedback: true, targetTask: best, confidence: bestScore, feedbackContent: text };
  }
  return { isFeedback: false };
}

/* ── KPI ── */
export function computeKPI(from, to) {
  const tasks = getTasks();
  const today = todayStr();
  const inRange = tasks.filter(t => {
    const d = (t.updatedAt || t.createdAt || '').slice(0, 10);
    return d >= from && d <= to;
  });

  const completed = inRange.filter(t => t.status === 'done');
  const overdueCount = inRange.filter(t => t.status !== 'done' && t.dueDate < today).length;
  const totalTasks = inRange.length;

  const byGame = {}, byProject = {}, byGameTasks = {};
  for (const t of inRange) {
    byGame[t.game || 'Unknown'] = (byGame[t.game || 'Unknown'] || 0) + 1;
    byProject[t.project || 'Unknown'] = (byProject[t.project || 'Unknown'] || 0) + 1;
  }
  for (const t of completed) {
    const g = t.game || 'Unknown';
    if (!byGameTasks[g]) byGameTasks[g] = [];
    byGameTasks[g].push(t.name);
  }

  const totalEstDays = inRange.reduce((s, t) => s + (t.estUnit === 'h' ? t.estTime / 8 : t.estTime), 0);

  return {
    period: { from, to },
    summary: {
      totalTasks, completed: completed.length,
      completionRate: totalTasks ? Math.round((completed.length / totalTasks) * 100) : 0,
      overdueCount, overdueRate: totalTasks ? Math.round((overdueCount / totalTasks) * 100) : 0,
      totalEstDays: Math.round(totalEstDays * 10) / 10,
      byGame, byProject, byGameTasks,
      completedDetails: completed.map(t => ({ name: t.name, game: t.game, project: t.project, estTime: t.estTime, estUnit: t.estUnit })),
    },
  };
}

/* ── Archive ── */
export function archiveDoneTasks() {
  const tasks = getTasks();
  const done = tasks.filter(t => t.status === 'done');
  const remaining = tasks.filter(t => t.status !== 'done');
  const archived = read('app_archive') || [];
  archived.push(...done);
  write('app_archive', archived);
  saveTasks(remaining);
  return { archived: done.length, remaining: remaining.length };
}

/* ── Rules & Settings ── */
export function getRules() {
  return read(STORAGE_KEYS.rules) || { workingDays: [1,2,3,4,5], priorityRules: [], prioritySortFallback: 'estTime_desc' };
}

export function saveRules(data) {
  write(STORAGE_KEYS.rules, data);
  return data;
}

export function getSettings() {
  return read(STORAGE_KEYS.settings) || { hoursPerDay: 8 };
}

export function saveSettings(data) {
  write(STORAGE_KEYS.settings, data);
  return data;
}
