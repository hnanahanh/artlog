/**
 * Task API Client — localStorage-based (no server required).
 * Drop-in replacement: same function signatures as original axios-based client.
 * Seeds from /sample-data.json on first visit.
 */
import {
  ensureSeeded, getTasks, getTaskById, createTask as _create, createBatch,
  updateTask as _update, updateTaskStatus as _updateStatus, deleteTask as _delete,
  addFeedback as _addFb, deleteFeedback as _delFb, updateFeedbackData,
  getTodayTasks, getCalendarTasks, parseRawText, detectFeedbackLocal,
  computeKPI, archiveDoneTasks,
  getRules, saveRules, getSettings, saveSettings,
} from './local-storage-adapter.js';

/* Ensure sample data is seeded on first load */
const seedPromise = ensureSeeded();
const afterSeed = (fn) => seedPromise.then(fn);

/* ── Tasks ── */
export const fetchTasks = (params) => afterSeed(() => {
  let tasks = getTasks();
  if (params?.status) tasks = tasks.filter(t => t.status === params.status);
  if (params?.project) tasks = tasks.filter(t => t.project === params.project);
  return tasks;
});

export const fetchTaskById = (id) => afterSeed(() => getTaskById(id));
export const createTask = (data) => afterSeed(() => _create(data));
export const createTasksBatch = (tasks) => afterSeed(() => _create ? createBatch(tasks) : []);
export const updateTask = (id, data) => afterSeed(() => _update(id, data));
export const updateTaskStatus = (id, status) => afterSeed(() => _updateStatus(id, status));
export const deleteTask = (id) => afterSeed(() => _delete(id));

/* ── Feedback ── */
export const addFeedback = (id, content) => afterSeed(() => _addFb(id, content));
export const deleteFeedback = (taskId, fbId) => afterSeed(() => _delFb(taskId, fbId));
export const updateFeedback = (taskId, fbId, data) => afterSeed(() => updateFeedbackData(taskId, fbId, data));

/* ── Smart Parser ── */
export const parseRawInput = (rawText) => afterSeed(() => {
  const rules = getRules();
  return parseRawText(rawText, rules);
});

export const detectFeedback = (text) => afterSeed(() => {
  const rules = getRules();
  return detectFeedbackLocal(text, rules);
});

/* ── Today / Calendar ── */
export const fetchTodayTasks = () => afterSeed(() => getTodayTasks());
export const fetchCalendarTasks = (from, to) => afterSeed(() => getCalendarTasks(from, to));

/* ── Archive ── */
export const archiveTasks = () => afterSeed(() => archiveDoneTasks());

/* ── KPI ── */
export const fetchKPI = (from, to) => afterSeed(() => computeKPI(from, to));

/* KPI CSV — generate client-side download */
export const getKPICsvUrl = (from, to) => {
  // Return a data URL or # — CSV export handled differently without server
  return '#';
};

/* ── Settings & Rules ── */
export const fetchSettings = () => afterSeed(() => getSettings());
export const updateSettings = (data) => afterSeed(() => saveSettings(data));
export const fetchRules = () => afterSeed(() => getRules());
export const updateRules = (data) => afterSeed(() => saveRules(data));
