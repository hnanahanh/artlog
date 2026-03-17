import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Tasks
export const fetchTasks = (params) => api.get('/tasks', { params }).then(r => r.data);
export const fetchTaskById = (id) => api.get(`/tasks/${id}`).then(r => r.data);
export const createTask = (data) => api.post('/tasks', data).then(r => r.data);
export const createTasksBatch = (tasks) => api.post('/tasks/batch', { tasks }).then(r => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data);
export const updateTaskStatus = (id, status) => api.put(`/tasks/${id}/status`, { status }).then(r => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data);
export const addFeedback = (id, content) => api.post(`/tasks/${id}/feedback`, { content }).then(r => r.data);
export const deleteFeedback = (taskId, fbId) => api.delete(`/tasks/${taskId}/feedback/${fbId}`).then(r => r.data);
export const updateFeedback = (taskId, fbId, data) => api.put(`/tasks/${taskId}/feedback/${fbId}`, data).then(r => r.data);

// Smart Parser
export const parseRawInput = (rawText) => api.post('/tasks/parse', { rawText }).then(r => r.data);
export const detectFeedback = (text) => api.post('/tasks/detect-feedback', { text }).then(r => r.data);

// Today / Calendar
export const fetchTodayTasks = () => api.get('/tasks/today').then(r => r.data);
export const fetchCalendarTasks = (from, to) => api.get('/tasks/calendar', { params: { from, to } }).then(r => r.data);

// Archive
export const archiveTasks = () => api.post('/tasks/archive').then(r => r.data);

// KPI
export const fetchKPI = (from, to) => api.get('/kpi/export', { params: { from, to } }).then(r => r.data);
export const getKPICsvUrl = (from, to) => `/api/kpi/export-csv?from=${from}&to=${to}`;

// Settings & Rules
export const fetchSettings = () => api.get('/settings').then(r => r.data);
export const updateSettings = (data) => api.put('/settings', data).then(r => r.data);
export const fetchRules = () => api.get('/rules').then(r => r.data);
export const updateRules = (data) => api.put('/rules', data).then(r => r.data);
